import Link from 'next/link'
import { report } from '@/lib/kost'
import { SITE_NAME } from '@/lib/phone'

const tanggal = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(report.generatedAt))

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-hairline">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <p className="type-micro text-muted">{SITE_NAME}</p>
        <p className="type-body measure mt-4 text-muted">
          Semua data direkap dari postingan publik Facebook dan catatan admin, bukan hasil survei. Harga,
          ketersediaan kamar, dan kondisi kost bisa berubah kapan saja — konfirmasi langsung ke pemilik
          sebelum transfer atau DP.
        </p>
        <p className="type-micro mt-6 text-muted">
          Diperbarui {tanggal} ·{' '}
          <Link href="/tentang/" className="underline underline-offset-4 hover:text-ink">
            Disclaimer &amp; cara lapor
          </Link>
        </p>
      </div>
    </footer>
  )
}
