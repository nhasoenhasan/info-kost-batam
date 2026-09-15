/**
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
}

/**
 * Slug stabil: area + alamat + 4 digit terakhir nomor WA.
 * Sengaja TIDAK memuat harga — harga berubah, URL jangan.
 * @param {{ area: string, alamat: string, wa: string | null, no?: number }} input
 */
export function buildSlug({ area, alamat, wa, no }) {
  const tail = wa ? wa.slice(-4) : String(no ?? '')
  return slugify(`${area} ${alamat} ${tail}`)
}
