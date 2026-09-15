import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-24 sm:px-8">
      <p className="type-micro text-muted">404</p>
      <h1 className="type-section mt-4">Halaman ini tidak ada di daftar kami.</h1>
      <p className="type-body measure mt-4 text-muted">
        Listing yang kamu cari mungkin sudah diturunkan pemiliknya, atau alamat URL-nya salah ketik.
      </p>
      <p className="mt-8">
        <Link href="/" className="type-micro underline-offset-4 hover:underline">
          Kembali ke daftar kost →
        </Link>
      </p>
    </div>
  )
}
