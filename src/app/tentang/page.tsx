import type { Metadata } from 'next'
import Link from 'next/link'
import { areasByCount, report } from '@/lib/kost'

export const metadata: Metadata = {
  title: 'Tentang & disclaimer',
  description:
    'Dari mana data INFO KOST BATAM berasal, apa batasannya, dan bagaimana melaporkan info yang keliru.',
  alternates: { canonical: '/tentang/' },
}

const tanggal = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(report.generatedAt))

export default function TentangPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tentang &amp; disclaimer</h1>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed">
        <section>
          <h2 className="font-mono text-xs uppercase tracking-wide text-muted">Dari mana datanya</h2>
          <p className="mt-2">
            Semua {report.kept} listing di sini direkap dari postingan publik di Facebook dan catatan admin
            — bukan hasil survei lapangan, dan bukan data pribadi siapa pun. Setiap listing menyertakan
            nomor baris spreadsheet sumbernya supaya bisa ditelusuri.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-xs uppercase tracking-wide text-muted">
            Yang perlu kamu tahu sebelum menghubungi
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Harga, ketersediaan kamar, dan kondisi kost bisa berubah kapan saja.</li>
            <li>Admin tidak mensurvei semua kost yang ada di daftar ini.</li>
            <li>
              Lihat lokasi dan kondisi kost langsung sebelum melakukan pembayaran atau DP. Jangan transfer
              tanpa melihat.
            </li>
            <li>
              Kalau ada perubahan harga, kamar sudah penuh, atau kendala saat berkomunikasi, selesaikan
              langsung dengan pemilik kost.
            </li>
            <li>Admin tidak memungut biaya apa pun, baik dari pencari kost maupun pemilik.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-mono text-xs uppercase tracking-wide text-muted">
            Melaporkan data yang keliru
          </h2>
          <p className="mt-2">
            Data direkap manual, jadi pasti ada kemungkinan salah. Dari {report.totalRows} baris yang
            diperiksa, {report.needsReview.length} listing masih butuh verifikasi (nomor atau harga belum
            lengkap, atau ada dua harga berbeda untuk alamat yang sama). Kalau kamu menemukan info yang
            salah, sudah tidak berlaku, atau ingin listingmu dihapus,
            hubungi admin lewat spreadsheet sumber atau WhatsApp yang tertera, dan sebutkan alamat kostnya.
          </p>
          <p className="mt-2">
            Pemilik kost yang ingin listing-nya dihapus juga bisa minta langsung — data akan ditandai
            dihapus di spreadsheet dan hilang dari website pada sinkronisasi berikutnya.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-xs uppercase tracking-wide text-muted">Cara pakai</h2>
          <p className="mt-2">
            Gunakan pencarian dan filter di{' '}
            <Link href="/" className="underline">
              halaman utama
            </Link>{' '}
            untuk menyaring berdasarkan area, jenis (kost atau kontrakan), kriteria (putra/putri/campur), dan
            budget maksimum. Filter tersimpan di URL, jadi hasilnya bisa kamu kirim ke teman lewat WhatsApp.
            Klik &ldquo;Chat pemilik&rdquo; untuk membuka WhatsApp dengan pesan yang sudah terisi.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-xs uppercase tracking-wide text-muted">Cakupan area</h2>
          <p className="mt-2">
            {areasByCount.map((a, i) => (
              <span key={a.area}>
                {i > 0 && ', '}
                <Link href={`/area/${a.area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`} className="underline">
                  {a.area}
                </Link>{' '}
                ({a.count})
              </span>
            ))}
            .
          </p>
        </section>

        <section className="border-t border-hairline pt-4 text-sm text-muted">
          <p>
            Data terakhir disinkronkan {tanggal}. Sumber:{' '}
            <a
              href="https://docs.google.com/spreadsheets/d/1P9lqbRjuUd03DVcImQQwzSKCIaR7f5FvzywW0ou1G_Q/htmlview"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              spreadsheet INFO KOST BATAM
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
