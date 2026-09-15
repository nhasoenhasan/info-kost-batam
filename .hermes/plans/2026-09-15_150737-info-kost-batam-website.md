# INFO KOST BATAM — Website Direktori Kost Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Mengubah spreadsheet "🏠 INFO KOST BATAM" (155 listing, sumber Facebook) menjadi website direktori kost publik: bisa dicari, difilter, tiap kost punya halaman sendiri yang SEO-friendly, dan pengunjung bisa langsung chat pemilik lewat WhatsApp.

**Architecture:** Next.js 16 App Router + Tailwind v4 dengan **static export** (`output: 'export'`) — seluruh HTML di-pre-render saat build. Data spreadsheet disinkronkan lewat script Node (`scripts/sync-kost.mjs`) yang menarik CSV export publik, menormalisasi (nomor WA, lokasi, budget, jenis, kriteria), membuang duplikat, lalu menulis `src/data/kost.json` yang di-commit ke repo. Filter/pencarian jalan di client (155 record = tidak perlu index/server). Tidak ada backend, tidak ada database, tidak ada API route.

**Tech Stack:** Next.js 16 (App Router, RSC) · React 19 · TypeScript · Tailwind CSS v4 · Vitest + Testing Library · Playwright (smoke) · pnpm · GitHub Actions · Vercel (default) / VPS rsync (alternatif)

---

## 1. Current Context

### 1.1 Sumber data (terverifikasi 2026-09-15)

- **Spreadsheet ID:** `1P9lqbRjuUd03DVcImQQwzSKCIaR7f5FvzywW0ou1G_Q`
- **Jumlah tab:** 1 (hanya `gid=0`) → tidak perlu loop multi-sheet
- **Mode baca:** publik. `.../htmlview` **tidak bisa** di-extract tooling (render kosong), tapi export CSV **berhasil tanpa auth**:
  ```
  https://docs.google.com/spreadsheets/d/1P9lqbRjuUd03DVcImQQwzSKCIaR7f5FvzywW0ou1G_Q/export?format=csv&gid=0
  ```
  → HTTP 200, 21.552 bytes, 206 baris. **Ini jalur sinkronisasi yang dipakai.** Tidak perlu API key, tidak perlu OAuth.
- **Header tabel ada di baris 26** (baris 1–25 = judul, panduan, dan 5 blok disclaimer). Jangan hardcode nomor baris — deteksi baris yang mengandung `No` + `Alamat`.
- **Layout kolom (CSV, 0-indexed):** `0`=kosong, `1`=No, `2`=Alamat, `3`=📍 Lokasi, `4`=🏠 Jenis, `5`=📞 Nomor WA/HP, `6`=💬 Hubungi Langsung, `7`=💰 Budget, `8`=👥 Kriteria, `9`=Referensi, `10`=Keterangan.
- **Kolom `6` (Hubungi Langsung) HARUS DIBUANG.** Isinya hasil formula hyperlink; CSV export cuma mengembalikan teks tampilan (`Hubungi via WA`), dan berisi `#VALUE!` di baris Edofa Gardenia #93. Link WA kita bangun sendiri dari kolom nomor.

### 1.2 Profil data (hasil audit)

| Aspek | Fakta |
|---|---|
| Baris data valid | 155 |
| Jenis | Kost 149 · Kontrakan 6 |
| Kriteria | Campur 106 · Putri 29 · Pria 13 · kosong 6 · `Masih ditanya` 1 |
| Lokasi (raw) | Batam Center 47 · Bengkong 33 · Batu Aji 28 · Nagoya 13 · Tiban 8 · Sekupang / Batu Ampar / Lubuk Baja 5 · Botania 4 · Nongsa / Piayu 2 · Belian / Sagulung / Batu Besar 1 |
| Budget | Rp450.000 – Rp2.500.000, median Rp1.100.000 · 3 baris kosong/`tidak ada estimasi harga` |
| Nomor WA | 134 unik dari 155 baris → 21 listing berbagi nomor (pemilik punya >1 kamar) |

**Cacat data yang WAJIB ditangani pipeline** (bukan opsional — kalau dibiarkan, website menampilkan sampah):

