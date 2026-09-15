export type Jenis = 'Kost' | 'Kontrakan'
export type Kriteria = 'Putra' | 'Putri' | 'Campur' | 'Belum jelas'
export type SortOption = 'relevan' | 'termurah' | 'termahal'

/** Satu listing kost, hasil normalisasi pipeline `pnpm sync`. */
export interface KostRecord {
  id: string
  slug: string
  /** nomor baris asli di spreadsheet — buat rujukan admin */
  no: number
  alamat: string
  area: string
  jenis: Jenis
  /** format WhatsApp: 62xxxxxxxxxx, atau null kalau di sheet kosong/tidak wajar */
  wa: string | null
  kriteria: Kriteria
  /** rupiah per bulan, atau null kalau di sheet kosong */
  harga: number | null
  /** harga lain dari baris duplikat, buat ditinjau admin (kita tidak merata-ratakan) */
  hargaAlternatif: number[]
  referensi: string[]
  catatan: string
  needsReview: boolean
  reviewNotes: string[]
}

/** Versi ringkas yang dikirim ke browser, biar JS payload tetap kecil. */
export type KostListItem = Pick<
  KostRecord,
  'id' | 'slug' | 'alamat' | 'area' | 'jenis' | 'kriteria' | 'harga' | 'wa'
>

export interface FilterState {
  q: string
  area: string[]
  jenis: Jenis[]
  kriteria: Kriteria[]
  minHarga: number | null
  maxHarga: number | null
  sort: SortOption
}

export const DEFAULT_FILTERS: FilterState = {
  q: '',
  area: [],
  jenis: [],
  kriteria: [],
  minHarga: null,
  maxHarga: null,
  sort: 'relevan',
}

/** Batas budget yang ditawarkan di UI (rupiah per bulan). */
export const BUDGET_BUCKETS = [500_000, 750_000, 1_000_000, 1_500_000, 2_000_000] as const
