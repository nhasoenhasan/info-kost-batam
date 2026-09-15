'use client'

import { useState } from 'react'

export function CopyButton({ text, label = 'Salin alamat' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] text-muted underline decoration-hairline underline-offset-4 hover:text-ink"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        className="size-3.5"
      >
        <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
        <path d="M10.5 3.5h-6a1.5 1.5 0 0 0-1.5 1.5v6" />
      </svg>
      {copied ? 'Tersalin' : label}
    </button>
  )
}
