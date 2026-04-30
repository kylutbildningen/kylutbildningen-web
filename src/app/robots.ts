import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/logga-in', '/onboarding', '/dashboard', '/studio'],
    },
    sitemap: 'https://kylutbildningen.se/sitemap.xml',
  }
}
