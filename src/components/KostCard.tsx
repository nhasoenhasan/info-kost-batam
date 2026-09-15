import Link from 'next/link'
import { WaButton } from './WaButton'
import { formatRupiah } from '@/lib/seo'
import type { KostListItem } from '@/lib/types'

const kriteriaLabel: Record<string, string> = {
  Putra: 'Putra',
  Putri: 'Putri',
  Campur: 'Campur',
  'Belum jelas': 'Belum jelas',
}

export function KostCard({ kost }: { kost: KostListItem }) {
  return (
    <article className="flex flex-col gap-3 border-t border-hairline pt-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono uppercase tracking-wide text-muted">{kost.area}</span>
        <span aria-hidden="true" className="text-hairline">
          ·
        </span>
        <span className="text-muted">{kost.jenis}</span>
        <span
          className={`rounded-full border border-hairline px-2 py-0.5 ${
            kost.kriteria === 'Belum jelas' ? 'text-flag' : 'text-muted'
          }`}
        >
          {kriteriaLabel[kost.kriteria] ?? kost.kriteria}
        </span>
      </div>

      <h3 className="text-[15px] leading-snug">
        {/*
          Alamat di-link, TOMBOL WA di luar link — dua elemen bersaudara.
          Ini menghindari nested interactive element (link di dalam link).
        */}
        <Link href={`/kost/${kost.slug}/`} className="line-clamp-3 hover:underline">
          {kost.alamat}
        </Link>
      </h3>

      <div className="mt-auto flex items-end justify-between gap-3">
        <p className="font-mono text-base">
          {formatRupiah(kost.harga)}
          {kost.harga !== null && <span className="text-xs text-muted"> /bulan</span>}
        </p>
      </div>

      <WaButton kost={kost} label="Chat pemilik" variant="outline" />
    </article>
  )
}
