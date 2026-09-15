import { buildWaLink, waMessage } from '@/lib/phone'
import type { KostRecord } from '@/lib/types'

/**
 * Afordans WhatsApp.
 *
 * - `text` (default): link teks dengan tanda panah. Dipakai di daftar, tempat
 *   24 tombol solid sekaligus akan mengalahkan informasi kostnya.
 * - `solid`: tombol solid warna aksen. Cuma dipakai sekali — di halaman detail,
 *   tempat satu aksi utama memang pantas menonjol.
 */
export function WaButton({
  kost,
  full = false,
  /* "via WhatsApp" sengaja ikut di label yang terlihat, bukan cuma di aria-label:
     nilai utama direktori ini memang chat langsung ke pemilik lewat WA, dan
     "Chat pemilik" saja bisa disangka fitur chat internal. */
  label = 'Chat pemilik via WhatsApp',
  variant = 'text',
}: {
  kost: Pick<KostRecord, 'alamat' | 'area' | 'wa'>
  full?: boolean
  label?: string
  variant?: 'text' | 'solid'
}) {
  const href = buildWaLink(kost.wa, waMessage(kost))

  if (!href) {
    return <p className="type-body text-muted">Nomor WhatsApp belum tersedia untuk listing ini.</p>
  }

  const style =
    variant === 'solid'
      ? 'rounded-md bg-accent px-5 py-3 text-sm font-medium text-white hover:opacity-90'
      : 'text-[0.9375rem] font-medium text-ink underline-offset-4 hover:text-accent-text hover:underline'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat pemilik kost di ${kost.alamat} via WhatsApp`}
      className={`inline-flex min-h-11 items-center gap-1.5 transition-colors ${style} ${
        full ? 'w-full justify-center' : ''
      }`}
    >
      {label}
      <span aria-hidden="true">→</span>
    </a>
  )
}
