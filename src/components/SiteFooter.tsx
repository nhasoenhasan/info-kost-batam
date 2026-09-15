import { report } from '@/lib/kost'
import { SITE_NAME } from '@/lib/phone'
import Link from 'next/link'

const tanggal = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(report.generatedAt))

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-hairline">
      <div className="mx-auto w-full max-w-5xl space-y-3 px-5 py-8 text-sm text-muted sm:px-8">
        <p className="text-ink">
          {SITE_NAME} — rekap {report.kept} info kost dari {report.totalRows} baris data publik.
        </p>
        <p>
          Semua data dikumpulkan dari postingan publik Facebook dan rekap admin, bukan hasil survei.
          Harga, ketersediaan kamar, dan kondisi kost bisa berubah kapan saja — konfirmasi langsung ke
          pemilik sebelum transfer atau DP.
        </p>
        <p>
          Data terakhir diperbarui {tanggal}. Ada info yang keliru atau sudah tidak berlaku?{' '}
          <Link href="/tentang/" className="underline">
            Lihat cara melaporkannya di halaman Tentang
          </Link>
          .
        </p>
      </div>
    </footer>
  )
}
