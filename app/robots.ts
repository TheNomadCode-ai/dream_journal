import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog', '/blog/*', '/privacy', '/terms'],
        disallow: [
          '/dashboard',
          '/morning',
          '/evening',
          '/settings',
          '/install',
          '/onboarding',
          '/signup',
          '/login',
          '/api',
        ],
      },
    ],
    sitemap: 'https://www.somniavault.me/sitemap.xml',
  }
}
