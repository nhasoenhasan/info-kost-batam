/**
 * Sinkronisasi data kost dari Google Sheets → src/data/kost.json
 *
 * Jalankan: pnpm sync
 *
 * Sumber: CSV export publik (tanpa API key/OAuth). Mode /htmlview tidak bisa
 * di-parse tooling, jadi jangan diganti ke htmlview.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { parseCsv } from './lib/csv.mjs'
import { normalizePhone } from './lib/phone.mjs'
import { canonicalArea } from './lib/area.mjs'
import { parseBudget, parseKriteria, parseJenis } from './lib/budget.mjs'
import { buildSlug } from './lib/slug.mjs'
import { mergeDuplicates } from './lib/dedupe.mjs'
import { tidyAlamat, tidyCatatan } from './lib/text.mjs'

const SOURCE_URL = process.env.SHEET_CSV_URL
if (!SOURCE_URL) {
  throw new Error(
    'SHEET_CSV_URL belum diisi.\n' +
      'Copy .env.example jadi .env.local lalu isi URL CSV export spreadsheet.\n' +
      'URL-nya sengaja tidak disimpan di repo supaya tidak ada orang lain yang punya akses ke spreadsheet.',
  )
}
const OUT_JSON = new URL('../src/data/kost.json', import.meta.url)
const OUT_REPORT = new URL('../src/data/kost-report.json', import.meta.url)

/** Guard: kalau hasil sync anjlok, gagalkan supaya data bagus tidak tertimpa data kosong. */
const MIN_EXPECTED = 120

/** Nilai kolom Status (opsional di sheet) yang berarti listing harus hilang dari website. */
const HIDDEN_STATUS = ['hapus', 'nonaktif', 'tidak aktif', 'penuh', 'sudah terisi', 'sold']

const res = await fetch(SOURCE_URL, { redirect: 'follow' })
if (!res.ok) throw new Error(`Gagal ambil sheet: HTTP ${res.status} ${res.statusText}`)
const rows = parseCsv(await res.text())

const headerIdx = rows.findIndex((r) => r.includes('Alamat') && r.includes('No'))
if (headerIdx === -1) {
  throw new Error('Baris header (No + Alamat) tidak ditemukan — struktur sheet berubah?')
}

// Kolom dicari lewat nama header supaya tahan kalau admin menyisipkan kolom baru.
// Fallback = indeks yang terverifikasi 2026-09-15.
const header = rows[headerIdx].map((h) => String(h).toLowerCase())
const col = (needle, fallback) => {
  const i = header.findIndex((h) => h.includes(needle))
  return i === -1 ? fallback : i
}
const C = {
  no: col('no', 1),
  alamat: col('alamat', 2),
  lokasi: col('lokasi', 3),
  jenis: col('jenis', 4),
  wa: col('nomor wa', 5),
  budget: col('budget', 7),
  kriteria: col('kriteria', 8),
  referensi: col('referensi', 9),
  catatan: col('keterangan', 10),
  status: col('status', -1),
}

const dataRows = rows.slice(headerIdx + 1)
const dropped = []
const areaOverrides = []
const raw = []

