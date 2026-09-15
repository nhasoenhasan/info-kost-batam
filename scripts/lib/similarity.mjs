/**
 * Deteksi kemiripan alamat untuk MENANDAI (bukan menggabungkan) listing ganda.
 *
 * Pipeline inti (dedupe.mjs) cuma menggabungkan alamat yang identik setelah
 * dinormalisasi. Dua baris seperti:
 *   "Perumahan Bambu Kuning Puskopkar A13 No 17, Belakang UNRIKA"
 *   "Perum Puskopkar Bambu Kuning A13 Nomor 17 Belakang UNRIKA"
 * lolos dari dedupe itu, padahal jelas properti yang sama.
 *
 * Karena penggabungan otomatis berbasis kemiripan berisiko menelan dua listing
 * berbeda, fungsi di sini hanya MELAPORKAN pasangan yang mencurigakan supaya
 * admin bisa memutuskan.
 */

/** @param {string} text */
export function tokenize(text) {
  return new Set(
    String(text ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter((w) => w.length > 2),
  )
}

/** Jaccard: irisan / gabungan kata. 0 = tidak mirip, 1 = identik. */
export function jaccard(a, b) {
  const A = a instanceof Set ? a : tokenize(a)
  const B = b instanceof Set ? b : tokenize(b)
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  for (const w of A) if (B.has(w)) inter++
  return inter / (A.size + B.size - inter)
}

/**
 * @template {{ no: number, alamat: string, wa: string|null, harga: number|null }} T
 * @param {T[]} records
 * @param {number} [threshold]
 */
export function findSuspectDuplicates(records, threshold = 0.6) {
  const out = []
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const a = records[i]
      const b = records[j]
      const sameWa = Boolean(a.wa) && a.wa === b.wa
      const sameHarga = a.harga !== null && a.harga === b.harga
      // hanya pasangan yang punya penanda kuat (nomor atau harga sama)
      if (!sameWa && !sameHarga) continue

      const similarity = jaccard(a.alamat, b.alamat)
      if (similarity < threshold) continue

      out.push({
        noA: a.no,
        noB: b.no,
        similarity: Number(similarity.toFixed(2)),
        sameWa,
        sameHarga,
        alamatA: a.alamat,
        alamatB: b.alamat,
      })
    }
  }
  return out.sort((x, y) => y.similarity - x.similarity)
}
