import type { KostRecord } from './types'

export const SITE_NAME = 'INFO KOST BATAM'
export const SITE_URL = 'https://kost.nhasan.tech'

const BRAND_TAIL = `\n\n(Dari ${SITE_NAME})`

/** Pesan WA yang sudah berisi konteks, supaya pemilik langsung paham maksudnya. */
export function waMessage(kost: Pick<KostRecord, 'alamat' | 'area'>) {
  return (
    `Halo, saya dapat info dari ${SITE_NAME}.\n\n` +
    `Mau tanya soal kost di: ${kost.alamat} (${kost.area}, Batam).\n` +
    `Masih ada kamar kosong? Berapa harga sewanya sekarang?\n\n` +
    `Terima kasih.`
  )
}

export function buildWaLink(wa: string | null, message: string): string | null {
  if (!wa) return null
  return `https://wa.me/${wa}?text=${encodeURIComponent(message + BRAND_TAIL)}`
}

export function formatPhoneForDisplay(wa: string | null): string | null {
  if (!wa) return null
  // 6281234567890 → 0812-3456-7890
  const local = '0' + wa.slice(2)
  return local.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3')
}
