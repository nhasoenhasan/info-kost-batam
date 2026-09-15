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
      value: (
        <Link href={`/area/${slugifyArea(kost.area)}/`} className="underline-offset-4 hover:underline">
          {kost.area}
        </Link>
      ),
    },
    { label: 'Jenis', value: kost.jenis },
    { label: 'Kriteria', value: kost.kriteria },
    {
      label: 'Budget',
      value: (
        <>
          {kost.harga !== null ? formatRupiah(kost.harga) : 'belum tercantum'}
          {kost.harga !== null && <span className="text-muted"> /bulan</span>}
        </>
      ),
    },
    {
      label: 'Nomor WhatsApp',
      value: <span className="type-num">{formatPhoneForDisplay(kost.wa) ?? 'belum tersedia'}</span>,
    },
  ]

  // baris kosong tidak ditampilkan — "REFERENSI —" terbaca seperti halaman belum selesai
  if (kost.referensi.length) {
    rows.push({ label: 'Referensi', value: kost.referensi.join(', ') })
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <nav aria-label="Breadcrumb" className="type-micro text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-ink">
              Semua kost
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/area/${slugifyArea(kost.area)}/`} className="hover:text-ink">
              {kost.area}
            </Link>
          </li>
        </ol>
      </nav>

      <h1 className="mt-6 text-[1.375rem] leading-[1.25] font-medium tracking-[-0.02em] sm:text-[1.75rem]">
        {kost.alamat}
      </h1>
      <p className="type-micro mt-3 text-muted">
        {kost.jenis} · {kost.kriteria}
      </p>

      <p className="mt-8 text-[1.75rem] leading-none font-medium tracking-[-0.02em]">
        {kost.harga !== null ? (
          <>
            <span className="type-num">{formatRupiah(kost.harga)}</span>
            <span className="type-micro ml-2 align-middle text-muted">/bulan</span>
          </>
        ) : (
          <span className="text-muted">Harga belum tercantum</span>
        )}
      </p>

      {kost.hargaAlternatif.length > 1 && (
        <p className="type-body measure mt-4 text-muted italic">
          Sumber data juga menyebut{' '}
          {kost.hargaAlternatif
            .filter((h) => h !== kost.harga)
            .map((h) => formatRupiah(h))
            .join(', ')}{' '}
          untuk alamat ini. Konfirmasi harga terbaru ke pemilik.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-6">
        <WaButton kost={kost} variant="solid" />
        <CopyButton text={kost.alamat} />
      </div>
      <p className="type-body measure mt-3 text-sm text-muted">
        Pesan WhatsApp-nya sudah berisi alamat kost ini, jadi pemilik langsung tahu kamu menanyakan yang
        mana.
      </p>

      <div className="card mt-12 p-6">
        <dl className="divide-y divide-hairline text-[0.9375rem]">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-wrap gap-x-6 gap-y-1 py-3.5 first:pt-0 last:pb-0">
              <dt className="type-micro w-40 shrink-0 pt-1 text-muted">{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* tautan WA diulang di sini supaya tetap terjangkau tanpa scroll balik ke atas */}
      <p className="mt-5">
        <WaButton kost={kost} />
      </p>

      {kost.catatan && (
        <p className="type-body measure mt-6 text-muted">
          <span className="type-micro mr-2">Catatan admin</span>
          {kost.catatan}
        </p>
      )}

      {kost.needsReview && (
        <p className="type-body measure mt-6 border-l border-hairline pl-4 text-muted italic">
          Data listing ini perlu diverifikasi admin: {kost.reviewNotes.join('; ')}.
        </p>
      )}

      <section className="type-body measure mt-12 border-t border-hairline pt-5 text-muted">
        <p className="type-micro mb-3">Sebelum menghubungi</p>
        <ul className="space-y-2">
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
        <section className="mt-16">
          <div className="flex items-baseline justify-between gap-4">
            <p className="type-micro text-muted">Area yang sama</p>
            <Link
              href={`/area/${slugifyArea(kost.area)}/`}
              className="type-micro underline-offset-4 hover:underline"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {tetangga.map((k) => (
              <KostCard key={k.id} kost={k} />
            ))}
          </div>
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