1. `#VALUE!` di kolom Hubungi Langsung (baris 93).
2. Baris 93 nomor WA kosong → duplikat dari baris 4 (Edofa Gardenia, harga 850rb vs 800rb).
3. Lokasi tidak cocok alamat: baris 124 (Gaia Buana, alamat **Sagulung**) dilabeli `Lubuk Baja`; baris 145 alamat sama dilabeli `Batu Aji` (harga 750rb vs 1,35jt). Baris 82 vs 108 "Taman Batara Raya" → `Belian` vs `Batam Center`.
4. Duplikat jelas: Simpang Bengkong Harapan 1 (#6 & #29), Bengkong Polisi (#12 & #41), Kampung Tua Belian (#15 & #107), Buana Raya Cluster Fortura (#53 & #69), Edofa Gardenia (#4 & #93), Cluster Saffron Botania (#110 & #113).
5. Nomor WA punya spasi/trailing space, campur format `08xx` dan `62xx`, ada yang tidak konsisten panjang.
6. Nama lokasi campur kapitalisasi (`campur` vs `Campur`).
7. Kolom Referensi/Keterangan tidak konsisten (`Facebook` / `Link` / `LINK` / `link` / `maps` / `Survey Sendiri` / kosong).

### 1.3 Lingkungan

- Working dir: `/Users/nurhasan/Workspaces/INFO KOST BATAM` — **kosong, belum git repo**.
- Node v23.11.0 · npm 11.4.2 · pnpm terpasang · `vercel` & `gh` CLI terpasang.
- Preseden user: proyek `web-personal` (Next.js 16 App Router + Tailwind v4 + static export, deploy GH Actions → VPS). Plan ini sengaja memakai pola stack yang sama supaya tidak ada kurva belajar baru dan hasilnya bisa jadi portfolio Frontend Engineer.

### 1.4 Kontrak data (`src/data/kost.json`)

```ts
// src/lib/types.ts
export type Jenis = 'Kost' | 'Kontrakan';
export type Kriteria = 'Putra' | 'Putri' | 'Campur' | 'Belum jelas';

export interface KostRecord {
  id: string;            // "kost-001" — urut stabil dari sheet
  slug: string;          // "batam-center-taman-marcelia-4630"
  no: number;            // nomor asli di spreadsheet (buat rujukan admin)
  alamat: string;        // alamat lengkap, sudah dirapikan spasi
  area: string;          // canonical: "Batam Center" | "Bengkong" | ...
  jenis: Jenis;
  wa: string | null;     // "6281234567890" (sudah 62, tanpa +)
  kriteria: Kriteria;
  harga: number | null;  // rupiah, integer
  referensi: string[];   // ["facebook", "mami kos"]
  catatan: string;       // kolom Keterangan, apa adanya
  needsReview: boolean;  // nomor WA aneh / area di-override / harga kosong
  reviewNotes: string[]; // alasan flag, ditampilkan di report admin
}

export interface KostReport {
  generatedAt: string;
  sourceUrl: string;
  totalRows: number;
  kept: number;
  dropped: { no: number; alamat: string; reason: string }[];
  duplicatesMerged: { keptNo: number; mergedNo: number; reason: string }[];
  areaOverrides: { no: number; from: string; to: string; reason: string }[];
  needsReview: { no: number; slug: string; notes: string[] }[];
}
```

### 1.5 Struktur folder target

```
INFO KOST BATAM/
├─ .github/workflows/ci.yml          # lint + test + build (PR & main)
├─ .github/workflows/deploy.yml      # rsync ke VPS, hanya push main
├─ scripts/
│  ├─ lib/csv.mjs                    # CSV parser (tahan newline dalam field)
│  ├─ lib/phone.mjs
│  ├─ lib/area.mjs                   # mapping + override lokasi
│  ├─ lib/budget.mjs
│  ├─ lib/slug.mjs
│  ├─ lib/dedupe.mjs
│  └─ sync-kost.mjs                  # entry: fetch → clean → tulis JSON
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx  page.tsx  globals.css
│  │  ├─ kost/[slug]/page.tsx
│  │  ├─ area/[area]/page.tsx
│  │  ├─ tentang/page.tsx
│  │  ├─ sitemap.ts  robots.ts  not-found.tsx
│  ├─ components/
│  │  ├─ KostCard.tsx  FilterBar.tsx  SearchInput.tsx
│  │  ├─ WaButton.tsx  EmptyState.tsx  SiteHeader.tsx  SiteFooter.tsx
│  ├─ data/kost.json                 # hasil sync, di-commit
│  ├─ data/kost-report.json          # laporan kualitas data, di-commit
│  └─ lib/
│     ├─ types.ts  kost.ts  filter.ts  phone.ts  slug.ts  seo.ts
├─ tests/unit/*.test.ts              # Vitest
├─ tests/e2e/smoke.spec.ts           # Playwright
├─ next.config.ts  vitest.config.ts  playwright.config.ts  README.md
```

### 1.6 Keputusan arsitektur & alasannya

| Keputusan | Alasan |
|---|---|
| Static export, tanpa backend | Data cuma berubah kalau admin edit sheet. 155 halaman kost + 14 halaman area = ~170 file HTML, dibangun dalam detik, gratis di hosting apa pun, dan paling cepat untuk pengunjung HP di Batam. |
| JSON di repo, bukan fetch live saat runtime | Build deterministik (tidak gagal karena Google rate-limit), dan bisa di-review lewat git diff sebelum tayang. Update = jalankan `pnpm sync` lalu commit. |
| Filter di client, state di URL search params | 155 item → filter instan tanpa request. URL bisa di-share (`/?area=bengkong&max=1000000`) sehingga bisa dipasang di bio Facebook/status WA. |
| Halaman `/kost/[slug]` per listing | Satu-satunya cara menang SEO long-tail ("kost bengkong 800 ribu"). Grid saja tidak akan terindeks. |
| Kolom Hubungi Langsung dibuang, link WA dibangun sendiri | Kolom itu formula Google yang tidak portabel dan sudah terbukti rusak (`#VALUE!`). |
| Nomor WA dinormalisasi ke format `62…` + pesan pre-filled | `wa.me/62…` + pesan yang menyebut alamat kost → pemilik langsung paham konteks, mengurangi chat "kos mana ya?". |

### 1.7 Keputusan yang dikunci user (2026-09-15)

| # | Keputusan | Konsekuensi di plan |
|---|---|---|
| 1 | **Deploy ke VPS yang sama dengan `web-personal`** (`ubuntu@43.128.113.94`), lewat GitHub Actions + rsync | Task 20 pakai opsi B, replikasi pola `web-personal/.github/workflows/deploy.yml`: job `test` → `security` (Snyk) → `deploy`, Node 22, secrets `DEPLOY_KEY` + `SNYK_TOKEN`, target `/var/www/info-kost-batam/` |
| 2 | **Subdomain dulu** (bukan domain baru) → `kost.nhasan.tech` | `metadataBase = https://kost.nhasan.tech`, canonical + sitemap pakai origin itu; butuh 1 record DNS A → 43.128.113.94 dan 1 server block nginx |
| 3 | **Mekanisme takedown: ya** (pilihan diserahkan ke saya → dipilih: ada) | Sheet dapat kolom opsional `Status`; pipeline membuang baris ber-status `hapus`/`nonaktif`/`penuh` dan mencatatnya di `kost-report.json` |
| 4 | **Tema: light-first** dengan dark mode otomatis | `:root { color-scheme: light dark }` + override `prefers-color-scheme: dark` sesuai Task 11 |
| 5 | **Foto: nanti** | Fase ini tanpa gambar sama sekali — tanpa `next/image`, tanpa aset foto, tidak ada task upload |

---

## 2. Step-by-Step Plan

Naming commit mengikuti conventional commits. Tiap task 2–5 menit.

### FASE 0 — Fondasi

#### Task 1: Scaffold proyek Next.js

**Objective:** Proyek Next.js 16 + TS + Tailwind v4 hidup dan bisa build.

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `src/app/*`

**Step 1:** Jalankan scaffold:

```bash
cd "/Users/nurhasan/Workspaces/INFO KOST BATAM"
pnpm dlx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --no-git --yes
```

**Step 2:** Verifikasi build jalan:
```bash
pnpm build
```
Expected: `✓ Compiled successfully`, ada baris route `/`.
*Jika `next` versi 15 ke bawah yang ke-install, hentikan dan laporkan — plan ini asumsi App Router v16 (Tailwind v4 default).*

**Step 3:** Commit:
```bash
git init && git add -A && git commit -m "chore: scaffold next.js app router + tailwind"
```

---

#### Task 2: Aktifkan static export

**Objective:** `pnpm build` menghasilkan folder `out/` berisi HTML statis.

**Files:**
- Modify: `next.config.ts`

**Step 1:** Isi `next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true }, // static export tidak punya optimizer
  trailingSlash: true,           // /kost/foo/ → aman untuk rsync + nginx
};

export default nextConfig;
```

**Step 2:** Verifikasi:
```bash
pnpm build && test -f out/index.html && echo "STATIC EXPORT OK"
```
Expected: `STATIC EXPORT OK`.

**Step 3:** Commit: `chore: enable static export`.

---

#### Task 3: Pasang Vitest + Testing Library

**Objective:** `pnpm test` bisa menjalankan unit test TS dan komponen React.

**Files:**
- Create: `vitest.config.ts`, `tests/unit/setup.ts`
- Modify: `package.json`

**Step 1:** Install:
```bash
pnpm add -D vitest @vitejs/plugin-react jsdom vite-tsconfig-paths @testing-library/react @testing-library/dom @testing-library/jest-dom
```

**Step 2:** Tulis `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.ts?(x)'],
  },
});
```

**Step 3:** `tests/unit/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

**Step 4:** Tambah scripts di `package.json`:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "sync": "node scripts/sync-kost.mjs",
  "e2e": "playwright test"
}
```

**Step 5:** Verifikasi:
```bash
pnpm typecheck && echo "TS OK"
```
Expected: `TS OK` tanpa error.

**Step 6:** Commit: `chore: add vitest + testing-library`.

---

### FASE 1 — Pipeline data (TDD, murni Node, tanpa dependensi CSV eksternal)

#### Task 4: CSV parser yang tahan field multi-baris

**Objective:** Parser yang benar untuk CSV Google Sheets (field alamat mengandung `\n` di dalam tanda kutip ganda).

**Files:**
- Create: `scripts/lib/csv.mjs`, `tests/unit/csv.test.ts`

**Step 1: Write failing test**

```ts
// tests/unit/csv.test.ts
import { describe, it, expect } from 'vitest';
import { parseCsv } from '../../scripts/lib/csv.mjs';

describe('parseCsv', () => {
  it('memisahkan baris dan kolom sederhana', () => {
    expect(parseCsv('a,b\nc,d')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('menjaga newline di dalam field ber-kutip', () => {
    const rows = parseCsv('1,"Seraya,\nBelakang Loveseafood",Nagoya');
    expect(rows).toEqual([['1', 'Seraya,\nBelakang Loveseafood', 'Nagoya']]);
  });

  it('mengubah "" menjadi kutip tunggal', () => {
    expect(parseCsv('a,"kata ""penting""",b')).toEqual([['a', 'kata "penting"', 'b']]);
  });

  it('menangani CRLF dan baris kosong di akhir', () => {
    expect(parseCsv('a,b\r\nc,d\r\n')).toEqual([['a', 'b'], ['c', 'd']]);
  });
});
```

**Step 2: Run test to verify failure**
```bash
pnpm vitest run tests/unit/csv.test.ts
```
Expected: FAIL — `Failed to resolve import "../../scripts/lib/csv.mjs"`.

**Step 3: Write minimal implementation**

```js
// scripts/lib/csv.mjs
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch === '\r') { /* skip */ }
    else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }

  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}
```

**Step 4: Run test to verify pass**
```bash
pnpm vitest run tests/unit/csv.test.ts
```
Expected: `4 passed`.

**Step 5:** Commit: `feat(scripts): csv parser with multiline field support`.

---

#### Task 5: Normalisasi nomor WhatsApp

**Objective:** `085376805194` dan `628117006381` → `6285376805194` / `628117006381`, plus flag nomor mencurigakan.

**Files:**
- Create: `scripts/lib/phone.mjs`, `tests/unit/phone.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { normalizePhone, buildWaLink } from '../../scripts/lib/phone.mjs';

describe('normalizePhone', () => {
  it('konversi 08xx ke 62xx', () => {
    expect(normalizePhone('085376805194').wa).toBe('6285376805194');
  });
  it('membuang spasi dan tanda hubung', () => {
    expect(normalizePhone(' 081276355228 ').wa).toBe('6281276355228');
  });
  it('membiarkan nomor yang sudah 62', () => {
    expect(normalizePhone('628117006381').wa).toBe('628117006381');
  });
  it('mengembalikan null + flag untuk nomor kosong', () => {
    const r = normalizePhone('');
    expect(r.wa).toBeNull();
    expect(r.needsReview).toBe(true);
  });
  it('mengembalikan null untuk nomor terlalu pendek', () => {
    expect(normalizePhone('12345').wa).toBeNull();
  });
  it('buildWaLink menyertakan pesan teks ter-encode', () => {
    expect(buildWaLink('628123', 'Halo, saya lihat Kost Bengkong di INFO KOST BATAM'))
      .toBe('https://wa.me/628123?text=Halo%2C%20saya%20lihat%20Kost%20Bengkong%20di%20INFO%20KOST%20BATAM');
  });
});

describe('buildWaLink', () => {
  it('mengembalikan null kalau nomor tidak ada', () => {
    expect(buildWaLink(null, 'apa saja')).toBeNull();
  });
});
```

**Step 2:** `pnpm vitest run tests/unit/phone.test.ts` → FAIL.

**Step 3: Implementation**

```js
// scripts/lib/phone.mjs

/** @param {string} raw */
export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return { wa: null, needsReview: true };

  let n = digits;
  if (n.startsWith('62')) n = n;
  else if (n.startsWith('0')) n = '62' + n.slice(1);
  else if (n.startsWith('8')) n = '62' + n;
  else return { wa: null, needsReview: true };

  // panjang wajar: 62 + 8..13 digit
  const ok = /^62\d{8,13}$/.test(n);
  return { wa: ok ? n : null, needsReview: !ok };
}

/**
 * @param {string | null} wa
 * @param {string} message
 * @returns {string | null}
 */
export function buildWaLink(wa, message) {
  if (!wa) return null;
  return `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
}
```

**Step 4:** Test → semua PASS (`7 passed`).

**Step 5:** Commit: `feat(scripts): whatsapp number normalization`.

---

#### Task 6: Normalisasi area (lokasi) + override anomali

**Objective:** Semua nilai lokasi jadi salah satu dari 14 area kanonik, plus perbaikan baris yang salah label.

**Files:**
- Create: `scripts/lib/area.mjs`, `tests/unit/area.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { AREAS, canonicalArea } from '../../scripts/lib/area.mjs';

