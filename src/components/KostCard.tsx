import Link from 'next/link'
import { WaButton } from './WaButton'
import { formatRupiah } from '@/lib/seo'
import type { KostListItem } from '@/lib/types'

/**
 * Kartu listing: permukaan + shadow, seluruh isi kost ada di dalam kartu.
 *
 * Karena daftar ini tidak punya foto, harga dipakai sebagai jangkar visual —
 * perannya sama seperti foto di kartu sejenis: memberi titik berat yang bisa
 * dipindai cepat. Judul alamat memakai stretched-link (::after menutup seluruh
 * kartu) supaya kartunya bisa ditap di mana saja, sementara tautan WhatsApp di
 * dalamnya tetap bisa diklik sendiri (diberi z-index di atas stretched link).
 */
export function KostCard({ kost }: { kost: KostListItem }) {
  return (
    <article className="card relative flex flex-col p-5">
      <p className="type-micro text-muted">
        {kost.area} · {kost.jenis} · {kost.kriteria}
      </p>

      <h3 className="type-title mt-2.5 line-clamp-3">
        <Link
          href={`/kost/${kost.slug}/`}
          className="underline-offset-4 after:absolute after:inset-0 after:rounded-card hover:underline"
        >
          {kost.alamat}
        </Link>
      </h3>

      <div className="mt-4 flex flex-1 flex-col justify-end gap-2.5 border-t border-hairline pt-4">
        <p className="type-num text-[1.25rem] leading-none font-medium">
          {kost.harga !== null ? (
            <>
              {formatRupiah(kost.harga)}
              <span className="type-micro ml-2 align-middle text-muted">/bulan</span>
            </>
          ) : (
            <span className="type-title text-muted">Harga belum tercantum</span>
          )}
        </p>

        <div className="relative z-10 self-start">
          <WaButton kost={kost} label="Chat via WhatsApp" />
        </div>
      </div>
    </article>
  )
}
