import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { presentationTool } from 'sanity/presentation'
import { sanityConfig } from './config'
import { schemaTypes } from './schema'

export default defineConfig({
  ...sanityConfig,
  title: 'Kylutbildningen',
  basePath: '/studio',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Innehåll')
          .items([
            S.listItem()
              .title('Startsida')
              .child(S.document().schemaType('homePage').documentId('homePage')),
            S.listItem()
              .title('Webbplatsinställningar')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.divider(),
            S.documentTypeListItem('coursePage').title('Kurssidor'),
          ]),
    }),
    presentationTool({
      previewUrl: {
        initial: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        previewMode: {
          enable: '/api/draft-mode/enable',
          disable: '/api/draft-mode/disable',
        },
      },
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})