describe('canonicalArea', () => {
  it('merapikan kapitalisasi', () => {
    expect(canonicalArea('batam center')).toBe('Batam Center');
  });
  it('mengembalikan null untuk area tak dikenal', () => {
    expect(canonicalArea('Jakarta')).toBeNull();
  });
  it('mengenali 14 area kanonik tanpa duplikat', () => {
    expect(new Set(AREAS).size).toBe(AREAS.length);
    expect(AREAS.length).toBeGreaterThanOrEqual(14);
  });
  it('memperbaiki label yang bentrok dengan alamat (Gaia Buana → Sagulung)', () => {
    expect(
      canonicalArea('Lubuk Baja', 'Kost Gaia Buana Central Park Tipe 1 Sagulung Batam'),
    ).toBe('Sagulung');
  });
});
```

**Step 2:** `pnpm vitest run tests/unit/area.test.ts` → FAIL.

**Step 3: Implementation**

```js
// scripts/lib/area.mjs
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
];

const ALIASES = {
  'batam centre': 'Batam Center',
  'batam center': 'Batam Center',
  batamcentre: 'Batam Center',
  btc: 'Batam Center',
  'batu aji': 'Batu Aji',
  batamaji: 'Batu Aji',
  'lubuk baja': 'Lubuk Baja',
  baloi: 'Lubuk Baja',
  sagulung: 'Sagulung',
  bengkong: 'Bengkong',
  nagoya: 'Nagoya',
  tiban: 'Tiban',
  sekupang: 'Sekupang',
  'batu ampar': 'Batu Ampar',
  botania: 'Botania',
  nongsa: 'Nongsa',
  piayu: 'Piayu',
  'sei beduk': 'Piayu',
  belian: 'Belian',
  'batu besar': 'Batu Besar',
};

/**
 * Override manual: alamat terbukti tidak cocok dengan label kolom Lokasi.
 * Kunci = nomor baris asli spreadsheet.
 */
const ADDRESS_OVERRIDES = [
  {
    match: /gaia buana central park/i,
    to: 'Sagulung',
    reason: 'Alamat menyebut Sagulung (Taman Cipta Asri), label sheet Lubuk Baja/Batu Aji',
  },
  {
    match: /taman batara raya|batara raya/i,
    to: 'Batam Center',
    reason: 'Label sheet Belian, referensi admin Batam Center',
  },
];

/**
 * @param {string} raw label kolom Lokasi
 * @param {string} [alamat]
 * @returns {string | null}
 */
export function canonicalArea(raw, alamat = '') {
  for (const o of ADDRESS_OVERRIDES) if (o.match.test(alamat)) return o.to;
  const key = String(raw ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  return ALIASES[key] ?? null;
}

export { ADDRESS_OVERRIDES };
```

**Step 4:** Test → PASS.

**Step 5:** Commit: `feat(scripts): canonical area mapping with overrides`.

---

#### Task 7: Normalisasi budget & kriteria

**Objective:** `Rp1.000.000` → `1000000`; `tidak ada estimasi harga` → `null`; kriteria jadi `Putra|Putri|Campur|Belum jelas`.

**Files:**
- Create: `scripts/lib/budget.mjs`, `tests/unit/budget.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { parseBudget, parseKriteria, parseJenis } from '../../scripts/lib/budget.mjs';

describe('parseBudget', () => {
  it('membaca format Rupiah bertitik', () => {
    expect(parseBudget('Rp1.850.000')).toBe(1850000);
  });
  it('mengembalikan null untuk teks non-angka', () => {
    expect(parseBudget('tidak ada estimasi harga')).toBeNull();
  });
  it('mengembalikan null untuk kosong', () => {
    expect(parseBudget('')).toBeNull();
  });
  it('menolak nilai tidak masuk akal (< 100rb)', () => {
    expect(parseBudget('Rp50.000')).toBeNull();
  });
});

describe('parseKriteria', () => {
  it('menormalkan kapitalisasi', () => expect(parseKriteria('campur')).toBe('Campur'));
  it('kata "Pria" jadi "Putra" supaya konsisten dengan label sheet', () => {
    expect(parseKriteria('Pria')).toBe('Putra');
  });
  it('kosong jadi Belum jelas', () => expect(parseKriteria('')).toBe('Belum jelas'));
  it('"Masih ditanya" jadi Belum jelas', () => expect(parseKriteria('Masih ditanya')).toBe('Belum jelas'));
});

describe('parseJenis', () => {
  it('default Kost', () => expect(parseJenis('')).toBe('Kost'));
  it('mengenali Kontrakan', () => expect(parseJenis('Kontrakan')).toBe('Kontrakan'));
});
```

**Step 2:** `pnpm vitest run tests/unit/budget.test.ts` → FAIL.

**Step 3: Implementation**

```js
// scripts/lib/budget.mjs

/** @param {string} raw */
export function parseBudget(raw) {
  const digits = String(raw ?? '').replace(/[^\d]/g, '');
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isFinite(value) || value < 100_000) return null;
  return value;
}

/**
 * Sheet memakai "Pria"/"Putri"/"Campur" tak konsisten.
 * Di UI kita pakai "Putra" (lebih umum di iklan kost) — mapping dilakukan di sini sekali.
 * @param {string} raw
 * @returns {'Putra' | 'Putri' | 'Campur' | 'Belum jelas'}
 */
export function parseKriteria(raw) {
  const v = String(raw ?? '').trim().toLowerCase();
  if (v === 'pria' || v === 'putra') return 'Putra';
  if (v === 'putri') return 'Putri';
  if (v === 'campur') return 'Campur';
  return 'Belum jelas';
}

/** @param {string} raw */
export function parseJenis(raw) {
  const v = String(raw ?? '').trim().toLowerCase();
  return v.includes('kontrakan') ? 'Kontrakan' : 'Kost';
}
```

**Step 4:** Test → PASS.

**Step 5:** Commit: `feat(scripts): budget/kriteria/jenis normalization`.

---

#### Task 8: Slug stabil

**Objective:** Slug unik per listing, tidak berubah saat admin mengedit harga.

**Files:**
- Create: `scripts/lib/slug.mjs`, `tests/unit/slug.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { slugify, buildSlug } from '../../scripts/lib/slug.mjs';

