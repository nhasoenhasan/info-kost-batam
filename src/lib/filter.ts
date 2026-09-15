import type { FilterState, KostListItem, SortOption } from './types'

const haystack = (r: KostListItem) =>
  `${r.alamat} ${r.area} ${r.jenis} ${r.kriteria}`.toLowerCase()

/**
 * Filter murni (tanpa React) supaya gampang di-unit-test.
 * Catatan: listing tanpa harga TIDAK disembunyikan oleh filter budget —
 * datanya tetap berguna ("harga belum ada, tanya pemilik").
 */
export function filterKosts(records: KostListItem[], f: FilterState): KostListItem[] {
  const q = f.q.trim().toLowerCase()
  return records.filter((r) => {
    if (q && !haystack(r).includes(q)) return false
    if (f.area.length && !f.area.includes(r.area)) return false
    if (f.jenis.length && !f.jenis.includes(r.jenis)) return false
    if (f.kriteria.length && !f.kriteria.includes(r.kriteria)) return false
    if (r.harga !== null) {
      if (f.minHarga !== null && r.harga < f.minHarga) return false
      if (f.maxHarga !== null && r.harga > f.maxHarga) return false
    }
    return true
  })
}

export function sortKosts(records: KostListItem[], sort: SortOption): KostListItem[] {
  if (sort === 'relevan') return records
  const dir = sort === 'termurah' ? 1 : -1
  return [...records].sort((a, b) => {
    if (a.harga === null && b.harga === null) return 0
    if (a.harga === null) return 1
    if (b.harga === null) return -1
    return (a.harga - b.harga) * dir
  })
}

export function activeFilterCount(f: FilterState): number {
  return (
    (f.q.trim() ? 1 : 0) +
    f.area.length +
    f.jenis.length +
    f.kriteria.length +
    (f.minHarga !== null || f.maxHarga !== null ? 1 : 0)
  )
}
