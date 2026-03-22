import { createClient } from 'next-sanity'
import { sanityConfig } from '../config'

export const client = createClient({
  ...sanityConfig,
  useCdn: false,
  perspective: 'published',
  token: process.env.SANITY_API_READ_TOKEN,
  stega: {
    enabled: process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview',
    studioUrl: '/studio',
  },
})
