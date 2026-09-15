import { describe, it, expect } from 'vitest'
import { tokenize, jaccard, findSuspectDuplicates } from '../../scripts/lib/similarity.mjs'

describe('tokenize', () => {
  it('membuang kata pendek dan tanda baca', () => {
    const t = tokenize('Perum. Bambu Kuning A13 No 17, Batam')
    expect(t.has('perum')).toBe(true)
    expect(t.has('bambu')).toBe(true)
    expect(t.has('no')).toBe(false) // 2 huruf
    expect(t.has('a13')).toBe(true)
  })
})

describe('jaccard', () => {
  it('1 untuk teks identik', () => {
    expect(jaccard('bambu kuning a13', 'bambu kuning a13')).toBe(1)
  })
  it('0 kalau tidak ada kata yang sama', () => {
    expect(jaccard('bambu kuning', 'nagoya newton')).toBe(0)
  })
  it('di antara 0 dan 1 untuk teks mirip', () => {
    const s = jaccard('perumahan bambu kuning puskopkar a13 17 unrika', 'perum puskopkar bambu kuning a13 nomor 17 unrika')
    expect(s).toBeGreaterThan(0.6)
    expect(s).toBeLessThan(1)
  })
})

describe('findSuspectDuplicates', () => {
  const rows = [
    {
      no: 16,
      alamat: 'Perumahan Bambu Kuning Puskopkar A13 No 17, Batu Aji, Belakang UNRIKA dan RSUD EMBUNG FATIMAH',
      wa: '6285318638883',
      harga: 1200000,
    },
    {
      no: 17,
      alamat: 'Perum Puskopkar Bambu Kuning A13 Nomor 17 Belakang UNRIKA RSUD Embung Fatimah',
      wa: '6285318638883',
      harga: 1200000,
    },
  ]

  it('menemukan pasangan alamat mirip dengan nomor & harga sama', () => {
    const out = findSuspectDuplicates(rows)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ noA: 16, noB: 17, sameWa: true, sameHarga: true })
  })

  it('tidak memflag pasangan yang mirip tapi penandanya berbeda', () => {
    const out = findSuspectDuplicates([
      { no: 1, alamat: 'kost bengkong indah', wa: '628111', harga: 900000 },
      { no: 2, alamat: 'kost bengkong indah', wa: '628222', harga: 1100000 },
    ])
    expect(out).toHaveLength(0)
  })

  it('tidak memflag nomor telepon sama di area yang berbeda', () => {
    const out = findSuspectDuplicates([
      { no: 1, alamat: 'ruko aljabar bengkong', wa: '628111', harga: 450000 },
      { no: 2, alamat: 'taman mediterania batam center', wa: '628111', harga: 2200000 },
    ])
    expect(out).toHaveLength(0)
  })

  it('diurutkan dari kemiripan tertinggi', () => {
    const out = findSuspectDuplicates([
      { no: 1, alamat: 'kost nagoya seraya belakang loveseafood foodcourt 168', wa: '628X', harga: 1300000 },
      { no: 2, alamat: 'kost nagoya seraya belakang loveseafood foodcourt 168', wa: '628X', harga: 1300000 },
      { no: 3, alamat: 'dekat nagoya hill mall belakang foodcourt 168 loveseafood nagoya', wa: '628X', harga: 1300000 },
    ])
    expect(out[0].similarity).toBeGreaterThanOrEqual(out[out.length - 1].similarity)
  })
})