describe('slugify', () => {
  it('menurunkan huruf dan mengganti spasi', () =>
    expect(slugify('BENGKONG INDAH ATAS (ALJABAR)')).toBe('bengkong-indah-atas-aljabar'));
  it('membuang newline dan koma', () =>
    expect(slugify('Seraya,\nBelakang Loveseafood 3')).toBe('seraya-belakang-loveseafood-3'));
  it('maksimal 60 karakter', () =>
    expect(slugify('a '.repeat(80)).length).toBeLessThanOrEqual(60));
});

describe('buildSlug', () => {
  it('menggabungkan area + alamat + 4 digit nomor', () =>
    expect(buildSlug({ area: 'Batam Center', alamat: 'Taman Marcelia', wa: '6281234567890' }))
      .toBe('batam-center-taman-marcelia-7890'));
  it('memakai suffix no kalau nomor WA tidak ada', () =>
    expect(buildSlug({ area: 'Bengkong', alamat: 'Ruko Aljabar', wa: null, no: 91 }))
      .toBe('bengkong-ruko-aljabar-91'));
  it('selalu lowercase dan tanpa tanda baca', () => {
    const s = buildSlug({ area: 'Batu Aji', alamat: 'Jln. Mitra Raya #2 (Blok D1)', wa: '6281111', no: 1 });
    expect(s).toMatch(/^[a-z0-9-]+$/);
  });
});
```

**Step 2:** `pnpm vitest run tests/unit/slug.test.ts` → FAIL.

**Step 3: Implementation**

```js
// scripts/lib/slug.mjs

