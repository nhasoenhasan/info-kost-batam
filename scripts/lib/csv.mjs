/**
 * Parser CSV minimal tapi benar untuk output Google Sheets.
 * Penting: Google Sheets mengutip field yang mengandung newline (mis. alamat 2 baris),
 * jadi split('\n') biasa akan merusak data. Parser ini stateful per karakter.
 */
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const src = String(text).replace(/^\uFEFF/, '')

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') inQuotes = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (ch === '\r') {
      // CRLF: abaikan CR
    } else {
      field += ch
    }
  }

  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }

  // buang baris kosong (sheet punya banyak baris pemisah)
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''))
}
