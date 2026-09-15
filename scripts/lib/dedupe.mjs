const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/**
 * Kunci deteksi duplikat: area + alamat ternormalisasi.
 * @param {{ area: string, alamat: string }} r
 */
export function dedupeKey(r) {
  return `${norm(r.area)}|${norm(r.alamat)}`
}

/**
 * Gabungkan baris yang alamatnya sama (pemilik mengiklankan kamar lebih dari sekali).
 *
 * Aturan penting: **harga baris pertama dipertahankan apa adanya** — kalau dua baris
 * menyebut harga berbeda, kita catat perbedaannya sebagai `hargaAlternatif` untuk
 * ditinjau admin. Kita tidak menghitung rata-rata karena itu artinya mengarang harga
 * yang tidak pernah disebut pemilik.
 *
 * @template {{ no: number, alamat: string, area: string, harga: number|null, wa: string|null }} T
 * @param {T[]} records
 */
export function mergeDuplicates(records) {
  /** @type {Map<string, any>} */
  const map = new Map()
  const duplicatesMerged = []

  for (const r of records) {
    const key = dedupeKey(r)
    const found = map.get(key)

    if (!found) {
      map.set(key, { ...r, hargaAlternatif: r.harga === null ? [] : [r.harga], altWa: [] })
      continue
    }

    if (r.harga !== null && !found.hargaAlternatif.includes(r.harga)) {
      found.hargaAlternatif.push(r.harga)
    }
    // lengkapi data yang kosong di baris pertama
    if (!found.wa && r.wa) found.wa = r.wa
    if (found.harga === null && r.harga !== null) found.harga = r.harga
    if (r.wa && r.wa !== found.wa && !found.altWa.includes(r.wa)) found.altWa.push(r.wa)

    found.reviewNotes = [...(found.reviewNotes ?? []), `duplikat dari baris #${r.no}`]
    found.needsReview = found.needsReview || r.harga !== found.hargaAlternatif[0]

    duplicatesMerged.push({
      keptNo: found.no,
      mergedNo: r.no,
      reason: 'area + alamat identik',
      hargaAlternatif: [...found.hargaAlternatif],
    })
  }

  return { unique: [...map.values()], duplicatesMerged }
}
