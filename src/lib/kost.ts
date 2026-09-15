import records from '@/data/kost.json'
import reportData from '@/data/kost-report.json'
import type { KostListItem, KostRecord } from './types'

export const allKosts = records as KostRecord[]
export const report = reportData as {
  generatedAt: string
  sourceUrl: string
  totalRows: number
  kept: number
  withBudget: number
  withWa: number
  byArea: Record<string, number>
  needsReview: { no: number; slug: string; notes: string[] }[]
}

/** Payload ringkas untuk komponen client. */
export const listingIndex: KostListItem[] = allKosts.map((r) => ({
  id: r.id,
  slug: r.slug,
  alamat: r.alamat,
  area: r.area,
  jenis: r.jenis,
  kriteria: r.kriteria,
  harga: r.harga,
  wa: r.wa,
}))

/** Area diurut dari yang paling banyak listingnya. */
export const areasByCount = Object.entries(report.byArea)
  .map(([area, count]) => ({ area, count }))
  .sort((a, b) => b.count - a.count || a.area.localeCompare(b.area))

const prices = allKosts.map((r) => r.harga).filter((h): h is number => h !== null)

export const priceRange = {
  min: prices.length ? Math.min(...prices) : 0,
  max: prices.length ? Math.max(...prices) : 0,
}

export const bySlug = (slug: string) => allKosts.find((r) => r.slug === slug)

export const byArea = (area: string) =>
  allKosts.filter((r) => r.area.toLowerCase() === area.toLowerCase())

export const areaBySlugParam = (param: string) =>
  Object.keys(report.byArea).find((a) => slugifyArea(a) === param)

export function slugifyArea(area: string) {
  return area
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function areaStats(area: string) {
  const list = byArea(area)
  const p = list.map((r) => r.harga).filter((h): h is number => h !== null)
  return {
    count: list.length,
    minHarga: p.length ? Math.min(...p) : null,
    maxHarga: p.length ? Math.max(...p) : null,
    jenis: [...new Set(list.map((r) => r.jenis))],
  }
}
