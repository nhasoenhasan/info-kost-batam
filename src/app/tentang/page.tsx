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
    <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="type-display max-w-[26ch]">Tentang &amp; disclaimer</h1>

      <div className="mt-12 space-y-10">
        <section>
          <h2 className="type-micro text-muted">Dari mana datanya</h2>
          <p className="type-body measure mt-3">
            Semua {report.kept} listing di sini direkap dari postingan publik di Facebook dan catatan
            admin — bukan hasil survei lapangan, dan bukan data pribadi siapa pun. Daftar mentahnya
            disimpan internal dan tidak dibagikan ke publik, supaya nomor kontak dan catatan pemilik kost
            tidak tersebar lebih jauh dari yang sudah mereka posting sendiri.
          </p>
        </section>

        <section>
          <h2 className="type-micro text-muted">Yang perlu kamu tahu sebelum menghubungi</h2>
          <ul className="type-body measure mt-3 space-y-2">
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
          <h2 className="type-micro text-muted">Melaporkan data yang keliru</h2>
          <p className="type-body measure mt-3">
            Data direkap manual, jadi pasti ada kemungkinan salah. Dari {report.totalRows} baris yang
            diperiksa, {report.needsReview.length} listing masih butuh verifikasi — misalnya nomor atau
            harga belum lengkap, atau ada dua harga berbeda untuk alamat yang sama.
          </p>
          {ADMIN_WA ? (
            <p className="mt-5">
              <a
                href={`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(pesanLaporan)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="type-micro underline-offset-4 hover:underline"
              >
                Lapor ke admin lewat WhatsApp →
              </a>
            </p>
          ) : (
            <p className="type-body measure mt-3 text-muted">
              Kanal resmi untuk melaporkan data keliru sedang disiapkan. Sementara ini, koreksi dan
              penghapusan listing dilakukan berkala oleh admin saat pembaruan data.
            </p>
          )}
          <p className="type-body measure mt-3">
            Pemilik kost yang ingin listing-nya dihapus juga bisa mengajukan permintaan — data akan
            ditandai dihapus dan hilang dari website pada pembaruan berikutnya.
          </p>
        </section>

        <section>
          <h2 className="type-micro text-muted">Cara pakai</h2>
          <p className="type-body measure mt-3">
            Gunakan pencarian dan filter di{' '}
            <Link href="/" className="underline underline-offset-4 hover:text-accent-text">
              halaman utama
            </Link>{' '}
            untuk menyaring berdasarkan area, jenis, kriteria, dan budget maksimum. Filter tersimpan di
            URL, jadi hasilnya bisa kamu kirim ke teman lewat WhatsApp. Klik &ldquo;Chat pemilik&rdquo;
            untuk membuka WhatsApp dengan pesan yang sudah terisi.
          </p>
        </section>

        <section>
          <h2 className="type-micro text-muted">Cakupan area</h2>
          <p className="type-body measure mt-3">
            {areasByCount.map((a, i) => (
              <span key={a.area}>
                {i > 0 && ', '}
                <Link
                  href={`/area/${a.area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`}
                  className="underline-offset-4 hover:underline"
                >
                  {a.area}
                </Link>{' '}
                <span className="type-num text-muted">({a.count})</span>
              </span>
            ))}
            .
          </p>
        </section>

        <p className="type-micro border-t border-hairline pt-6 text-muted">
          Diperbarui {tanggal} · setiap listing menampilkan nomor kontak pemiliknya sendiri — hubungi
          langsung nomor tersebut, bukan lewat admin.
        </p>
      </div>
    </div>
  )
}
