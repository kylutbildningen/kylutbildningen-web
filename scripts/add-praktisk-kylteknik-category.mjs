import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '3nwk1dxf',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

const PRAKTISK_SLUG = 'praktisk-kylteknik-5-dagar'
const TAGLINE = 'Grundkurs i kylteknik på 5 dagar — teori och praktik för nybörjare'

const homeDoc = await client.fetch(
  `*[_type == "homePage"][0]{ _id, title, courseCategories[]{ _key, tagline, coursePage->{ _id, title, slug } } }`
)
if (!homeDoc?._id) {
  console.error('✗ Hittade inget homePage-dokument')
  process.exit(1)
}

const praktisk = await client.fetch(
  `*[_type == "coursePage" && slug.current == $slug][0]{ _id, title }`,
  { slug: PRAKTISK_SLUG }
)
if (!praktisk?._id) {
  console.error(`✗ Hittade inte coursePage med slug "${PRAKTISK_SLUG}"`)
  process.exit(1)
}

const existing = homeDoc.courseCategories ?? []
const already = existing.find(c => c.coursePage?._id === praktisk._id)
if (already) {
  console.log(`Praktisk Kylteknik finns redan i utbildningsområden (key: ${already._key}). Avbryter.`)
  process.exit(0)
}

const newEntry = {
  _key: `cat-${praktisk._id.replace(/[^a-z0-9]/gi, '').slice(0, 16)}`,
  _type: 'object',
  tagline: TAGLINE,
  coursePage: { _type: 'reference', _ref: praktisk._id },
}

console.log(`Lägger till "${praktisk.title}" på startsidans utbildningsområden...`)

try {
  await client
    .patch(homeDoc._id)
    .setIfMissing({ courseCategories: [] })
    .append('courseCategories', [newEntry])
    .commit()
  console.log(`✓ Tillagt på ${homeDoc.title ?? homeDoc._id}`)
} catch (err) {
  console.error(`✗ ${err.message}`)
  process.exit(1)
}
