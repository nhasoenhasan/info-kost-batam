import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WaButton } from '@/components/WaButton'
import { CopyButton } from '@/components/CopyButton'
import { KostCard } from '@/components/KostCard'
import { allKosts, byArea, bySlug, slugifyArea } from '@/lib/kost'
import { formatPhoneForDisplay } from '@/lib/phone'
import { formatRupiah, breadcrumbJsonLd } from '@/lib/seo'
import type { KostListItem } from '@/lib/types'

export const dynamicParams = false

export function generateStaticParams() {
  return allKosts.map((k) => ({ slug: k.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const kost = bySlug(slug)
  if (!kost) return {}

  const harga = kost.harga !== null ? `, ${formatRupiah(kost.harga)}/bulan` : ''
  const title = `Kost ${kost.kriteria} di ${kost.area}${harga ? ` — ${formatRupiah(kost.harga)}` : ''}`
  const description =
    `${kost.jenis} ${kost.kriteria.toLowerCase()} di ${kost.alamat} (${kost.area}, Batam)` +
    `${harga}. Nomor WhatsApp pemilik tersedia — cek lokasi dulu sebelum transfer.`

  return {
    title,
    description,
    alternates: { canonical: `/kost/${kost.slug}/` },
    openGraph: { title, description, type: 'article' },
  }
}

export default async function KostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const kost = bySlug(slug)
  if (!kost) notFound()

  const tetangga: KostListItem[] = byArea(kost.area)
    .filter((k) => k.id !== kost.id)
    .slice(0, 3)
    .map((k) => ({
      id: k.id,
      slug: k.slug,
      alamat: k.alamat,
      area: k.area,
      jenis: k.jenis,
      kriteria: k.kriteria,
      harga: k.harga,
      wa: k.wa,
    }))

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Area',
      value: <Link href={`/area/${slugifyArea(kost.area)}/`}>{kost.area}</Link>,
    },
    { label: 'Jenis', value: kost.jenis },
    { label: 'Kriteria', value: kost.kriteria },
    {
      label: 'Budget',
      value: (
        <>
          {formatRupiah(kost.harga)}
          {kost.harga !== null && <span className="text-muted"> /bulan</span>}
        </>
      ),
    },
    {
      label: 'Nomor WhatsApp',
      value: (
        <span className="font-mono">{formatPhoneForDisplay(kost.wa) ?? 'belum tersedia'}</span>
      ),
    },
    { label: 'Referensi', value: kost.referensi.length ? kost.referensi.join(', ') : '—' },
  ]

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:underline">
              Semua kost
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/area/${slugifyArea(kost.area)}/`} className="hover:underline">
              {kost.area}
            </Link>
          </li>
        </ol>
      </nav>

      <h1 className="mt-4 text-2xl leading-snug font-semibold tracking-tight sm:text-3xl">
        {kost.alamat}
      </h1>
      <p className="mt-2 font-mono text-sm text-muted">
        {kost.area} · {kost.jenis} · {kost.kriteria}
      </p>

      <p className="mt-6 font-mono text-3xl">
        {formatRupiah(kost.harga)}
        {kost.harga !== null && <span className="text-base text-muted"> /bulan</span>}
      </p>

      {kost.hargaAlternatif.length > 1 && (
        <p className="mt-2 text-sm text-flag">
          Catatan: sumber data juga menyebut{' '}
          {kost.hargaAlternatif
            .filter((h) => h !== kost.harga)
            .map((h) => formatRupiah(h))
            .join(', ')}{' '}
          untuk alamat ini. Konfirmasi harga terbaru ke pemilik.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <WaButton kost={kost} label="Chat pemilik via WhatsApp" />
        <CopyButton text={kost.alamat} />
      </div>
      <p className="mt-2 text-xs text-muted">
        Pesan WhatsApp otomatis berisi alamat kost ini, jadi pemilik tahu kamu menanyakan yang mana.
      </p>

      <dl className="mt-10 divide-y divide-hairline border-y border-hairline text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-wrap gap-x-6 gap-y-1 py-3">
            <dt className="w-40 shrink-0 text-muted">{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>

      {kost.catatan && (
        <p className="mt-4 text-sm">
          <span className="text-muted">Catatan admin: </span>
          {kost.catatan}
        </p>
      )}

      {kost.needsReview && (
        <p className="mt-4 border-l-2 border-flag pl-3 text-sm text-flag">
          Data listing ini perlu diverifikasi admin: {kost.reviewNotes.join('; ')}.
        </p>
      )}

      <section className="mt-10 border-t border-hairline pt-4 text-sm text-muted">
        <h2 className="font-mono text-xs uppercase tracking-wide">Sebelum menghubungi</h2>
        <ul className="mt-2 space-y-1.5">
          <li>
            Info ini direkap dari postingan publik, bukan hasil survei. Harga dan ketersediaan kamar bisa
            sudah berubah.
          </li>
          <li>Lihat kondisi kost langsung sebelum melakukan pembayaran atau DP.</li>
          <li>
            Admin hanya mengumpulkan informasi. Kecurangan atau kesalahpahaman dengan pemilik kost bukan
            tanggung jawab admin.
          </li>
        </ul>
      </section>

      {tetangga.length > 0 && (
        <section className="mt-12">
          <h2 className="font-mono text-xs uppercase tracking-wide text-muted">
            Kost lain di {kost.area}
          </h2>
          <div className="mt-4 grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {tetangga.map((k) => (
              <KostCard key={k.id} kost={k} />
            ))}
          </div>
          <p className="mt-6 text-sm">
            <Link href={`/area/${slugifyArea(kost.area)}/`} className="underline">
              Lihat semua kost di {kost.area}
            </Link>
          </p>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Semua kost', path: '/' },
              { name: `Kost ${kost.area}`, path: `/area/${slugifyArea(kost.area)}/` },
              { name: kost.alamat, path: `/kost/${kost.slug}/` },
            ]),
          ),
        }}
      />
    </article>
  )
}
