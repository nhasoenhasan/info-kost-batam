import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WaButton } from '@/components/WaButton'
import { areaBySlugParam, areaStats, byArea, slugifyArea } from '@/lib/kost'
import { areasByCount } from '@/lib/kost'
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
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:underline">
              Semua kost
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{area}</li>
        </ol>
      </nav>

      <h1 className="mt-4 text-2xl leading-snug font-semibold tracking-tight sm:text-3xl">
        Kost di {area}, Batam
      </h1>
      <p className="mt-3 max-w-[52ch] text-sm text-muted">
        {stats.count} listing tercatat di {area}
        {stats.minHarga && stats.maxHarga
          ? `, dengan harga ${formatRupiah(stats.minHarga)} sampai ${formatRupiah(stats.maxHarga)} per bulan`
          : ''}
        . Diurutkan dari yang termurah. Semua info berasal dari rekap postingan publik — konfirmasi harga
        dan ketersediaan langsung ke pemilik.
      </p>

      <ul className="mt-10 divide-y divide-hairline border-y border-hairline">
        {list.map((k) => (
          <li key={k.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="min-w-0 flex-1">
              <Link href={`/kost/${k.slug}/`} className="text-[15px] leading-snug hover:underline">
                {k.alamat}
              </Link>
              <p className="mt-1 font-mono text-xs text-muted">
                {k.jenis} · {k.kriteria}
                {k.harga !== null ? ` · ${formatRupiah(k.harga)}/bulan` : ' · harga belum ada'}
              </p>
            </div>
            <div className="shrink-0">
              <WaButton kost={k} label="Chat pemilik" variant="outline" />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm">
        <Link href="/" className="underline">
          Lihat semua area dan filter budget
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
