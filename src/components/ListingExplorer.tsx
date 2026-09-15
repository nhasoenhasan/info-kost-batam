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
  { value: 'relevan', label: 'Urutan data' },
  { value: 'termurah', label: 'Termurah' },
  { value: 'termahal', label: 'Termahal' },
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
    // nilai dari URL disaring ke opsi yang dikenal — URL bisa diketik manual
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
  // history.replaceState (bukan router) supaya URL bisa di-share tanpa memicu
  // navigasi/refetch — halaman ini statis, tidak ada data server yang perlu diambil ulang.
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

  // Pagination di-reset di setter filter, bukan lewat effect — menghindari
  // cascading render dan bikin satu perubahan filter = satu render.
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
    <section id="daftar" className="space-y-6">
      <div role="search" className="space-y-4">
        <label htmlFor="cari-kost" className="sr-only">
          Cari kost berdasarkan alamat atau area
        </label>
        <div className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            id="cari-kost"
            type="search"
            value={filters.q}
            onChange={(e) => updateFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Cari area, jalan, atau patokan — mis. Bengkong, dekat UNRIKA"
            className="w-full rounded-md border border-hairline bg-transparent py-3 pr-4 pl-10 text-base placeholder:text-muted"
          />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs tracking-wide uppercase text-muted">Area</p>
          <div className="chip-row">
            {areas.map(({ area, count }) => {
              const active = filters.area.includes(area)
              return (
                <button
                  key={area}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateFilters((f) => ({ ...f, area: toggle(f.area, area) }))}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-ink bg-ink text-surface'
                      : 'border-hairline text-muted hover:border-ink'
                  }`}
                >
                  {area}
                  <span className="ml-1.5 font-mono text-xs opacity-60">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <fieldset className="space-y-2">
            <legend className="font-mono text-xs tracking-wide uppercase text-muted">Jenis</legend>
            <div className="chip-row">
              {JENIS.map((j) => {
                const active = filters.jenis.includes(j)
                return (
                  <button
                    key={j}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateFilters((f) => ({ ...f, jenis: toggle(f.jenis, j) }))}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
                      active
                        ? 'border-ink bg-ink text-surface'
                        : 'border-hairline text-muted hover:border-ink'
                    }`}
                  >
                    {j}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="font-mono text-xs tracking-wide uppercase text-muted">Kriteria</legend>
            <div className="chip-row">
              {KRITERIA.map((k) => {
                const active = filters.kriteria.includes(k)
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateFilters((f) => ({ ...f, kriteria: toggle(f.kriteria, k) }))}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
                      active
                        ? 'border-ink bg-ink text-surface'
                        : 'border-hairline text-muted hover:border-ink'
                    }`}
                  >
                    {k}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <label htmlFor="budget" className="block font-mono text-xs tracking-wide uppercase text-muted">
              Budget maksimum
            </label>
            <select
              id="budget"
              value={filters.maxHarga === null ? '' : String(filters.maxHarga)}
              onChange={(e) =>
                updateFilters((f) => ({
                  ...f,
                  maxHarga: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="w-full rounded-md border border-hairline bg-transparent px-3 py-1.5 text-sm"
            >
              <option value="">Semua harga</option>
              {BUDGET_BUCKETS.map((b) => (
                <option key={b} value={b}>
                  sampai {formatRupiahShort(b)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="urutan" className="block font-mono text-xs tracking-wide uppercase text-muted">
              Urutkan
            </label>
            <select
              id="urutan"
              value={filters.sort}
              onChange={(e) =>
                updateFilters((f) => ({ ...f, sort: e.target.value as SortOption }))
              }
              className="w-full rounded-md border border-hairline bg-transparent px-3 py-1.5 text-sm"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-hairline pt-4">
        <p aria-live="polite" className="text-sm text-muted">
          <span className="font-mono text-ink">{results.length}</span> kost ditemukan
          {activeCount > 0 && ` · ${activeCount} filter aktif`}
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => updateFilters(() => DEFAULT_FILTERS)}
            className="rounded-md border border-hairline px-3 py-1.5 text-sm hover:border-ink"
          >
            Hapus filter
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="border-t border-hairline pt-8 text-sm text-muted">
          <p className="text-ink">Tidak ada kost yang cocok dengan filter ini.</p>
          <p className="mt-1">
            Coba perluas area, naikkan batas budget, atau hapus filter kriteria. Data kami hanya memuat
            kost yang pernah diposting di grup publik — bukan seluruh kost di Batam.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((kost) => (
              <KostCard key={kost.id} kost={kost} />
            ))}
          </div>

          {visible < results.length && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-md border border-hairline px-5 py-2.5 text-sm hover:border-ink"
              >
                {`Tampilkan ${Math.min(PAGE_SIZE, results.length - visible)} lagi (${results.length - visible} tersisa)`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
