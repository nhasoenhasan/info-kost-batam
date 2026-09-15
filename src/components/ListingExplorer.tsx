'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { KostCard } from './KostCard'
import { activeFilterCount, filterKosts, sortKosts } from '@/lib/filter'
import { formatRupiahShort } from '@/lib/seo'
import {
  BUDGET_BUCKETS,
  DEFAULT_FILTERS,
  type FilterState,
  type Jenis,
  type KostListItem,
  type Kriteria,
  type SortOption,
} from '@/lib/types'

const PAGE_SIZE = 24
const KRITERIA: Kriteria[] = ['Putra', 'Putri', 'Campur', 'Belum jelas']
const JENIS: Jenis[] = ['Kost', 'Kontrakan']
const SORTS: { value: SortOption; label: string }[] = [
  { value: 'relevan', label: 'urutan data' },
  { value: 'termurah', label: 'termurah' },
  { value: 'termahal', label: 'termahal' },
]

type AreaOption = { area: string; count: number }

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

/** Filter dibaca dari URL (bukan state server) supaya hasil filter bisa di-share. */
function readFiltersFromUrl(validAreas: string[]): FilterState {
  const sp = new URLSearchParams(window.location.search)
  const minRaw = Number(sp.get('min'))
  const maxRaw = Number(sp.get('max'))
  const sort = sp.get('sort') as SortOption | null
  return {
    q: sp.get('q') ?? '',
    area: sp.getAll('area').filter((a) => validAreas.includes(a)),
    jenis: sp.getAll('jenis').filter((j) => JENIS.includes(j as Jenis)) as Jenis[],
    kriteria: sp.getAll('kriteria').filter((k) => KRITERIA.includes(k as Kriteria)) as Kriteria[],
    minHarga: Number.isFinite(minRaw) && minRaw > 0 ? minRaw : null,
    maxHarga: Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : null,
    sort: sort && SORTS.some((s) => s.value === sort) ? sort : 'relevan',
  }
}

function writeFiltersToUrl(f: FilterState) {
  const sp = new URLSearchParams()
  if (f.q.trim()) sp.set('q', f.q.trim())
  f.area.forEach((a) => sp.append('area', a))
  f.jenis.forEach((j) => sp.append('jenis', j))
  f.kriteria.forEach((k) => sp.append('kriteria', k))
  if (f.minHarga !== null) sp.set('min', String(f.minHarga))
  if (f.maxHarga !== null) sp.set('max', String(f.maxHarga))
  if (f.sort !== 'relevan') sp.set('sort', f.sort)

  const qs = sp.toString()
  // history.replaceState (bukan router): URL bisa di-share tanpa navigasi/refetch.
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
}