for (const r of dataRows) {
  const no = Number(String(r[C.no] ?? '').trim())
  const alamat = tidyAlamat(r[C.alamat])

  if (!alamat || !Number.isFinite(no)) {
    dropped.push({ no: Number.isFinite(no) ? no : -1, alamat, reason: 'alamat/no kosong' })
    continue
  }

  const status = C.status === -1 ? '' : String(r[C.status] ?? '').trim().toLowerCase()
  if (status && HIDDEN_STATUS.some((s) => status.includes(s))) {
    dropped.push({ no, alamat, reason: `status sheet "${status}"` })
    continue
  }

  const labelLokasi = String(r[C.lokasi] ?? '').trim()
  const area = canonicalArea(labelLokasi, alamat, (o) => {
    areaOverrides.push({ no, from: labelLokasi || '(kosong)', to: o.to, reason: o.reason })
  })
  if (!area) {
    dropped.push({ no, alamat, reason: `lokasi tidak dikenal: "${labelLokasi}"` })
    continue
  }

  const { wa, needsReview: waReview } = normalizePhone(r[C.wa])
  const harga = parseBudget(r[C.budget])
  const kriteria = parseKriteria(r[C.kriteria])

  const reviewNotes = []
  if (waReview) reviewNotes.push('nomor WA kosong atau formatnya tidak wajar')
  if (harga === null) reviewNotes.push('harga kosong atau tidak valid')
  if (kriteria === 'Belum jelas') reviewNotes.push('kriteria putra/putri/campur belum jelas')

  raw.push({
    no,
    alamat,
    area,
    jenis: parseJenis(r[C.jenis]),
    wa,
    kriteria,
    harga,
    referensi: String(r[C.referensi] ?? '')
      .trim()
      .toLowerCase()
      .split(/[\s,]+/)
      .filter(Boolean),
    catatan: tidyCatatan(r[C.catatan]),
    needsReview: reviewNotes.length > 0,
    reviewNotes,
  })
}

const { unique, duplicatesMerged } = mergeDuplicates(raw)

// slug unik deterministik (urutan tetap: dari nomor baris terkecil)
const used = new Set()
const records = unique
  .sort((a, b) => a.no - b.no)
  .map((r) => {
    const base = buildSlug(r)
    let slug = base
    let n = 2
    while (used.has(slug)) slug = `${base}-${n++}`
    used.add(slug)
    return {
      id: `kost-${String(r.no).padStart(3, '0')}`,
      slug,
      no: r.no,
      alamat: r.alamat,
      area: r.area,
      jenis: r.jenis,
      wa: r.wa,
      kriteria: r.kriteria,
      harga: r.harga,
      hargaAlternatif: r.hargaAlternatif ?? [],
      referensi: r.referensi,
      catatan: r.catatan,
      needsReview: !!r.needsReview,
      reviewNotes: r.reviewNotes ?? [],
    }
  })

if (records.length < MIN_EXPECTED) {
  throw new Error(
    `Hasil sync hanya ${records.length} record (< ${MIN_EXPECTED}). Dibatalkan supaya data yang sudah bagus ` +
      `tidak tertimpa. Cek apakah sheet sumber berubah struktur / dihapus.`,
  )
}
if (new Set(records.map((r) => r.slug)).size !== records.length) {
  throw new Error('Slug duplikat terdeteksi — periksa buildSlug()')
}

const byArea = records.reduce((acc, r) => {
  acc[r.area] = (acc[r.area] ?? 0) + 1
  return acc
}, {})

const report = {
  generatedAt: new Date().toISOString(),
  // tidak menyimpan URL/ID sumber: repo ini publik, dan spreadsheet tidak untuk dibagikan
  source: 'google-sheets-csv',
  totalRows: dataRows.length,
  kept: records.length,
  withBudget: records.filter((r) => r.harga !== null).length,
  withWa: records.filter((r) => r.wa).length,
  byArea,
  dropped,
  duplicatesMerged,
  areaOverrides,
  needsReview: records
    .filter((r) => r.needsReview)
    .map((r) => ({ no: r.no, slug: r.slug, notes: r.reviewNotes })),
}

await mkdir(new URL('../src/data/', import.meta.url), { recursive: true })
await writeFile(OUT_JSON, JSON.stringify(records, null, 2) + '\n')
await writeFile(OUT_REPORT, JSON.stringify(report, null, 2) + '\n')

console.log(
  `✓ sync selesai: ${records.length} listing dari ${dataRows.length} baris · ` +
    `${duplicatesMerged.length} duplikat digabung · ${dropped.length} dibuang · ` +
    `${report.needsReview.length} perlu review`,
)
