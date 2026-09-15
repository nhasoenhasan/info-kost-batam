/** Daftar area kanonik di Batam (dipakai untuk halaman /area/<slug>/ dan filter). */
export const AREAS = [
  'Batam Center',
  'Bengkong',
  'Batu Aji',
  'Nagoya',
  'Tiban',
  'Sekupang',
  'Batu Ampar',
  'Lubuk Baja',
  'Botania',
  'Nongsa',
  'Piayu',
  'Belian',
  'Sagulung',
  'Batu Besar',
]

/** Alias nilai kolom "Lokasi" di sheet → area kanonik. */
const ALIASES = {
  'batam center': 'Batam Center',
  'batam centre': 'Batam Center',
  batamcentre: 'Batam Center',
  btc: 'Batam Center',
  bengkong: 'Bengkong',
  'batu aji': 'Batu Aji',
  batamaji: 'Batu Aji',
  nagoya: 'Nagoya',
  tiban: 'Tiban',
  sekupang: 'Sekupang',
  'batu ampar': 'Batu Ampar',
  'lubuk baja': 'Lubuk Baja',
  baloi: 'Lubuk Baja',
  botania: 'Botania',
  nongsa: 'Nongsa',
  piayu: 'Piayu',
  'sei beduk': 'Piayu',
  belian: 'Belian',
  sagulung: 'Sagulung',
  'batu besar': 'Batu Besar',
}

/**
 * Override manual: baris yang kolom "Lokasi"-nya terbukti bentrok dengan alamatnya.
 * Dicocokkan ke alamat (bukan nomor baris) supaya tetap jalan kalau sheet diurut ulang.
 */
export const ADDRESS_OVERRIDES = [
  {
    match: /gaia buana central park/i,
    to: 'Sagulung',
    reason: 'Alamat menyebut Taman Cipta Asri / Sagulung, label sheet Lubuk Baja & Batu Aji',
  },
  {
    match: /batara raya/i,
    to: 'Batam Center',
    reason: 'Label sheet Belian vs Batam Center untuk alamat yang sama',
  },
]

/**
 * @param {string} raw nilai kolom Lokasi
 * @param {string} [alamat]
 * @param {(o: {match: RegExp, to: string, reason: string}) => void} [onOverride]
 * @returns {string | null} null kalau tidak dikenal (baris akan dibuang + dilaporkan)
 */
export function canonicalArea(raw, alamat = '', onOverride) {
  for (const o of ADDRESS_OVERRIDES) {
    if (o.match.test(alamat)) {
      if (onOverride) onOverride(o)
      return o.to
    }
  }
  const key = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
  return ALIASES[key] ?? null
}
