/**
 * Rapikan teks alamat dari spreadsheet.
 *
 * Sheet menyimpan alamat multi-baris (newline di dalam sel) dan sering punya
 * tanda baca ganda seperti "168).," yang muncul setelah newline diubah jadi koma.
 *
 * @param {string} raw
 * @returns {string}
 */
export function tidyAlamat(raw) {
  return String(raw ?? '')
    .replace(/\s*\n\s*/g, ', ') // newline dalam sel → koma
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,{2,}/g, ',')
    .replace(/\.\s*,\s*/g, '. ') // "168)., " → "168). "
    .replace(/[,\s]+$/, '') // buang koma/spasi di ujung
    .trim()
}

/**
 * Rapikan catatan admin: buang spasi berlebih dan baris baru.
 * @param {string} raw
 */
export function tidyCatatan(raw) {
  return String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}
