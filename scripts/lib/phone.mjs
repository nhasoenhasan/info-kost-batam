/**
 * Normalisasi nomor telepon Indonesia ke format WhatsApp (62…, tanpa + / spasi).
 * @param {string} raw
 * @returns {{ wa: string | null, needsReview: boolean }}
 */
export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return { wa: null, needsReview: true }

  let n = digits
  if (n.startsWith('62')) n = n
  else if (n.startsWith('0')) n = '62' + n.slice(1)
  else if (n.startsWith('8')) n = '62' + n
  else return { wa: null, needsReview: true }

  const ok = /^62\d{8,13}$/.test(n)
  return { wa: ok ? n : null, needsReview: !ok }
}

/**
 * @param {string | null} wa
 * @param {string} message
 * @returns {string | null}
 */
export function buildWaLink(wa, message) {
  if (!wa) return null
  return `https://wa.me/${wa}?text=${encodeURIComponent(message)}`
}
