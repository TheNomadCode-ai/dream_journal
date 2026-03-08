import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/api/', '/settings', '/notebooks'],
    },
    sitemap: 'https://somniavault.me/sitemap.xml',
  }
}