/** @param {string} text */
export function slugify(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

/**
 * @param {{ area: string, alamat: string, wa: string | null, no?: number }} input
 */
export function buildSlug({ area, alamat, wa, no }) {
  const tail = wa ? wa.slice(-4) : String(no ?? '');
  return slugify(`${area} ${alamat} ${tail}`);
}
```

**Step 4:** Test → PASS.

**Step 5:** Commit: `feat(scripts): stable slug generation`.

**Pitfall yang harus ditangani di Task 9:** dua listing bisa menghasilkan slug sama (mis. dua kost di alamat sama dengan nomor berbeda tetap unik karena 4 digit terakhir; tapi kalau sama-sama nomor identik). Task 9 menambahkan suffix `-2`, `-3` deterministik.

---

#### Task 9: Dedupe + orkestrasi sync

**Objective:** `pnpm sync` menarik CSV, membuang duplikat, menulis `src/data/kost.json` + `src/data/kost-report.json`, dan gagal dengan pesan jelas kalau jumlah record anjlok drastis (guard agar sheet yang tiba-tiba kosong tidak menimpa data bagus).

**Files:**
- Create: `scripts/lib/dedupe.mjs`, `scripts/sync-kost.mjs`, `tests/unit/dedupe.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { dedupeKey, mergeDuplicates } from '../../scripts/lib/dedupe.mjs';

const base = {
  no: 4, alamat: 'Perum Edofa Gardenia Blok F9 No 12 B', area: 'Sekupang',
  wa: '6281372454204', harga: 800000, kriteria: 'Campur', jenis: 'Kost', slug: 'x',
} as any;

describe('dedupeKey', () => {
  it('kunci = area + alamat ternormalisasi', () => {
    expect(dedupeKey({ ...base })).toBe('sekupang|perum edofa gardenia blok f9 no 12 b');
  });
});

describe('mergeDuplicates', () => {
  it('menggabungkan alamat sama dan menyimpan nomor kedua sebagai alternate', () => {
    const out = mergeDuplicates([base, { ...base, no: 93, wa: null, harga: 850000 }]);
    expect(out.unique).toHaveLength(1);
    expect(out.unique[0].no).toBe(4);
    expect(out.unique[0].harga).toBe(800000);
    expect(out.duplicatesMerged[0]).toMatchObject({ keptNo: 4, mergedNo: 93 });
  });
  it('menaikkan harga jadi rata-rata dibulatkan ke 50rb terdekat kalau keduanya ada', () => {
    const out = mergeDuplicates([base, { ...base, no: 5, harga: 900000 }]);
    expect(out.unique[0].harga).toBe(850000);
  });
  it('tidak menggabungkan alamat berbeda', () => {
    const out = mergeDuplicates([base, { ...base, no: 6, alamat: 'Alamat lain' }]);
    expect(out.unique).toHaveLength(2);
  });
});
```

**Step 2:** `pnpm vitest run tests/unit/dedupe.test.ts` → FAIL.

**Step 3: Implementation**

```js
// scripts/lib/dedupe.mjs

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** @param {{ area: string, alamat: string }} r */
export function dedupeKey(r) {
  return `${norm(r.area)}|${norm(r.alamat)}`;
}

/**
 * @template {{ no: number, alamat: string, area: string, harga: number|null }} T
 * @param {T[]} records
 */
export function mergeDuplicates(records) {
  /** @type {Map<string, any>} */
  const map = new Map();
  const duplicatesMerged = [];

  for (const r of records) {
    const key = dedupeKey(r);
    const found = map.get(key);
    if (!found) {
      map.set(key, { ...r, altWa: [] });
      continue;
    }
    const hargaList = [found.harga, r.harga].filter((h) => typeof h === 'number');
    if (hargaList.length) {
      const avg = hargaList.reduce((a, b) => a + b, 0) / hargaList.length;
      found.harga = Math.round(avg / 50000) * 50000;
    }
    if (r.wa && r.wa !== found.wa) found.altWa.push(r.wa);
    if (!found.wa && r.wa) found.wa = r.wa;
    found.reviewNotes = [...(found.reviewNotes ?? []), `duplikat baris #${r.no}`];
    duplicatesMerged.push({
      keptNo: found.no,
      mergedNo: r.no,
      reason: 'area + alamat identik',
    });
  }

  return { unique: [...map.values()], duplicatesMerged };
}
```

**Step 4: Sync script**

```js
// scripts/sync-kost.mjs
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { parseCsv } from './lib/csv.mjs';
import { normalizePhone } from './lib/phone.mjs';
import { canonicalArea } from './lib/area.mjs';
import { parseBudget, parseKriteria, parseJenis } from './lib/budget.mjs';
import { buildSlug } from './lib/slug.mjs';
import { mergeDuplicates } from './lib/dedupe.mjs';

const SHEET_ID = '1P9lqbRjuUd03DVcImQQwzSKCIaR7f5FvzywW0ou1G_Q';
const SOURCE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const OUT_JSON = new URL('../src/data/kost.json', import.meta.url);
const OUT_REPORT = new URL('../src/data/kost-report.json', import.meta.url);
const MIN_EXPECTED = 120; // guard: anjlok di bawah ini = gagalkan sync

const C = { no: 1, alamat: 2, lokasi: 3, jenis: 4, wa: 5, budget: 7, kriteria: 8, referensi: 9, catatan: 10 };

const res = await fetch(SOURCE_URL, { redirect: 'follow' });
if (!res.ok) throw new Error(`Gagal ambil sheet: HTTP ${res.status}`);
const rows = parseCsv(await res.text());

const headerIdx = rows.findIndex((r) => r.includes('Alamat') && r.includes('No'));
if (headerIdx === -1) throw new Error('Baris header (No + Alamat) tidak ditemukan — struktur sheet berubah?');
const dataRows = rows.slice(headerIdx + 1);

const dropped = [];
const areaOverrides = [];
const raw = [];

for (const r of dataRows) {
  const no = Number(String(r[C.no] ?? '').trim());
  const alamat = String(r[C.alamat] ?? '').replace(/\s*\n\s*/g, ', ').replace(/\s{2,}/g, ' ').trim();
  if (!alamat || !Number.isFinite(no)) {
    dropped.push({ no: Number.isFinite(no) ? no : -1, alamat, reason: 'alamat/no kosong' });
    continue;
  }

  const labelLokasi = String(r[C.lokasi] ?? '').trim();
  const area = canonicalArea(labelLokasi, alamat);
  if (!area) {
    dropped.push({ no, alamat, reason: `lokasi tidak dikenal: "${labelLokasi}"` });
    continue;
  }
  if (area !== labelLokasi) {
    areaOverrides.push({ no, from: labelLokasi || '(kosong)', to: area, reason: 'normalisasi/override alamat' });
  }

  const { wa, needsReview: waReview } = normalizePhone(r[C.wa]);
  const harga = parseBudget(r[C.budget]);
  const reviewNotes = [];
  if (waReview) reviewNotes.push('nomor WA kosong/format aneh');
  if (harga === null) reviewNotes.push('harga kosong atau tidak valid');
  if (String(r[C.kriteria] ?? '').trim() === '') reviewNotes.push('kriteria belum jelas');

  raw.push({
    no,
    alamat,
    area,
    jenis: parseJenis(r[C.jenis]),
    wa,
    kriteria: parseKriteria(r[C.kriteria]),
    harga,
    referensi: String(r[C.referensi] ?? '').trim().toLowerCase().split(/[,\s]+/).filter(Boolean),
    catatan: String(r[C.catatan] ?? '').trim(),
    needsReview: reviewNotes.length > 0,
    reviewNotes,
  });
}

const { unique, duplicatesMerged } = mergeDuplicates(raw);

// slug unik deterministik
const used = new Set();
const records = unique.map((r, i) => {
  let slug = buildSlug(r);
  let n = 2;
  while (used.has(slug)) slug = `${buildSlug(r)}-${n++}`;
  used.add(slug);
  return { id: `kost-${String(r.no).padStart(3, '0')}`, slug, ...r, altWa: r.altWa ?? [] };
});

if (records.length < MIN_EXPECTED) {
  throw new Error(
    `Hasil sync hanya ${records.length} record (< ${MIN_EXPECTED}). Dibatalkan supaya data bagus tidak tertimpa. Cek sheet sumber.`,
  );
}

// sanity: slug unik
if (new Set(records.map((r) => r.slug)).size !== records.length) throw new Error('Slug duplikat terdeteksi');

const report = {
  generatedAt: new Date().toISOString(),
  sourceUrl: SOURCE_URL,
  totalRows: dataRows.length,
  kept: records.length,
  dropped,
  duplicatesMerged,
  areaOverrides,
  needsReview: records.filter((r) => r.needsReview).map((r) => ({ no: r.no, slug: r.slug, notes: r.reviewNotes })),
  byArea: records.reduce((acc, r) => ({ ...acc, [r.area]: (acc[r.area] ?? 0) + 1 }), {}),
};

await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
await writeFile(OUT_JSON, JSON.stringify(records, null, 2) + '\n');
await writeFile(OUT_REPORT, JSON.stringify(report, null, 2) + '\n');

console.log(
  `✓ sync selesai: ${records.length} kost (dari ${dataRows.length} baris) · ` +
  `${duplicatesMerged.length} duplikat digabung · ${dropped.length} dibuang · ${report.needsReview.length} perlu review`,
);
```

**Step 5:** Jalankan:
```bash
pnpm sync
```
Expected: `✓ sync selesai: ~14x kost (dari 155 baris) · 6 duplikat digabung · 0-2 dibuang · ~10 perlu review`
(drop harus 0 — kalau ada, artinya ada area baru di sheet → tambahkan ke `AREAS`/`ALIASES`.)

**Step 6:** Inspeksi hasil:
```bash
node -e "const d=require('./src/data/kost.json');console.log(d.length, d[0], d.find(x=>x.needsReview))"
```
Expected: record lengkap, `needsReview` berisi catatan jelas.

**Step 7:** Commit: `feat(scripts): sync pipeline from google sheets with dedupe + report`.

---

### FASE 2 — Library + UI

#### Task 10: Loader & filter murni

**Objective:** Fungsi filter yang bisa di-unit-test tanpa React.

**Files:**
- Create: `src/lib/types.ts`, `src/lib/kost.ts`, `src/lib/filter.ts`, `tests/unit/filter.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { filterKosts, sortKosts } from '@/lib/filter';
import { DEFAULT_FILTERS } from '@/lib/types';

const data = [
  { no: 1, alamat: 'Ruko Aljabar', area: 'Bengkong', jenis: 'Kost', kriteria: 'Putri', harga: 450000, wa: '6281', slug: 'a' },
  { no: 2, alamat: 'Bengkong Polisi', area: 'Bengkong', jenis: 'Kost', kriteria: 'Campur', harga: 1800000, wa: '6282', slug: 'b' },
  { no: 3, alamat: 'Taman Mediterania', area: 'Batam Center', jenis: 'Kontrakan', kriteria: 'Campur', harga: 2200000, wa: null, slug: 'c' },
] as any;

describe('filterKosts', () => {
  it('tanpa filter mengembalikan semua', () =>
    expect(filterKosts(data, DEFAULT_FILTERS)).toHaveLength(3));
  it('filter area', () =>
    expect(filterKosts(data, { ...DEFAULT_FILTERS, area: ['Bengkong'] })).toHaveLength(2));
  it('filter kriteria multi-pilih', () =>
    expect(filterKosts(data, { ...DEFAULT_FILTERS, kriteria: ['Putri', 'Campur'] })).toHaveLength(3));
  it('filter budget maksimum', () =>
    expect(filterKosts(data, { ...DEFAULT_FILTERS, maxHarga: 1000000 }).map((r: any) => r.no)).toEqual([1]));
  it('filter budget minimum', () =>
    expect(filterKosts(data, { ...DEFAULT_FILTERS, minHarga: 2000000 }).map((r: any) => r.no)).toEqual([3]));
  it('search cocok di alamat tanpa peduli huruf besar/kecil', () =>
    expect(filterKosts(data, { ...DEFAULT_FILTERS, q: 'ALJABAR' })).toHaveLength(1));
  it('record tanpa harga tidak ikut terbuang oleh range budget', () =>
    expect(filterKosts([{ ...data[0], harga: null }], { ...DEFAULT_FILTERS, maxHarga: 500000 })).toHaveLength(1));
});

describe('sortKosts', () => {
  it('termurah dulu', () =>
    expect(sortKosts(data, 'termurah').map((r: any) => r.no)).toEqual([1, 2, 3]));
  it('termahal dulu, record tanpa harga di akhir', () => {
    const withNull = [...data, { ...data[0], no: 9, harga: null }];
    expect(sortKosts(withNull, 'termahal').at(-1).no).toBe(9);
  });
  it('default (relevan) mempertahankan urutan asli', () =>
    expect(sortKosts(data, 'relevan').map((r: any) => r.no)).toEqual([1, 2, 3]));
});
```

**Step 2:** `pnpm vitest run tests/unit/filter.test.ts` → FAIL.

**Step 3: Implementation**

```ts
// src/lib/types.ts  (lihat §1.4 untuk tipe KostRecord penuh)
export interface FilterState {
  q: string;
  area: string[];
  jenis: Jenis[];
  kriteria: Kriteria[];
  minHarga: number | null;
  maxHarga: number | null;
  sort: 'relevan' | 'termurah' | 'termahal';
}

export const DEFAULT_FILTERS: FilterState = {
  q: '', area: [], jenis: [], kriteria: [], minHarga: null, maxHarga: null, sort: 'relevan',
};

export const BUDGET_BUCKETS = [500_000, 750_000, 1_000_000, 1_500_000, 2_000_000] as const;
```

```ts
// src/lib/filter.ts
import type { FilterState, KostRecord } from './types';

const haystack = (r: KostRecord) =>
  `${r.alamat} ${r.area} ${r.jenis} ${r.kriteria} ${r.catatan}`.toLowerCase();

export function filterKosts(records: KostRecord[], f: FilterState): KostRecord[] {
  const q = f.q.trim().toLowerCase();
  return records.filter((r) => {
    if (q && !haystack(r).includes(q)) return false;
    if (f.area.length && !f.area.includes(r.area)) return false;
    if (f.jenis.length && !f.jenis.includes(r.jenis)) return false;
    if (f.kriteria.length && !f.kriteria.includes(r.kriteria)) return false;
    // record tanpa harga tetap ditampilkan — jangan sembunyikan info
    if (r.harga !== null) {
      if (f.minHarga !== null && r.harga < f.minHarga) return false;
      if (f.maxHarga !== null && r.harga > f.maxHarga) return false;
    }
    return true;
  });
}

export function sortKosts(records: KostRecord[], sort: FilterState['sort']): KostRecord[] {
  if (sort === 'relevan') return records;
  const dir = sort === 'termurah' ? 1 : -1;
  return [...records].sort((a, b) => {
    if (a.harga === null && b.harga === null) return 0;
    if (a.harga === null) return 1;   // tanpa harga selalu di akhir
    if (b.harga === null) return -1;
    return (a.harga - b.harga) * dir;
  });
}
```

```ts
// src/lib/kost.ts
import records from '@/data/kost.json';
import type { KostRecord } from './types';

export const allKosts = records as KostRecord[];
export const kostsWithWa = allKosts.filter((r) => r.wa);
export const AREA_COUNTS = allKosts.reduce<Record<string, number>>((acc, r) => {
  acc[r.area] = (acc[r.area] ?? 0) + 1;
  return acc;
}, {});
export const PRICE_RANGE = {
  min: Math.min(...allKosts.map((r) => r.harga ?? Infinity)),
  max: Math.max(...allKosts.map((r) => r.harga ?? 0)),
};
export const bySlug = (slug: string) => allKosts.find((r) => r.slug === slug);
export const byArea = (area: string) =>
  allKosts.filter((r) => r.area.toLowerCase() === area.toLowerCase());
```

**Step 4:** `pnpm vitest run` → semua PASS (`~20 passed`).

**Step 5:** Commit: `feat(lib): types, loader and pure filters`.

---

#### Task 11: Design token + layout global

**Objective:** Kerangka visual: tipografi, warna, header, footer dengan disclaimer sumber data.

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx`

**Arah desain (mengikuti selera user: editorial minimalist, hairline bukan kartu berbayang):**
- Light-first (`#fafaf9` background, `#1c1917` text) + dukungan `prefers-color-scheme: dark` — audiensnya orang cari kost dari HP, sering siang hari di luar.
- Satu keluarga font (Inter + JetBrains Mono untuk angka/WA), tanpa aksen warna selain satu warna brand (emerald `#059669`) khusus tombol WA/CTA.
- Pemisah antar item = hairline `border-t border-stone-200`, bukan shadow/kartu melayang.
- Mobile-first: target utama layar 375–430px.

**Step 1:** `globals.css`:
```css
@import 'tailwindcss';

@theme {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --color-brand: #059669;
  --color-brand-dark: #047857;
  --color-ink: #1c1917;
  --color-muted: #78716c;
  --color-hairline: #e7e5e4;
}

:root { color-scheme: light dark; }
body { @apply bg-stone-50 text-ink antialiased; }
@media (prefers-color-scheme: dark) {
  body { @apply bg-stone-950 text-stone-100; }
}
```

**Step 2:** `layout.tsx` memakai font Next (`next/font/google`, Inter + JetBrains_Mono), `metadataBase`, `title.template: '%s · INFO KOST BATAM'`, deskripsi default, dan `lang="id"`.

**Step 3:** `SiteHeader` = wordmark "INFO KOST BATAM" + count "155 kost" + link `Tentang`. `SiteFooter` = disclaimer ringkas (data dari postingan publik Facebook, harga bisa berubah, konfirmasi dulu sebelum DP) + tanggal sync terakhir (`kost-report.json → generatedAt`).

**Step 4:** Verifikasi: `pnpm dev` → buka `http://localhost:3000` → header & footer tampil, tidak ada warning hidrasi di console.
```bash
pnpm build && echo BUILD_OK
```
Expected: `BUILD_OK`.

**Step 5:** Commit: `feat(ui): design tokens, layout, header, footer`.

---

#### Task 12: Kartu kost + tombol WhatsApp

**Objective:** Komponen kartu listing dan tombol WA dengan pesan pre-filled (diuji).

**Files:**
- Create: `src/components/KostCard.tsx`, `src/components/WaButton.tsx`, `tests/unit/WaButton.test.tsx`

**Step 1: Write failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WaButton } from '@/components/WaButton';

