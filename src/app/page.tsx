import { ListingExplorer } from '@/components/ListingExplorer'
import Link from 'next/link'
import { areasByCount, allKosts, listingIndex, priceRange, report } from '@/lib/kost'
import { formatRupiah, formatRupiahShort, itemListJsonLd } from '@/lib/seo'

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
      <section className="flex flex-col gap-6 py-10 sm:py-14">
        <h1 className="max-w-[42ch] text-3xl leading-[1.15] font-semibold tracking-tight sm:text-[2.6rem]">
          Info kost di Batam, terkumpul di satu tempat.
        </h1>
        <p className="max-w-[52ch] text-base text-muted">
          {report.kept} kost dan kontrakan hasil rekap postingan publik Facebook — lengkap dengan nomor
          WhatsApp pemilik, area, dan kisaran harga. Filter sesuai budget, lalu chat langsung.
        </p>
        <dl className="flex flex-wrap gap-x-10 gap-y-3 border-t border-hairline pt-5 font-mono text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Listing</dt>
            <dd className="text-lg">{report.kept}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Area</dt>
            <dd className="text-lg">{areasByCount.length}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Rentang harga</dt>
            <dd className="text-lg">
              {formatRupiahShort(priceRange.min)}–{formatRupiahShort(priceRange.max)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Harga mulai</dt>
            <dd className="text-lg">{formatRupiah(priceRange.min)}</dd>
          </div>
        </dl>
      </section>

      <ListingExplorer items={listingIndex} areas={areasByCount} />

      <section className="mt-16 border-t border-hairline pt-6">
        <h2 className="font-mono text-xs uppercase tracking-wide text-muted">
          Kost per area di Batam
        </h2>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {areasByCount.map(({ area, count }) => (
            <li key={area}>
              <Link href={`/area/${area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`} className="hover:underline">
                Kost {area}
                <span className="ml-1.5 font-mono text-xs text-muted">{count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* structured data daftar listing (tanpa harga — lihat lib/seo.ts) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd(listingIndex.slice(0, 50))) }}
      />
      <p className="sr-only">
        Total {allKosts.length} listing kost dan kontrakan di Batam.
      </p>
    </div>
  )
}
