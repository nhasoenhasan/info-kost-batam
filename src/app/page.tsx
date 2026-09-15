import Link from 'next/link'
import { ListingExplorer } from '@/components/ListingExplorer'
import { areasByCount, allKosts, listingIndex, priceRange, report } from '@/lib/kost'
import { formatRupiahShort, itemListJsonLd } from '@/lib/seo'

const tanggal = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(report.generatedAt))

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
      <section className="py-9 sm:py-14">
        <h1 className="type-display max-w-[30ch]">Info kost dan kontrakan di Batam.</h1>
        <p className="type-body measure mt-4 text-muted">
          Hasil rekap postingan publik Facebook, lengkap dengan nomor WhatsApp pemilik, area, dan kisaran
          harga. Filter sesuai kebutuhanmu, lalu chat langsung.
        </p>
        <p className="type-micro type-num mt-6 text-muted">
          {report.kept} listing · {areasByCount.length} area · Rp{formatRupiahShort(priceRange.min)}–Rp
          {formatRupiahShort(priceRange.max)} per bulan · diperbarui {tanggal}
        </p>
      </section>

      <ListingExplorer items={listingIndex} areas={areasByCount} />

      <section className="mt-20 border-t border-hairline pt-6">
        <p className="type-micro text-muted">Per area</p>
        <ul className="mt-5 grid gap-x-10 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {areasByCount.map(({ area, count }) => (
            <li key={area} className="flex items-center gap-2">
              <Link
                href={`/area/${area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`}
                className="type-body inline-flex min-h-11 items-center underline-offset-4 hover:underline"
              >
                Kost {area}
              </Link>
              <span className="type-micro type-num text-muted">{count}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* structured data daftar listing (tanpa harga — lihat lib/seo.ts) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd(listingIndex.slice(0, 50))) }}
      />
      <p className="sr-only">Total {allKosts.length} listing kost dan kontrakan di Batam.</p>
    </div>
  )
}
