import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WaButton } from '@/components/WaButton'
import { formatPhoneForDisplay, waMessage } from '@/lib/phone'

const kost = { alamat: 'Ruko Aljabar A2', area: 'Bengkong', wa: '628170017875' }

describe('WaButton', () => {
  it('menyusun link wa.me dengan nomor tujuan', () => {
    render(<WaButton kost={kost} />)
    const a = screen.getByRole('link', { name: /whatsapp/i })
    expect(a).toHaveAttribute('href', expect.stringContaining('https://wa.me/628170017875?text='))
  })

  it('pesan berisi alamat kost dan asal datanya', () => {
    render(<WaButton kost={kost} />)
    const href = screen.getByRole('link').getAttribute('href')!
    const pesan = decodeURIComponent(href)
    expect(pesan).toContain('Ruko Aljabar A2')
    expect(pesan).toContain('INFO KOST BATAM')
  })

  it('label default menyebut WhatsApp', () => {
    render(<WaButton kost={kost} />)
    expect(screen.getByRole('link')).toHaveTextContent(/whatsapp/i)
  })

  it('tanpa nomor: tidak ada link, ada penjelasan', () => {
    render(<WaButton kost={{ ...kost, wa: null }} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText(/nomor whatsapp belum tersedia/i)).toBeInTheDocument()
  })

  it('dibuka di tab baru dengan rel yang aman', () => {
    render(<WaButton kost={kost} />)
    const a = screen.getByRole('link')
    expect(a).toHaveAttribute('target', '_blank')
    expect(a).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})

describe('waMessage', () => {
  it('menyebut alamat dan area', () => {
    const m = waMessage(kost)
    expect(m).toContain('Ruko Aljabar A2')
    expect(m).toContain('Bengkong')
  })
})

describe('formatPhoneForDisplay', () => {
  it('mengubah 62 menjadi 0 dan memberi tanda hubung', () => {
    expect(formatPhoneForDisplay('628170017875')).toBe('0817-0017-875')
  })
  it('null tetap null', () => {
    expect(formatPhoneForDisplay(null)).toBeNull()
  })
})
