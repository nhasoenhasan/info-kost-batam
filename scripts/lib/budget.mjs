/**
 * @param {string} raw
 * @returns {number | null}
 */
export function parseBudget(raw) {
  const digits = String(raw ?? '').replace(/[^\d]/g, '')
  if (!digits) return null
  const value = Number(digits)
  // di bawah 100rb hampir pasti salah ketik untuk harga kost bulanan
  if (!Number.isFinite(value) || value < 100_000) return null
  return value
}

/**
 * Sheet memakai "Pria"/"Putri"/"Campur" dengan kapitalisasi tak konsisten,
 * plus satu nilai "Masih ditanya". Di UI kita pakai "Putra".
 * @param {string} raw
 * @returns {'Putra' | 'Putri' | 'Campur' | 'Belum jelas'}
 */
export function parseKriteria(raw) {
  const v = String(raw ?? '')
    .trim()
    .toLowerCase()
  if (v === 'pria' || v === 'putra') return 'Putra'
  if (v === 'putri') return 'Putri'
  if (v === 'campur') return 'Campur'
  return 'Belum jelas'
}

/**
 * @param {string} raw
 * @returns {'Kost' | 'Kontrakan'}
 */
export function parseJenis(raw) {
  const v = String(raw ?? '')
    .trim()
    .toLowerCase()
  return v.includes('kontrakan') ? 'Kontrakan' : 'Kost'
}
