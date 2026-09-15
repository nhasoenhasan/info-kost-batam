import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { SITE_NAME, SITE_URL } from '@/lib/phone'
import { report } from '@/lib/kost'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${report.kept} info kost & kontrakan di Batam`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    `Kumpulan ${report.kept} info kost dan kontrakan di Batam dari rekap postingan publik Facebook. ` +
    'Cari berdasarkan area, budget, dan kriteria putra/putri/campur — langsung chat pemilik lewat WhatsApp.',
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${report.kept} info kost di Batam`,
    description: 'Cari kost di Batam berdasarkan area dan budget, lalu chat pemilik langsung via WhatsApp.',
    url: SITE_URL,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f1eee9' },
    { media: '(prefers-color-scheme: dark)', color: '#100f0e' },
  ],
}

/* Dijalankan sebelum body dirender: tanpa ini, pengguna yang memilih tema
   gelap akan melihat kedipan tema terang dulu. */
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t}}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
