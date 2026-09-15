import Link from 'next/link'
import { report } from '@/lib/kost'
import { SITE_NAME } from '@/lib/phone'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" className="flex items-baseline gap-2 hover:opacity-80">
          <span className="font-mono text-sm font-semibold tracking-tight">
            {SITE_NAME}
          </span>
          <span className="hidden text-xs text-muted sm:inline">{report.kept} listing</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/#daftar" className="hover:underline">
            Daftar kost
          </Link>
          <Link href="/tentang/" className="hover:underline">
            Tentang
          </Link>
        </nav>
      </div>
    </header>
  )
}
