import { defineField, defineType } from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Startsida',
  type: 'document',

  fields: [
    // --- HERO ---
    defineField({
      name: 'heroHeading',
      title: 'Hero — Rubrik',
      type: 'string',
      description: 'T.ex. "Certifieringskurser för kylbranschen"',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'heroSubheading',
      title: 'Hero — Underrubrik',
      type: 'string',
      description: 'T.ex. "Godkänt examinationscenter av INCERT för alla kategori 1–5"',
    }),
    defineField({
      name: 'heroCtaText',
      title: 'Hero — CTA-knapptext',
      type: 'string',
      initialValue: 'Se alla kurser',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero — Bakgrundsbild',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'Alt-text' }),
      ],
    }),

    // --- USP-BADGES ---
    defineField({
      name: 'uspItems',
      title: 'USP — Förtroendemärken',
      description: '3 korta punkter under hero. T.ex. "INCERT-certifierat", "Sedan 2010", "Göteborg".',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Text', type: 'string' }),
            defineField({
              name: 'icon',
              title: 'Ikon',
              type: 'string',
              description: 'Välj: shield | calendar | location | certificate | people',
              options: {
                list: [
                  { title: 'Sköld (certifiering)', value: 'shield' },
                  { title: 'Kalender (år/datum)', value: 'calendar' },
                  { title: 'Plats', value: 'location' },
                  { title: 'Diplom', value: 'certificate' },
                  { title: 'Grupp', value: 'people' },
                ],
              },
            }),
          ],
          preview: {
            select: { title: 'label' },
          },
        },
      ],
      validation: Rule => Rule.max(3),
    }),

    // --- OM OSS ---
    defineField({
      name: 'aboutHeading',
      title: 'Om oss — Rubrik',
      type: 'string',
      initialValue: 'Om Kylutbildningen',
    }),
    defineField({
      name: 'aboutText',
      title: 'Om oss — Text',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'aboutImage',
      title: 'Om oss — Bild',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'Alt-text' }),
      ],
    }),

    // --- UTBILDNINGSOMRÅDEN ---
    defineField({
      name: 'courseCategoryHeading',
      title: 'Utbildningsområden — Rubrik',
      type: 'string',
      initialValue: 'Våra utbildningsområden',
    }),
    defineField({
      name: 'courseCategories',
      title: 'Utbildningsområden — Kategorikort',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'coursePage',
              title: 'Länkad kursinfosida',
              type: 'reference',
              to: [{ type: 'coursePage' }],
            }),
            defineField({
              name: 'tagline',
              title: 'Kort tagline (visas på kortet)',
              type: 'string',
              description: 'T.ex. "F-gas kategori I & II certifiering"',
            }),
          ],
          preview: {
            select: { title: 'coursePage.title', subtitle: 'tagline' },
          },
        },
      ],
    }),

    // --- KOMMANDE KURSER ---
    defineField({
      name: 'upcomingCoursesHeading',
      title: 'Kommande kurser — Rubrik',
      type: 'string',
      initialValue: 'Kommande kurser',
    }),
    defineField({
      name: 'upcomingCoursesSubtext',
      title: 'Kommande kurser — Undertext',
      type: 'string',
      description: 'Liten text under rubriken, t.ex. "Boka din plats idag"',
    }),

    // --- KONTAKT-TEASER ---
    defineField({
      name: 'contactHeading',
      title: 'Kontakt — Rubrik',
      type: 'string',
      initialValue: 'Har du frågor?',
    }),
    defineField({
      name: 'contactText',
      title: 'Kontakt — Text',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Startsida' }),
  },
})
