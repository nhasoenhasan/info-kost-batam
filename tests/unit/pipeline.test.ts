import { describe, it, expect } from 'vitest'
import { parseCsv } from '../../scripts/lib/csv.mjs'
import { normalizePhone, buildWaLink } from '../../scripts/lib/phone.mjs'
import { canonicalArea, AREAS } from '../../scripts/lib/area.mjs'
import { parseBudget, parseKriteria, parseJenis } from '../../scripts/lib/budget.mjs'
import { slugify, buildSlug } from '../../scripts/lib/slug.mjs'
import { dedupeKey, mergeDuplicates } from '../../scripts/lib/dedupe.mjs'
import { tidyAlamat, tidyCatatan } from '../../scripts/lib/text.mjs'

describe('parseCsv', () => {
  it('memisahkan baris dan kolom sederhana', () => {
    expect(parseCsv('a,b\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })

  it('menjaga newline di dalam field ber-kutip', () => {
    const rows = parseCsv('1,"Seraya,\nBelakang Loveseafood",Nagoya')
    expect(rows).toEqual([['1', 'Seraya,\nBelakang Loveseafood', 'Nagoya']])
  })

  it('mengubah "" menjadi satu kutip', () => {
    expect(parseCsv('a,"kata ""penting""",b')).toEqual([['a', 'kata "penting"', 'b']])
  })

  it('menangani CRLF dan membuang baris kosong', () => {
    expect(parseCsv('a,b\r\nc,d\r\n\r\n,,\r\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })
})

describe('normalizePhone', () => {
  it('konversi 08xx ke 62xx', () => {
    expect(normalizePhone('085376805194').wa).toBe('6285376805194')
  })
  it('membuang spasi di ujung', () => {
    expect(normalizePhone(' 081276355228 ').wa).toBe('6281276355228')
  })
  it('membiarkan nomor yang sudah 62', () => {
    expect(normalizePhone('628117006381').wa).toBe('628117006381')
  })
  it('null + flag untuk nomor kosong', () => {
    const r = normalizePhone('')
    expect(r.wa).toBeNull()
    expect(r.needsReview).toBe(true)
  })
  it('null untuk nomor terlalu pendek', () => {
    expect(normalizePhone('12345').wa).toBeNull()
  })
})

describe('buildWaLink', () => {
  it('menyusun link dengan pesan ter-encode', () => {
    expect(buildWaLink('628123', 'Halo, saya lihat Kost Bengkong')).toBe(
      'https://wa.me/628123?text=Halo%2C%20saya%20lihat%20Kost%20Bengkong',
    )
  })
  it('null kalau nomor tidak ada', () => {
    expect(buildWaLink(null, 'apa saja')).toBeNull()
  })
})

describe('canonicalArea', () => {
  it('merapikan kapitalisasi', () => {
    expect(canonicalArea('batam center')).toBe('Batam Center')
  })
  it('null untuk area tak dikenal', () => {
    expect(canonicalArea('Jakarta')).toBeNull()
  })
  it('Daftar area kanonik tanpa duplikat', () => {
    expect(new Set(AREAS).size).toBe(AREAS.length)
    expect(AREAS.length).toBe(14)
  })
  it('override: Gaia Buana (alamat Sagulung) tidak lagi dilabeli Lubuk Baja', () => {
    expect(canonicalArea('Lubuk Baja', 'Kost Gaia Buana Central Park Tipe 1 Sagulung Batam')).toBe(
      'Sagulung',
    )
  })
})

describe('parseBudget', () => {
  it('membaca format Rupiah bertitik', () => {
    expect(parseBudget('Rp1.850.000')).toBe(1850000)
  })
  it('null untuk teks non-angka', () => {
    expect(parseBudget('tidak ada estimasi harga')).toBeNull()
  })
  it('null untuk kosong', () => {
    expect(parseBudget('')).toBeNull()
  })
  it('menolak nilai tidak masuk akal', () => {
    expect(parseBudget('Rp50.000')).toBeNull()
  })
})

describe('parseKriteria', () => {
  it('menormalkan kapitalisasi', () => {
    expect(parseKriteria('campur')).toBe('Campur')
  })
  it('Pria dipetakan ke Putra', () => {
    expect(parseKriteria('Pria')).toBe('Putra')
  })
  it('kosong jadi Belum jelas', () => {
    expect(parseKriteria('')).toBe('Belum jelas')
  })
  it('"Masih ditanya" jadi Belum jelas', () => {
    expect(parseKriteria('Masih ditanya')).toBe('Belum jelas')
  })
})

describe('parseJenis', () => {
  it('default Kost', () => {
    expect(parseJenis('')).toBe('Kost')
  })
  it('mengenali Kontrakan', () => {
    expect(parseJenis('Kontrakan')).toBe('Kontrakan')
  })
})

describe('slugify', () => {
  it('menurunkan huruf dan mengganti spasi', () => {
    expect(slugify('BENGKONG INDAH ATAS (ALJABAR)')).toBe('bengkong-indah-atas-aljabar')
  })
  it('membuang newline dan koma', () => {
    expect(slugify('Seraya,\nBelakang Loveseafood 3')).toBe('seraya-belakang-loveseafood-3')
  })
  it('maksimal 60 karakter', () => {
    expect(slugify('a '.repeat(80)).length).toBeLessThanOrEqual(60)
  })
})

describe('buildSlug', () => {
  it('menggabungkan area + alamat + 4 digit nomor WA', () => {
    expect(buildSlug({ area: 'Batam Center', alamat: 'Taman Marcelia', wa: '6281234567890' })).toBe(
      'batam-center-taman-marcelia-7890',
    )
  })
  it('memakai nomor baris kalau nomor WA tidak ada', () => {
    expect(buildSlug({ area: 'Bengkong', alamat: 'Ruko Aljabar', wa: null, no: 91 })).toBe(
      'bengkong-ruko-aljabar-91',
    )
  })
  it('hanya berisi huruf kecil, angka, dan tanda hubung', () => {
    const s = buildSlug({
      area: 'Batu Aji',
      alamat: 'Jln. Mitra Raya #2 (Blok D1)',
      wa: '6281111',
      no: 1,
    })
    expect(s).toMatch(/^[a-z0-9-]+$/)
  })
})

const base = {
  no: 4,
  alamat: 'Perum Edofa Gardenia Blok F9 No 12 B',
  area: 'Sekupang',
  wa: '6281372454204',
  harga: 800000,
  kriteria: 'Campur',
  jenis: 'Kost',
  slug: 'x',
}

describe('dedupeKey', () => {
  it('kunci = area + alamat ternormalisasi', () => {
    expect(dedupeKey(base)).toBe('sekupang|perum edofa gardenia blok f9 no 12 b')
  })
})

describe('mergeDuplicates', () => {
  it('menggabungkan alamat sama, baris pertama yang dipertahankan', () => {
    const out = mergeDuplicates([base, { ...base, no: 93, wa: null, harga: 850000 }])
    expect(out.unique).toHaveLength(1)
    expect(out.unique[0].no).toBe(4)
    expect(out.unique[0].harga).toBe(800000)
    expect(out.duplicatesMerged[0]).toMatchObject({ keptNo: 4, mergedNo: 93 })
  })

  it('mencatat harga berbeda sebagai alternatif, bukan dirata-rata', () => {
    const out = mergeDuplicates([base, { ...base, no: 5, harga: 900000 }])
    expect(out.unique[0].harga).toBe(800000)
    expect(out.unique[0].hargaAlternatif).toEqual([800000, 900000])
    expect(out.unique[0].needsReview).toBe(true)
  })

  it('melengkapi nomor WA yang kosong di baris pertama', () => {
    const out = mergeDuplicates([{ ...base, wa: null }, { ...base, no: 6, wa: '628111' }])
    expect(out.unique[0].wa).toBe('628111')
  })

  it('tidak menggabungkan alamat berbeda', () => {
    const out = mergeDuplicates([base, { ...base, no: 7, alamat: 'Alamat lain' }])
    expect(out.unique).toHaveLength(2)
  })
})

describe('tidyAlamat', () => {
  it('mengubah newline dalam sel jadi koma', () => {
    expect(tidyAlamat('Seraya,\nBelakang Loveseafood 3')).toBe('Seraya, Belakang Loveseafood 3')
  })
  it('membersihkan titik-koma berurutan di ujung', () => {
    expect(tidyAlamat('(Foodcourt 168).\n')).toBe('(Foodcourt 168).')
  })
  it('membuang koma di ujung alamat', () => {
    expect(tidyAlamat('Simpang bengkong harapan 1, Hook,')).toBe('Simpang bengkong harapan 1, Hook')
  })
  it('tidak menyisakan koma berurutan atau spasi ganda', () => {
    expect(tidyAlamat('A ,  , B')).toBe('A, B')
  })
  it('kosong tetap kosong', () => {
    expect(tidyAlamat('')).toBe('')
  })
})

describe('tidyCatatan', () => {
  it('merapikan spasi dan baris baru', () => {
    expect(tidyCatatan('  harga   masih\n estimasi ')).toBe('harga masih estimasi')
  })
})
