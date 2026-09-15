import type { MetadataRoute } from 'next'
import { allKosts, areasByCount, slugifyArea } from '@/lib/kost'
import { SITE_URL } from '@/lib/phone'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/tentang/`, lastModified, changeFrequency: 'monthly', priority: 0.3 },
    ...areasByCount.map(({ area }) => ({
      url: `${SITE_URL}/area/${slugifyArea(area)}/`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...allKosts.map((k) => ({
      url: `${SITE_URL}/kost/${k.slug}/`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
