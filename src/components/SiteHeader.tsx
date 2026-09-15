import Link from 'next/link'
import { SITE_NAME } from '@/lib/phone'
import { ThemeToggle } from './ThemeToggle'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-2 sm:px-8">
        <Link href="/" className="type-micro inline-flex min-h-11 items-center hover:opacity-70">
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/#daftar" className="type-micro inline-flex min-h-11 items-center text-muted hover:text-ink">
            Daftar
          </Link>
          <Link href="/tentang/" className="type-micro inline-flex min-h-11 items-center text-muted hover:text-ink">
            Tentang
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
