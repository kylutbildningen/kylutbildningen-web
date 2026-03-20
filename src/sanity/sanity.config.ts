import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
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
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})
