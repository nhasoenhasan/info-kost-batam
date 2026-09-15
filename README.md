# INFO KOST BATAM

Website direktori kost & kontrakan di Batam, dibangun dari spreadsheet
["🏠 INFO KOST BATAM"](https://docs.google.com/spreadsheets/d/1P9lqbRjuUd03DVcImQQwzSKCIaR7f5FvzywW0ou1G_Q/htmlview)
(147 listing, hasil rekap postingan publik Facebook).

**Live:** https://kost.nhasan.tech (subdomain dari VPS `web-personal`)

---

## Kenapa statis?

Data cuma berubah saat admin mengedit spreadsheet. Jadi seluruh situs di-*pre-render*
saat build (`output: 'export'`) — 167 halaman HTML, tanpa database, tanpa server Node
yang jalan terus. Filter dan pencarian jalan di browser (147 record = tidak perlu index).

Filter tersimpan di URL, contoh: `/?area=Bengkong&kriteria=Putri&max=1000000` — hasil
filter bisa langsung dikirim ke teman lewat WhatsApp.

## Menjalankan lokal

```bash
pnpm install
pnpm sync     # tarik data terbaru dari Google Sheets → src/data/kost.json
pnpm dev      # http://localhost:3000
```

Perintah lain:

| Perintah | Fungsi |
|---|---|
| `pnpm build` | build static export ke `out/` |
| `pnpm test` | 83 unit test (Vitest) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm sync` | sinkronisasi data dari spreadsheet |

Preview hasil build seperti di produksi:

```bash
pnpm build && cd out && python3 -m http.server 4321
```

## Struktur

```
scripts/
  sync-kost.mjs        entry point: fetch CSV → bersihkan → tulis JSON
  lib/csv.mjs          parser CSV (tahan field multi-baris)
  lib/phone.mjs        normalisasi nomor ke format WhatsApp 62…
  lib/area.mjs         14 area kanonik + override label yang salah
  lib/budget.mjs       parse harga / kriteria / jenis
  lib/slug.mjs         slug stabil untuk URL
  lib/dedupe.mjs       gabungkan duplikat
  lib/text.mjs         rapikan teks alamat
src/
  data/kost.json       hasil sync, di-commit (yang dibaca website)
  data/kost-report.json laporan kualitas data
  lib/                 tipe, loader, filter murni, format, SEO
  components/          kartu, tombol WA, filter, header/footer
  app/                 halaman (App Router)
tests/unit/            unit test
```

## Sumber & pipeline data

Spreadsheet dibaca lewat **export CSV publik**:

```
https://docs.google.com/spreadsheets/d/1P9lqbRjuUd03DVcImQQwzSKCIaR7f5FvzywW0ou1G_Q/export?format=csv&gid=0
```

Catatan penting: mode `/htmlview` **tidak bisa** diparsing tool otomatis, jadi jangan
diganti ke htmlview. CSV export jalan tanpa API key dan tanpa OAuth.

Yang dilakukan `pnpm sync`:

1. Deteksi baris header secara dinamis (bukan nomor baris hardcode).
2. Cari kolom lewat **nama header**, jadi aman kalau admin menyisipkan kolom baru.
3. Buang kolom "Hubungi Langsung" — isinya formula Google yang rusak (`#VALUE!`).
4. Normalisasi: nomor WA → `62…`, lokasi → area kanonik, harga → integer, kriteria → Putra/Putri/Campur/Belum jelas.
5. Gabungkan duplikat (area + alamat sama). **Harga baris pertama dipertahankan apa adanya** — kalau ada harga berbeda, dicatat sebagai `hargaAlternatif` untuk ditinjau admin, bukan dirata-rata.
6. Buang baris dengan kolom `Status` berisi `hapus` / `nonaktif` / `penuh` (lihat di bawah).
7. **Guard:** kalau hasil sync < 120 listing, script gagal dan tidak menimpa data lama.

Hasil terakhir: 147 listing dari 157 baris · 9 duplikat digabung · 1 baris dibuang ·
13 listing ditandai perlu review.

## Cara admin update data

1. Edit spreadsheet seperti biasa (tambah / ubah / hapus baris).
2. Jalankan `pnpm sync`, lalu cek `src/data/kost-report.json`.
3. Commit + push — GitHub Actions akan build dan deploy otomatis.

**Menyembunyikan listing tanpa menghapus data:** tambahkan kolom bernama `Status`
di spreadsheet, isi `hapus` pada baris yang dimaksud. Baris itu akan hilang dari
website pada sync berikutnya, tapi datanya tetap ada di sheet. Berguna kalau pemilik
kost minta listing-nya diturunkan.

**Menambah area baru:** tambahkan nama area ke `AREAS` dan `ALIASES` di
`scripts/lib/area.mjs` (halaman `/area/<slug>/` dibuat otomatis dari data).

Kalau `pnpm sync` gagal dengan "lokasi tidak dikenal", artinya ada nilai kolom Lokasi
baru yang belum ada di `ALIASES` — tambahkan pemetaannya lalu jalankan ulang.

## Data quality

Yang masih perlu perhatian admin (semuanya tercatat di `kost-report.json`):

- 1 baris dibuang karena alamatnya kosong (baris #123, hanya ada area + nomor WA).
- 7 listing tanpa kriteria jelas (ditampilkan sebagai "Belum jelas").
- 3 listing tanpa harga valid.
- 6 pasang duplikat digabung; beberapa punya harga berbeda antara dua baris.
- Label area di sheet beberapa kali bentrok dengan alamatnya (Gaia Buana dilabeli
  Lubuk Baja/Batu Aji padahal alamatnya Sagulung) — sudah diperbaiki lewat
  `ADDRESS_OVERRIDES`, tapi lebih baik diperbaiki juga di spreadsheetnya.

Harga dan ketersediaan kamar bisa berubah tanpa pemberitahuan. Website menampilkan
disclaimer ini di footer dan halaman `/tentang/` — jangan dihapus.

## Deploy

Push ke `main` → `.github/workflows/deploy.yml` menjalankan test → Snyk → build →
`rsync` ke `ubuntu@43.128.113.94:/var/www/info-kost-batam/`.

Setup satu kali di VPS:

```bash
# 1. folder tujuan
ssh ubuntu@43.128.113.94 'sudo mkdir -p /var/www/info-kost-batam && sudo chown ubuntu:ubuntu /var/www/info-kost-batam'

# 2. nginx server block untuk subdomain
sudo tee /etc/nginx/sites-available/kost.nhasan.tech > /dev/null <<'NGINX'
server {
  listen 80;
  server_name kost.nhasan.tech;
  root /var/www/info-kost-batam;
  index index.html;
  location / { try_files $uri $uri/ $uri/index.html =404; }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/kost.nhasan.tech /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 3. TLS
sudo certbot --nginx -d kost.nhasan.tech
```

Di DNS: tambahkan record `A` dengan nama `kost` → `43.128.113.94`.

Secrets GitHub yang dipakai: `DEPLOY_KEY` (sama dengan `web-personal`) dan `SNYK_TOKEN`.

## Keputusan desain

- **Light-first + dark otomatis** (`prefers-color-scheme`), bukan toggle: audiensnya
  orang cari kost dari HP, sering siang hari.
- **Hairline, bukan kartu berbayang.** Pemisah antar listing pakai border tipis supaya
  grid 147 item tidak jadi dinding kotak.
- **Tombol WA outline di daftar, solid teal di halaman detail.** 24 tombol solid teal
  sekaligus membuat tombolnya mengalahkan informasi kostnya; solid disimpan untuk satu
  aksi utama di halaman detail.
- **Structured data tanpa harga.** Harga kost sering berubah — kita tidak mau Google
  menampilkan harga basi sebagai fakta. Harga tetap ada di teks halaman.
- **Slide pesan WA terisi otomatis** (alamat + asal data) supaya pemilik langsung paham
  dan pengunjung tidak perlu mengetik.

## Yang belum ada

- Foto kost (belum ada di spreadsheet; butuh alur upload terpisah).
- Analytics klik WA (sengaja dilewati — kalau nanti perlu, pakai Umami/Plausible yang cookieless).
- Halaman detail area masih memakai kalimat yang di-generate dari data. Kalau mau
  peringkat SEO lebih bagus, tulis paragraf pengantar manual per area.
