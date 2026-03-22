import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { client } from '@/sanity/lib/client'

const draftMode = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN }),
})

// Wrap to satisfy Next.js 16 route handler signature
export async function GET(request: Request) {
  return draftMode.GET(request)
}