const kost = { alamat: 'Ruko Aljabar A2', area: 'Bengkong', wa: '628170017875', no: 91 } as any;

describe('WaButton', () => {
  it('menyusun link wa.me dengan pesan berisi alamat + sumber', () => {
    render(<WaButton kost={kost} />);
    const a = screen.getByRole('link', { name: /whatsapp/i });
    expect(a).toHaveAttribute('href', expect.stringContaining('https://wa.me/628170017875?text='));
    expect(decodeURIComponent(a.getAttribute('href')!)).toContain('Ruko Aljabar A2');
    expect(decodeURIComponent(a.getAttribute('href')!)).toContain('INFO KOST BATAM');
  });

  it('mengganti kata "WhatsApp" jadi "Chat pemilik" di label (lebih jelas)', () => {
    render(<WaButton kost={kost} />);
    expect(screen.getByRole('link')).toHaveTextContent(/chat/i);
  });

  it('menampilkan pesan tidak tersedia kalau nomor kosong', () => {
    render(<WaButton kost={{ ...kost, wa: null }} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(/nomor belum tersedia/i)).toBeInTheDocument();
  });
});
```

**Step 2:** Test → FAIL.

**Step 3: Implementation**

```ts
// src/lib/phone.ts  (versi TS dari scripts/lib/phone.mjs)
export function waMessage(kost: { alamat: string; area: string; slug: string }) {
  return `Halo, saya dapat info dari INFO KOST BATAM.\n\nSaya mau tanya soal kost di: ${kost.alamat} (${kost.area}).\nMasih ada kamar kosong? Berapa harganya sekarang?\n\nTerima kasih 🙏`;
}
export function buildWaLink(wa: string | null, message: string) {
  return wa ? `https://wa.me/${wa}?text=${encodeURIComponent(message)}` : null;
}
```

```tsx
// src/components/WaButton.tsx
import { buildWaLink, waMessage } from '@/lib/phone';
import type { KostRecord } from '@/lib/types';

