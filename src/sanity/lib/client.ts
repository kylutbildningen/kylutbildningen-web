import { createClient } from 'next-sanity'
import { sanityConfig } from '../config'

export const client = createClient({
  ...sanityConfig,
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
})
