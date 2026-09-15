import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-20 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-wide text-muted">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Halaman ini tidak ada di daftar kami.
      </h1>
      <p className="mt-3 text-sm text-muted">
        Listing yang kamu cari mungkin sudah dihapus pemiliknya, atau alamat URL-nya salah ketik.
      </p>
      <p className="mt-6 text-sm">
        <Link href="/" className="underline">
          Kembali ke daftar kost
        </Link>
      </p>
    </div>
  )
}