export function WaButton({ kost, full = false }: { kost: KostRecord; full?: boolean }) {
  const href = buildWaLink(kost.wa, waMessage(kost));
  if (!href) {
    return <p className="text-sm text-muted">Nomor belum tersedia — hubungi admin untuk info terbaru.</p>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat pemilik kost ${kost.alamat} via WhatsApp`}
      className={`inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 font-medium text-white
        transition-colors hover:bg-brand-dark ${full ? 'w-full justify-center' : ''}`}
    >
      Chat pemilik via WhatsApp
    </a>
  );
}
```

`KostCard.tsx`: 1 `<article>` hairline → area + kriteria chip + jenis, alamat (2 baris dengan `line-clamp-2`), harga besar (`font-mono`), `WaButton`. Seluruh kartu dibungkus `<Link href={`/kost/${kost.slug}/`}>` KECUALI tombol WA (pakai `stopPropagation` tidak perlu — strukturkan sebagai dua elemen bersaudara: judul ter-link + tombol WA di luar link, supaya tidak ada nested interactive element).

**Step 4:** Test → PASS. Verifikasi visual di `pnpm dev`.

**Step 5:** Commit: `feat(ui): kost card and whatsapp button`.

---

#### Task 13: Homepage dengan search + filter

**Objective:** Halaman utama: hero ringkas, pencarian, filter, grid hasil, hitungan hasil, tombol reset.

**Files:**
- Create: `src/components/SearchInput.tsx`, `src/components/FilterBar.tsx`, `src/components/EmptyState.tsx`
- Modify: `src/app/page.tsx`

**Step 1:** `page.tsx` adalah Server Component yang render `<HeroClient />` (Client Component) berisi state filter + `filterKosts`/`sortKosts`. Data diimpor dari `@/lib/kost` (di-bundle ke client — 155 record ≈ 60KB JSON, masih wajar; lihat Task 18 untuk opsi pindah ke server-side filter kalau perlu).

**Step 2:** State filter disinkronkan ke URL (`useSearchParams` + `router.replace` dengan `scroll: false`), format param:
```
/?q=bengkong&area=Bengkong&jenis=Kost&kriteria=Putri&max=1000000&sort=termurah
```
Baca param saat mount supaya link shareable bekerja.

**Step 3:** FilterBar = chip toggle multi-select untuk Area (14, urut dari `AREA_COUNTS` terbanyak), Jenis, Kriteria; slider/segmented budget dari `BUDGET_BUCKETS`; select sort. Di mobile chip dibungkus `<details>`/sheet agar tidak memakan layar.

**Step 4:** EmptyState: "Tidak ada kost yang cocok. Coba hapus filter atau perluas budget." + tombol Reset.

**Step 5:** Verifikasi manual:
```bash
pnpm dev
```
Cek: (a) ketik "bengkong" → hasil menyusut & hitungan akurat; (b) refresh → filter tetap (URL); (c) copy URL → buka di tab baru → hasil sama; (d) budget max 500rb → muncul hanya yang ≤500rb.

**Step 6:** Commit: `feat(ui): homepage search + filters with url state`.

---

### FASE 3 — SEO & halaman konten

#### Task 14: Halaman detail kost

**Objective:** `/kost/[slug]/` untuk tiap 155 listing, pre-rendered.

**Files:**
- Create: `src/app/kost/[slug]/page.tsx`

**Step 1:** `generateStaticParams` mengembalikan `allKosts.map(({ slug }) => ({ slug }))`; `generateMetadata` mengisi `title: `Kost ${area} — ${hargaFormatted}``, `description` dari alamat + kriteria + harga, `alternates.canonical`.

**Step 2:** Isi halaman: breadcrumb (Home / Area / Kost ini), alamat lengkap, tabel info (Area, Jenis, Kriteria, Budget, Status data), `WaButton full`, tombol "Salin alamat" (client, clipboard), link ke halaman area, disclaimer, dan blok "Kost lain di {area}" (3 item).

**Step 3:** `dynamicParams = false` (karena static export) supaya slug tak dikenal → 404 statis.

**Step 4:** Verifikasi:
```bash
pnpm build
ls out/kost | head -5
```
Expected: minimal 5 folder slug; `out/kost/<slug>/index.html` ada. Cek satu halaman:
```bash
grep -o "wa.me/62[0-9]*" out/kost/*/index.html | head -3
```
Expected: link WA benar-benar ada di HTML statis (bukan hanya hasil JS).

**Step 5:** Commit: `feat(seo): per-listing kost detail pages`.

---

#### Task 15: Halaman per area (SEO long-tail)

**Objective:** `/area/bengkong/` dst. — menargetkan pencarian "kost bengkong".

**Files:**
- Create: `src/app/area/[area]/page.tsx`

**Step 1:** `generateStaticParams` dari `Object.keys(AREA_COUNTS)` (14 halaman), slug area = `slugify(area)`.
**Step 2:** H1 `Kost di {Area} Batam — {n} pilihan, mulai Rp{x}`, paragraf pengantar 2–3 kalimat (tulis manual per area? Tidak — generate dari data: jumlah listing, range harga, jenis terbanyak; jangan bikin konten template kosong yang berulang), lalu grid kartu + link balik ke home dengan filter area terpasang.
**Step 3:** `generateMetadata` unik per area (title + description + canonical + `openGraph`).
**Step 4:** Verifikasi: `pnpm build` → `out/area/` berisi 14 folder; tidak ada title duplikat:
```bash
grep -h "<title>" out/area/*/index.html | sort | uniq -d
```
Expected: output kosong (tidak ada duplikat).
**Step 5:** Commit: `feat(seo): area landing pages`.

---

#### Task 16: sitemap, robots, JSON-LD

**Objective:** Mesin pencari menemukan dan memahami 170+ halaman.

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo.ts`, `src/lib/seo.test.ts`

**Step 1: Write failing test** (untuk builder JSON-LD & helper harga):
```ts
import { describe, it, expect } from 'vitest';
import { formatRupiah, itemListJsonLd } from '@/lib/seo';

describe('formatRupiah', () => {
  it('tanpa desimal dan pakai titik', () => expect(formatRupiah(1800000)).toBe('Rp1.800.000'));
  it('null jadi teks fallback', () => expect(formatRupiah(null)).toBe('Hubungi pemilik'));
});

describe('itemListJsonLd', () => {
  it('menghasilkan schema.org ItemList', () => {
    const ld: any = itemListJsonLd([
      { alamat: 'Ruko Aljabar', area: 'Bengkong', slug: 'a', harga: 450000 },
    ] as any, 'https://infokostbatam.id');
    expect(ld['@type']).toBe('ItemList');
    expect(ld.itemListElement[0].url).toBe('https://infokostbatam.id/kost/a/');
  });
});
```
**Step 2:** Test → FAIL.
**Step 3:** Implementasi `formatRupiah` (`Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 })`) + `itemListJsonLd` (`@type: ItemList`, tiap item `@type: Accommodation` dengan `name`, `address` (`PostalAddress` + `addressLocality: 'Batam'`), `url`; **tanpa** `price` di schema supaya tidak mengklaim harga final, harga cukup di deskripsi teks — harga kost sering berubah).
**Step 4:** `sitemap.ts` mengembalikan home + 14 area + 155 kost + `/tentang/`; `robots.ts` mengizinkan semua + menunjuk sitemap. Suntikkan JSON-LD lewat `<script type="application/ld+json">` di layout/halaman terkait.
**Step 5:** Verifikasi:
```bash
pnpm build && head -c 300 out/sitemap.xml && echo && cat out/robots.txt
```
Expected: sitemap berisi URL absolut; robots menunjuk sitemap.
**Step 6:** Commit: `feat(seo): sitemap, robots, structured data`.

---

#### Task 17: Halaman Tentang + disclaimer

**Objective:** Kepercayaan & legal: sumber data jelas, batas tanggung jawab admin, cara pakai.

**Files:**
- Create: `src/app/tentang/page.tsx`

**Isi:** sumber = postingan publik Facebook + rekap admin (bukan data pribadi), admin tidak mensurvei semua kost, foto/harga bisa berubah, **jangan transfer/DP sebelum lihat lokasi**, cara melaporkan data keliru (link WA admin), tanggal sync terakhir dari `kost-report.json`, dan ringkasan laporan kualitas data publik (berapa listing perlu verifikasi).

**Verifikasi:** `pnpm build` → `out/tentang/index.html` ada.
**Commit:** `feat(ui): about page with data-source disclaimer`.

---

### FASE 4 — Kualitas, CI, deploy

#### Task 18: Perf & payload check

**Objective:** Memastikan halaman utama tetap ringan di HP kelas menengah.

**Step 1:** `pnpm build && du -sh out/ && ls -lh out/index.html`.
**Step 2:** Kalau `first-load JS` halaman utama > 150KB (dilaporkan `next build`), pindahkan filter ke server: homepage jadi Server Component yang menerima `searchParams`, filter di server, hanya `FilterBar`/`SearchInput` yang client. Alternatif lebih murah: kirim data ke client sebagai payload minimal (id, slug, area, harga, kriteria, alamat) tanpa `catatan`/`reviewNotes`.
**Step 3:** Catat hasil sebelum/sesudah di `README.md` bagian "Performa".
**Commit:** `perf: reduce client payload of listing grid`.

---

#### Task 19: Accessibility & Lighthouse pass

**Objective:** Skor a11y ≥ 95 dan LCP < 2.5s di mobile.

**Step 1:** Pasang Playwright: `pnpm add -D @playwright/test && pnpm exec playwright install chromium`.
**Step 2:** Tulis `tests/e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('home menampilkan listing dan hitungan', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('article').first()).toBeVisible();
});

test('search memfilter hasil', async ({ page }) => {
  await page.goto('/');
  const before = await page.locator('article').count();
  await page.getByRole('searchbox').fill('bengkong');
  await expect.poll(() => page.locator('article').count()).toBeLessThan(before);
});

test('tombol WA berisi nomor 62 dan pesan terisi', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('a[href^="https://wa.me/62"]').first().getAttribute('href');
  expect(decodeURIComponent(href!)).toContain('INFO KOST BATAM');
});

