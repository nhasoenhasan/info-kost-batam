import { describe, it, expect } from 'vitest'
import { activeFilterCount, filterKosts, sortKosts } from '@/lib/filter'
import { DEFAULT_FILTERS, type KostListItem } from '@/lib/types'

const data: KostListItem[] = [
  {
    id: '1',
    slug: 'a',
    alamat: 'Ruko Aljabar',
    area: 'Bengkong',
    jenis: 'Kost',
    kriteria: 'Putri',
    harga: 450000,
    wa: '6281',
  },
  {
    id: '2',
    slug: 'b',
    alamat: 'Bengkong Polisi',
    area: 'Bengkong',
    jenis: 'Kost',
    kriteria: 'Campur',
    harga: 1800000,
    wa: '6282',
  },
  {
    id: '3',
    slug: 'c',
    alamat: 'Taman Mediterania',
    area: 'Batam Center',
    jenis: 'Kontrakan',
    kriteria: 'Campur',
    harga: 2200000,
    wa: null,
  },
]

describe('filterKosts', () => {
  it('tanpa filter mengembalikan semua', () => {
    expect(filterKosts(data, DEFAULT_FILTERS)).toHaveLength(3)
  })
  it('filter area', () => {
    expect(filterKosts(data, { ...DEFAULT_FILTERS, area: ['Bengkong'] })).toHaveLength(2)
  })
  it('filter kriteria multi-pilih', () => {
    expect(filterKosts(data, { ...DEFAULT_FILTERS, kriteria: ['Putri', 'Campur'] })).toHaveLength(3)
  })
  it('filter jenis', () => {
    expect(filterKosts(data, { ...DEFAULT_FILTERS, jenis: ['Kontrakan'] })).toHaveLength(1)
  })
  it('budget maksimum', () => {
    expect(filterKosts(data, { ...DEFAULT_FILTERS, maxHarga: 1_000_000 }).map((r) => r.slug)).toEqual(['a'])
  })
  it('budget minimum', () => {
    expect(filterKosts(data, { ...DEFAULT_FILTERS, minHarga: 2_000_000 }).map((r) => r.slug)).toEqual(['c'])
  })
  it('pencarian tidak peduli huruf besar/kecil', () => {
    expect(filterKosts(data, { ...DEFAULT_FILTERS, q: 'ALJABAR' })).toHaveLength(1)
  })
  it('pencarian cocok juga di nama area', () => {
    expect(filterKosts(data, { ...DEFAULT_FILTERS, q: 'batam center' })).toHaveLength(1)
  })
  it('listing tanpa harga tidak dibuang oleh filter budget', () => {
    const tanpaHarga = [{ ...data[0], harga: null }]
    expect(filterKosts(tanpaHarga, { ...DEFAULT_FILTERS, maxHarga: 500_000 })).toHaveLength(1)
  })
  it('gabungan filter yang tidak ada hasilnya mengembalikan array kosong', () => {
    expect(filterKosts(data, { ...DEFAULT_FILTERS, area: ['Bengkong'], jenis: ['Kontrakan'] })).toHaveLength(0)
  })
})

describe('sortKosts', () => {
  it('termurah dulu', () => {
    expect(sortKosts(data, 'termurah').map((r) => r.slug)).toEqual(['a', 'b', 'c'])
  })
  it('termahal dulu', () => {
    expect(sortKosts(data, 'termahal').map((r) => r.slug)).toEqual(['c', 'b', 'a'])
  })
  it('listing tanpa harga selalu di akhir', () => {
    const withNull = [...data, { ...data[0], slug: 'z', harga: null }]
    expect(sortKosts(withNull, 'termurah').at(-1)?.slug).toBe('z')
    expect(sortKosts(withNull, 'termahal').at(-1)?.slug).toBe('z')
  })
  it('urutan "relevan" mempertahankan urutan asli data', () => {
    expect(sortKosts(data, 'relevan').map((r) => r.slug)).toEqual(['a', 'b', 'c'])
  })
  it('tidak memutasi array asli', () => {
    const copy = [...data]
    sortKosts(data, 'termahal')
    expect(data).toEqual(copy)
  })
})

describe('activeFilterCount', () => {
  it('nol kalau tidak ada filter', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0)
  })
  it('menghitung q, area, jenis, kriteria, dan budget', () => {
    expect(
      activeFilterCount({
        ...DEFAULT_FILTERS,
        q: 'nagoya',
        area: ['Nagoya'],
        kriteria: ['Campur', 'Putri'],
        maxHarga: 1_000_000,
      }),
    ).toBe(5)
  })
})
