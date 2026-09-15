import { buildWaLink, waMessage } from '@/lib/phone'
import type { KostRecord } from '@/lib/types'

/**
 * Tombol WA. Pesan sudah terisi (alamat + sumber) supaya pemilik langsung paham
 * dan pengunjung tidak perlu mengetik apa pun.
 */
export function WaButton({
  kost,
  full = false,
  label = 'Chat pemilik via WhatsApp',
  variant = 'solid',
}: {
  kost: Pick<KostRecord, 'alamat' | 'area' | 'wa'>
  full?: boolean
  label?: string
  /** solid = aksi utama (halaman detail), outline = afordans saat menjelajah daftar */
  variant?: 'solid' | 'outline'
}) {
  const href = buildWaLink(kost.wa, waMessage(kost))

  if (!href) {
    return (
      <p className="text-sm text-muted">
        Nomor WhatsApp belum tersedia untuk listing ini — cek spreadsheet sumber untuk info terbaru.
      </p>
    )
  }

  const style =
    variant === 'solid'
      ? 'bg-brand text-white hover:bg-brand-dark'
      : 'border border-hairline text-ink hover:border-ink'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat pemilik kost di ${kost.alamat} via WhatsApp`}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${style} ${
        full ? 'w-full' : ''
      }`}
    >
      {label}
    </a>
  )
}
