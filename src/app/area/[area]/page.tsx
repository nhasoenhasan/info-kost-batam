import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { KostCard } from '@/components/KostCard'
import { areasByCount, areaBySlugParam, areaStats, byArea, slugifyArea } from '@/lib/kost'
import { formatRupiah, breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return areasByCount.map(({ area }) => ({ area: slugifyArea(area) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ area: string }>
}): Promise<Metadata> {
  const { area: param } = await params
  const area = areaBySlugParam(param)
  if (!area) return {}

  const stats = areaStats(area)
  const title = `Kost ${area} Batam — ${stats.count} pilihan${
    stats.minHarga ? `, mulai ${formatRupiah(stats.minHarga)}` : ''
  }`
  const description =
    `Daftar ${stats.count} info kost ${stats.jenis.join(' & ').toLowerCase()} di ${area}, Batam` +
    `${stats.minHarga ? `, harga mulai ${formatRupiah(stats.minHarga)} per bulan` : ''}. ` +
    'Lengkap dengan nomor WhatsApp pemilik.'

  return {
    title,
    description,
    alternates: { canonical: `/area/${param}/` },
    openGraph: { title, description, type: 'website' },
  }
}

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area: param } = await params
  const area = areaBySlugParam(param)
  if (!area) notFound()

  const stats = areaStats(area)
  const list = byArea(area).sort((a, b) => (a.harga ?? Infinity) - (b.harga ?? Infinity))

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <nav aria-label="Breadcrumb" className="type-micro text-muted">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-ink">
              Semua kost
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{area}</li>
        </ol>
      </nav>

      <h1 className="type-section mt-6 text-[1.75rem] sm:text-[2rem]">Kost di {area}, Batam</h1>
      <p className="type-body measure mt-4 text-muted">
        {stats.count} listing tercatat di {area}
        {stats.minHarga && stats.maxHarga
          ? `, harganya ${formatRupiah(stats.minHarga)} sampai ${formatRupiah(stats.maxHarga)} per bulan`
          : ''}
        . Diurutkan dari yang termurah. Semua info berasal dari rekap postingan publik — konfirmasi harga
        dan ketersediaan langsung ke pemilik.
      </p>

      <p className="type-micro mt-10 text-muted">Daftar</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((k) => (
          <KostCard key={k.id} kost={k} />
        ))}
      </div>

      <p className="mt-10 border-t border-hairline pt-5">
        <Link href="/" className="type-micro underline-offset-4 hover:underline">
          Lihat semua area dan filter budget →
        </Link>
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Semua kost', path: '/' },
              { name: `Kost ${area}`, path: `/area/${param}/` },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd(list.slice(0, 30))) }}
      />
    </div>
  )
}