export function ListingExplorer({ items, areas }: { items: KostListItem[]; areas: AreaOption[] }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [ready, setReady] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const areaNames = useMemo(() => areas.map((a) => a.area), [areas])

  /* eslint-disable react-hooks/set-state-in-effect --
     Baca filter dari URL sekali saat mount. Harus di effect (bukan saat render) karena
     HTML di-prerender saat build tanpa akses ke window/URL — kalau dibaca saat render,
     markup server dan client jadi berbeda (hydration mismatch). */
  useEffect(() => {
    setFilters(readFiltersFromUrl(areaNames))
    setReady(true)
  }, [areaNames])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (ready) writeFiltersToUrl(filters)
  }, [filters, ready])

  // Pagination di-reset di setter filter, bukan lewat effect.
  const updateFilters = useCallback((updater: (prev: FilterState) => FilterState) => {
    setFilters(updater)
    setVisible(PAGE_SIZE)
  }, [])

  const results = useMemo(
    () => sortKosts(filterKosts(items, filters), filters.sort),
    [items, filters],
  )

  const shown = results.slice(0, visible)
  const activeCount = activeFilterCount(filters)

  return (
    <section id="daftar" className="space-y-10">
      <div role="search" className="space-y-3">
        <div>
          <label htmlFor="cari-kost" className="sr-only">
            Cari kost berdasarkan alamat atau area
          </label>
          <input
            id="cari-kost"
            type="search"
            value={filters.q}
            onChange={(e) => updateFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Cari area, jalan, atau patokan"
            className="type-body w-full border-0 border-b border-hairline bg-transparent py-3 placeholder:text-muted focus:border-ink focus:outline-none"
          />
        </div>

        {/* Semua grup filter pakai pola yang sama: label inline + chip yang wrap.
            Chip "Semua" di depan sengaja ada: tanpa satu pun chip aktif, deretan
            teks ini tidak terbaca sebagai kontrol — pill "Semua" yang aktif
            sekaligus jadi penanda state dan tombol reset. */}
        <div className="-ml-2.5 flex flex-wrap items-center gap-y-0.5">
          <span className="type-micro mr-2.5 text-muted">Area</span>
          <button
            type="button"
            aria-pressed={filters.area.length === 0}
            onClick={() => updateFilters((f) => ({ ...f, area: [] }))}
            className="filter-btn"
          >
            Semua
          </button>
          <div className="contents">
            {areas.map(({ area, count }) => {
              const active = filters.area.includes(area)
              return (
                <button
                  key={area}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateFilters((f) => ({ ...f, area: toggle(f.area, area) }))}
                  className="filter-btn"
                >
                  {area}
                  <span className="type-num ml-1.5 text-xs opacity-55">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-ml-2.5 flex flex-wrap items-center gap-y-0.5">
            <span className="type-micro mr-2.5 text-muted">Jenis</span>
            {JENIS.map((j) => (
              <button
                key={j}
                type="button"
                aria-pressed={filters.jenis.includes(j)}
                onClick={() => updateFilters((f) => ({ ...f, jenis: toggle(f.jenis, j) }))}
                className="filter-btn"
              >
                {j}
              </button>
            ))}
            <span className="type-micro mx-2.5 text-muted">Kriteria</span>
            {KRITERIA.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={filters.kriteria.includes(k)}
                onClick={() => updateFilters((f) => ({ ...f, kriteria: toggle(f.kriteria, k) }))}
                className="filter-btn"
              >
                {k}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <span className="type-micro text-muted">Budget</span>
              <select
                id="budget"
                value={filters.maxHarga === null ? '' : String(filters.maxHarga)}
                onChange={(e) =>
                  updateFilters((f) => ({
                    ...f,
                    maxHarga: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="type-num border-0 border-b border-hairline bg-transparent py-1 text-sm focus:border-ink focus:outline-none"
              >
                <option value="">semua</option>
                {BUDGET_BUCKETS.map((b) => (
                  <option key={b} value={b}>
                    ≤ {formatRupiahShort(b)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="type-micro text-muted">Urut</span>
              <select
                id="urutan"
                value={filters.sort}
                onChange={(e) => updateFilters((f) => ({ ...f, sort: e.target.value as SortOption }))}
                className="border-0 border-b border-hairline bg-transparent py-1 text-sm focus:border-ink focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-hairline pt-5">
        <div>
          <p className="type-micro text-muted">Daftar</p>
          <h2 className="type-section mt-1.5">Kost &amp; kontrakan</h2>
        </div>
        <p aria-live="polite" className="type-micro type-num text-muted">
          {results.length} hasil{activeCount > 0 && ` · ${activeCount} filter`}
          {activeCount > 0 && (
            <>
              {' · '}
              <button
                type="button"
                onClick={() => updateFilters(() => DEFAULT_FILTERS)}
                className="underline underline-offset-4 hover:text-ink"
              >
                hapus
              </button>
            </>
          )}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="type-body measure">
          <p>Belum ada yang cocok dengan filter ini.</p>
          <p className="mt-2 text-muted">
            Coba buka areanya lebih lebar, naikkan batas budget, atau kosongkan kriteria. Daftar ini hanya
            memuat kost yang pernah diposting di grup publik — bukan seluruh kost di Batam.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((kost) => (
              <KostCard key={kost.id} kost={kost} />
            ))}
          </div>

          {visible < results.length && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="text-[0.9375rem] font-medium underline-offset-4 hover:underline"
              >
                {`Tampilkan ${Math.min(PAGE_SIZE, results.length - visible)} lagi`}{' '}
                {/* penghitung cuma muncul kalau sisanya lebih banyak dari satu batch —
                    kalau tidak, angkanya sama dua kali dan terbaca seperti salah ketik */}
                {results.length - visible > PAGE_SIZE && (
                  <span className="type-micro type-num ml-2 text-muted">
                    {results.length - visible} tersisa
                  </span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
