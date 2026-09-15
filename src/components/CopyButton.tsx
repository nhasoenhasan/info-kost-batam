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
      className="rounded-md border border-hairline px-3 py-1.5 text-sm transition-colors hover:border-ink"
    >
      {copied ? 'Tersalin ✓' : label}
    </button>
  )
}
