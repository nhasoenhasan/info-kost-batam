'use client'

import { useCallback, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

/**
 * Tema dibaca sebagai external store, bukan state React yang di-set di effect:
 * sumber kebenarannya ada di luar React (atribut data-theme di <html> +
 * preferensi sistem + localStorage), dan React punya hook khusus untuk itu.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', onChange)
  // ikut berubah kalau tab lain mengganti tema
  window.addEventListener('storage', onChange)

  return () => {
    observer.disconnect()
    media.removeEventListener('change', onChange)
    window.removeEventListener('storage', onChange)
  }
}

function getSnapshot(): Theme {
  const attr = document.documentElement.dataset.theme
  if (attr === 'light' || attr === 'dark') return attr
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/* Saat build/prerender belum ada DOM. Snapshot server dikembalikan sampai
   hidrasi selesai, baru React memakai nilai asli dari browser. */
function getServerSnapshot(): Theme {
  return 'light'
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback(() => {
    const next: Theme = getSnapshot() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // storage diblokir (mode privat): tema tetap berlaku untuk sesi ini
    }
  }, [])

  const label = `Ganti ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-select hover:text-ink"
    >
      {theme === 'dark' ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          className="size-[1.125rem]"
        >
          <circle cx="10" cy="10" r="3.6" />
          <path
            d="M10 2.2v1.6M10 16.2v1.6M2.2 10h1.6M16.2 10h1.6M4.5 4.5l1.1 1.1M14.4 14.4l1.1 1.1M15.5 4.5l-1.1 1.1M5.6 14.4l-1.1 1.1"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          className="size-[1.125rem]"
        >
          <path d="M16.5 12.2A6.8 6.8 0 0 1 7.8 3.5a6.9 6.9 0 1 0 8.7 8.7Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