test('halaman detail kost render dari HTML statis', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('a[href^="/kost/"]').first().getAttribute('href');
  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('wa.me/62');
});
```
**Step 3:** Jalankan terhadap build statis:
```bash
pnpm build && pnpm exec serve out -l 4321 & pnpm e2e
```
(player: `pnpm dlx serve out -l 4321`)
Expected: `4 passed`.
**Step 4:** Cek keyboard: Tab dari atas → fokus terlihat jelas di semua kontrol (`focus-visible:ring-2`); cek kontras chip & tombol ≥ 4.5:1; semua `<img>` (kalau nanti ada foto) punya `alt` bermakna; heading berurutan h1→h2.
**Step 5:** Lighthouse (Chrome/Brave):
```bash
pnpm dlx lighthouse http://localhost:4321 --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless"
```
Expected: a11y ≥ 95, SEO ≥ 95, perf ≥ 90.
**Step 6:** Commit: `test(e2e): playwright smoke + a11y pass`.

---

#### Task 20: CI + deploy

**Objective:** Push ke `main` → test + build → tayang otomatis.

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `README.md`

**Step 1:** `ci.yml` (jalankan di PR & main): `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`.
**Step 2:** Deploy — **DIKUNCI: VPS + rsync, replikasi `web-personal`**:

`deploy.yml` (`on: push: branches: [main]`), tiga job berurutan: `test` (`pnpm lint` + `pnpm test`) → `security` (Snyk `--severity-threshold=high`) → `deploy`. Node 22 + `pnpm/action-setup@v4`, cache pnpm. Langkah deploy:

```yaml
      - name: Setup SSH key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DEPLOY_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H 43.128.113.94 >> ~/.ssh/known_hosts 2>/dev/null

      - name: Deploy to VPS
        run: |
          rsync -avz --delete \
            -e "ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no" \
            out/ ubuntu@43.128.113.94:/var/www/info-kost-batam/
```

Secrets yang dipakai: `DEPLOY_KEY` (kunci yang sudah ada untuk VPS ini, dipakai juga oleh `web-personal`) + `SNYK_TOKEN`. Tidak perlu secret host/user baru.

Setup VPS satu kali (butuh akses SSH, dilakukan user):
```bash
ssh ubuntu@43.128.113.94 'sudo mkdir -p /var/www/info-kost-batam && sudo chown ubuntu:ubuntu /var/www/info-kost-batam'
```
Server block nginx baru untuk subdomain (pola sama dengan `web-personal`, ditambah `try_files` yang sadar trailing slash):
```nginx
server {
  listen 80;
  server_name kost.nhasan.tech;
  root /var/www/info-kost-batam;
  index index.html;
  location / { try_files $uri $uri/ $uri/index.html =404; }
}
```
Lalu `sudo certbot --nginx -d kost.nhasan.tech` untuk TLS, dan tambah record DNS: `A  kost  43.128.113.94`.
**Step 3:** Kalau pakai VPS, tambahkan cron/menu di README untuk update data:
```bash
pnpm sync && git add src/data && git commit -m "data: sync $(date +%F)" && git push
```
(Jalankan lokal atau lewat GitHub Action terjadwal mingguan — bukan tiap hari, karena sheet jarang berubah.)
**Step 4:** Verifikasi deploy: buka URL produksi, cek `/sitemap.xml` bisa diakses, satu halaman `/kost/...` return 200, tombol WA membuka WhatsApp dengan pesan terisi.
**Step 5:** Daftarkan ke Google Search Console (submit sitemap). Ini langkah manual user.
**Step 6:** Commit: `ci: test + build workflow and deploy`.

---

#### Task 21: README + panduan admin

**Objective:** Orang lain (atau user 3 bulan lagi) bisa update data tanpa baca kode.

**Files:**
- Create/Modify: `README.md`

**Isi:** cara jalankan lokal, `pnpm sync` (dari mana datanya, apa yang dinormalisasi), cara baca `kost-report.json` (duplikat/absen nomor/perlu review), cara menambah area baru (tambah ke `AREAS`+`ALIASES`), aturan slug, daftar keputusan desain, dan bagian "Data quality" yang menampilkan hasil sync terakhir.

**Commit:** `docs: readme + admin guide`.

---

## 3. Files Likely to Change

| Path | Aksi |
|---|---|
| `scripts/lib/{csv,phone,area,budget,slug,dedupe}.mjs` | create |
| `scripts/sync-kost.mjs` | create |
| `src/data/kost.json`, `src/data/kost-report.json` | generated (di-commit) |
| `src/lib/{types,kost,filter,phone,slug,seo}.ts` | create |
| `src/components/{SiteHeader,SiteFooter,KostCard,WaButton,SearchInput,FilterBar,EmptyState}.tsx` | create |
| `src/app/{layout,page,globals.css,not-found.tsx}` | create/modify |
| `src/app/kost/[slug]/page.tsx`, `src/app/area/[area]/page.tsx`, `src/app/tentang/page.tsx` | create |
| `src/app/{sitemap,robots}.ts` | create |
| `tests/unit/*.test.ts(x)`, `tests/e2e/smoke.spec.ts` | create |
| `next.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `package.json` | create/modify |
| `.github/workflows/{ci,deploy}.yml`, `README.md` | create |

## 4. Tests / Validation

**Otomatis (harus hijau sebelum merge):**
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
```
Cakupan unit test: `parseCsv` (4), `normalizePhone`/`buildWaLink` (7), `canonicalArea` (4), `parseBudget`/`parseKriteria`/`parseJenis` (10), `slugify`/`buildSlug` (6), `dedupe`/`mergeDuplicates` (4), `filterKosts`/`sortKosts` (10), `WaButton` (3), `formatRupiah`/`itemListJsonLd` (3).

**Manual (checklist rilis):**
- [ ] 155 listing muncul, hitungan di header cocok dengan `kost-report.json → kept`
- [ ] Tidak ada duplikat tampil (Simpang Bengkong Harapan 1 muncul sekali)
- [ ] Tidak ada `#VALUE!` atau `undefined` yang bocor ke UI
- [ ] Semua nomor WA diawali `62`, tidak ada yang bikin WhatsApp error
- [ ] Filter + search + sort jalan, state ada di URL, share URL berfungsi
- [ ] `/kost/<slug>/` return 200 dan berisi link WA di HTML statis
- [ ] 14 halaman area ada, title semuanya unik
- [ ] `sitemap.xml` memuat seluruh URL, `robots.txt` menunjuk sitemap
- [ ] Disclaimer sumber data tampil di footer + halaman Tentang
- [ ] Di layar 375px: tombol WA bisa dijangkau jempol tanpa zoom horizontal
- [ ] Lighthouse mobile: a11y ≥ 95, SEO ≥ 95, perf ≥ 90

## 5. Risks, Tradeoffs, Open Questions

**Risks**
1. **Nomor WA salah/kadaluarsa → pengunjung chat orang yang salah.** Mitigasi: `needsReview` + halaman Tentang dengan cara lapor; tampilkan nomor dalam bentuk teks di halaman detail supaya user bisa verifikasi.
2. **Data tidak pernah di-refresh → harga basi.** Mitigasi: tanggal sync terakhir tampil di footer; sync dijadwalkan mingguan.
3. **Kredibilitas (data dari Facebook, tanpa survey).** Mitigasi: disclaimer jujur, jangan mengklaim "terverifikasi". Jangan tambahkan rating/ulasan palsu.
4. **Google Sheets berubah struktur.** Mitigasi: deteksi header dinamis + guard `MIN_EXPECTED` → sync gagal berisik, bukan diam-diam menulis data kosong.
5. **Sengketa/permintaan turun.** Mitigasi: siapkan cara menghapus listing cepat (tambah kolom "status" di sheet; drop baris ber-status `hapus` di pipeline — belum diimplementasi, lihat open question 3).

**Tradeoffs**
- Static export = tidak ada tracking klik WA/analytics tanpa layanan eksternal. Diterima (YAGNI); kalau nanti perlu, tambahkan Umami/Plausible (cookieless).
- Data di-bundle ke client = payload lebih besar, tapi filter instan. Kalau >150KB JS, pindah ke server-side filter (Task 18).
- Slug dari alamat berarti mengubah alamat = URL berubah = kehilangan peringkat SEO. Mitigasi: simpan peta `slugRedir` kalau perlu, atau pakai `id` stabil sebagai kanonik.

**Open questions (jawaban mengubah plan ini)**
1. **Hosting: Vercel atau VPS?** Plan default Vercel; opsi VPS ada di Task 20B.
2. **Domain:** apakah pakai subdomain `kost.nhasan.tech` atau domain baru? Mempengaruhi `metadataBase`, sitemap, dan canonical.
3. **Ada mekanisme takedown?** Perlukah kolom `status` di sheet (`aktif`/`hapus`/`penuh`) yang difilter pipeline? Saya sarankan ya — murah dan mencegah komplain pemilik.
4. **Token dark mode:** tetap light-first (default plan) atau dark-first sesuai selera artifact user?
5. **Foto kost:** plan ini tanpa foto (sheet tidak punya gambar yang bisa dipakai otomatis). Kalau mau, butuh langkah upload/CRM terpisah.

---

**Status:** PLAN ONLY — belum ada kode yang ditulis selain file rencana ini.
