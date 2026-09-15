import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static export: `next build` menghasilkan out/ berisi HTML per route,
  // jadi deploy rsync ke VPS tetap jalan (pola sama dengan web-personal).
  output: 'export',

  // out/kost/slug/index.html (bukan slug.html) — lebih ramah nginx.
  trailingSlash: true,

  // next/image butuh server optimizer; di static export harus dimatikan.
  // (Belum ada gambar di fase ini, dimatikan supaya tidak jadi jebakan nanti.)
  images: { unoptimized: true },
}

export default nextConfig
