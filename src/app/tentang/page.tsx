import type { Metadata } from 'next'
import Link from 'next/link'
import { areasByCount, report } from '@/lib/kost'
import { ADMIN_WA } from '@/lib/phone'

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

const pesanLaporan =
  'Halo admin INFO KOST BATAM, saya mau lapor data yang keliru di website. Alamat kostnya: '

export default function TentangPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tentang &amp; disclaimer</h1>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed">
        <section>
          <h2 className="font-mono text-xs tracking-wide uppercase text-muted">Dari mana datanya</h2>
          <p className="mt-2">
            Semua {report.kept} listing di sini direkap dari postingan publik di Facebook dan catatan
            admin — bukan hasil survei lapangan, dan bukan data pribadi siapa pun. Daftar mentahnya
            disimpan internal dan tidak dibagikan ke publik, supaya nomor kontak dan catatan pemilik kost
            tidak tersebar lebih jauh dari yang sudah mereka posting sendiri.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-xs tracking-wide uppercase text-muted">
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
          <h2 className="font-mono text-xs tracking-wide uppercase text-muted">
            Melaporkan data yang keliru
          </h2>
          <p className="mt-2">
            Data direkap manual, jadi pasti ada kemungkinan salah. Dari {report.totalRows} baris yang
            diperiksa, {report.needsReview.length} listing masih butuh verifikasi — misalnya nomor atau
            harga belum lengkap, atau ada dua harga berbeda untuk alamat yang sama.
          </p>
          {ADMIN_WA ? (
            <p className="mt-3">
              <a
                href={`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(pesanLaporan)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-hairline px-4 py-2.5 text-sm font-medium hover:border-ink"
              >
                Lapor ke admin lewat WhatsApp
              </a>
            </p>
          ) : (
            <p className="mt-2 text-muted">
              Kanal resmi untuk melaporkan data keliru sedang disiapkan. Sementara ini, koreksi dan
              penghapusan listing dilakukan berkala oleh admin saat pembaruan data.
            </p>
          )}
          <p className="mt-3">
            Pemilik kost yang ingin listing-nya dihapus juga bisa mengajukan permintaan — data akan
            ditandai dihapus dan hilang dari website pada pembaruan berikutnya.
          </p>
        </section>

        <section>
          <h2 className="font-mono text-xs tracking-wide uppercase text-muted">Cara pakai</h2>
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
          <h2 className="font-mono text-xs tracking-wide uppercase text-muted">Cakupan area</h2>
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
            Data terakhir diperbarui {tanggal}. Setiap listing menampilkan nomor kontak pemilik kostnya
            sendiri — hubungi langsung nomor tersebut, bukan lewat admin.
          </p>
        </section>
      </div>
    </div>
  )
}
