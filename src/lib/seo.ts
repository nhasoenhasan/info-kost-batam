import { SITE_URL } from './phone'
import type { KostListItem } from './types'

export function formatRupiah(value: number | null): string {
  if (value === null) return 'Hubungi pemilik'
  // Intl id-ID menyisipkan spasi tak-terlihat (U+00A0) setelah "Rp" — dibuang
  // supaya konsisten dan hemat lebar di kartu sempit.
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\u00a0/g, '')
}

/** "Rp1.100.000" → "1,1jt" buat chip filter yang sempit. */
export function formatRupiahShort(value: number | null): string {
  if (value === null) return 'Tanpa harga'
  if (value >= 1_000_000) {
    const juta = value / 1_000_000
    return `${Number.isInteger(juta) ? juta : juta.toFixed(1).replace('.', ',')}jt`
  }
  return `${Math.round(value / 1000)}rb`
}

export function kostUrl(slug: string): string {
  return `${SITE_URL}/kost/${slug}/`
}

/**
 * Structured data untuk daftar listing.
 * Sengaja TANPA `price` — harga kost sering berubah dan kita tidak mau Google
 * menampilkan harga basi sebagai fakta. Harga tetap muncul di teks halaman.
 */
export function itemListJsonLd(items: KostListItem[], baseUrl: string = SITE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Accommodation',
        name: `${item.jenis} ${item.kriteria} di ${item.area}`,
        description: item.alamat,
        url: `${baseUrl}/kost/${item.slug}/`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: item.alamat,
          addressLocality: item.area,
          addressRegion: 'Kepulauan Riau',
          addressCountry: 'ID',
        },
      },
    })),
  }
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[], baseUrl: string = SITE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${baseUrl}${t.path}`,
    })),
  }
}
