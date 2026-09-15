import { describe, it, expect } from 'vitest'
import { breadcrumbJsonLd, formatRupiah, formatRupiahShort, itemListJsonLd } from '@/lib/seo'
import { areasByCount, allKosts, listingIndex, priceRange, report } from '@/lib/kost'

describe('formatRupiah', () => {
  it('tanpa desimal dan pakai pemisah titik', () => {
    expect(formatRupiah(1_800_000)).toBe('Rp1.800.000')
  })
  it('null jatuh ke teks ajakan menghubungi pemilik', () => {
    expect(formatRupiah(null)).toBe('Hubungi pemilik')
  })
})

describe('formatRupiahShort', () => {
  it('juta bulat', () => expect(formatRupiahShort(2_000_000)).toBe('2jt'))
  it('juta dengan desimal pakai koma', () => expect(formatRupiahShort(1_500_000)).toBe('1,5jt'))
  it('ratusan ribu jadi rb', () => expect(formatRupiahShort(750_000)).toBe('750rb'))
  it('null ditangani', () => expect(formatRupiahShort(null)).toBe('Tanpa harga'))
})

describe('itemListJsonLd', () => {
  it('menghasilkan schema.org ItemList dengan URL absolut', () => {
    const ld = itemListJsonLd([listingIndex[0]])
    expect(ld['@type']).toBe('ItemList')
    expect(ld.itemListElement[0].item.url).toBe(`https://kost.nhasan.tech/kost/${listingIndex[0].slug}/`)
  })
  it('TIDAK memuat harga, supaya Google tidak menampilkan harga basi sebagai fakta', () => {
    const json = JSON.stringify(itemListJsonLd(listingIndex.slice(0, 5)))
    expect(json).not.toContain('price')
  })
})

describe('breadcrumbJsonLd', () => {
  it('memberi posisi berurutan', () => {
    const ld = breadcrumbJsonLd([
      { name: 'Semua kost', path: '/' },
      { name: 'Kost Bengkong', path: '/area/bengkong/' },
    ])
    expect(ld.itemListElement[1]).toMatchObject({
      position: 2,
      item: 'https://kost.nhasan.tech/area/bengkong/',
    })
  })
})

describe('integritas data hasil sync', () => {
  it('semua listing punya area yang masuk daftar area', () => {
    const known = new Set(areasByCount.map((a) => a.area))
    for (const k of allKosts) expect(known.has(k.area)).toBe(true)
  })
  it('tidak ada slug duplikat', () => {
    expect(new Set(allKosts.map((k) => k.slug)).size).toBe(allKosts.length)
  })
  it('nomor WA selalu diawali 62 dan tidak ada yang kosong', () => {
    const tanpaWa = allKosts.filter((k) => !k.wa)
    expect(tanpaWa).toHaveLength(0)
    for (const k of allKosts) expect(k.wa!.startsWith('62')).toBe(true)
  })
  it('tidak ada harga di bawah 100rb (sisa nilai aneh dari sheet)', () => {
    for (const k of allKosts) {
      if (k.harga !== null) expect(k.harga).toBeGreaterThanOrEqual(100_000)
    }
  })
  it('tidak ada teks rusak dari formula spreadsheet yang bocor ke data', () => {
    const json = JSON.stringify(allKosts)
    expect(json).not.toContain('#VALUE!')
    expect(json).not.toContain('#REF!')
  })
  it('report konsisten dengan jumlah listing', () => {
    expect(report.kept).toBe(allKosts.length)
    expect(priceRange.min).toBeLessThan(priceRange.max)
  })
  it('semua listing pada payload client punya field yang dibutuhkan kartu', () => {
    for (const item of listingIndex) {
      expect(item.slug).toBeTruthy()
      expect(item.alamat).toBeTruthy()
      expect(item.area).toBeTruthy()
    }
  })
})
