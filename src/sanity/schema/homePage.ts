import { defineField, defineType, defineArrayMember } from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Startsida',
  type: 'document',

  groups: [
    { name: 'hero', title: 'Hero' },
    { name: 'content', title: 'Innehåll', default: true },
    { name: 'layout', title: 'Layout' },
  ],

  fields: [
    // --- HERO ---
    defineField({
      name: 'heroHeading',
      title: 'Hero — Rubrik',
      type: 'string',
      group: 'hero',
      description: 'T.ex. "Certifieringskurser för kylbranschen"',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'heroSubheading',
      title: 'Hero — Underrubrik',
      type: 'string',
      group: 'hero',
      description: 'T.ex. "Godkänt examinationscenter av INCERT för alla kategori 1–5"',
    }),
    defineField({
      name: 'heroCtaText',
      title: 'Hero — CTA-knapptext',
      type: 'string',
      group: 'hero',
      initialValue: 'Se alla kurser',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero — Bakgrundsbild',
      type: 'image',
      group: 'hero',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'Alt-text' }),
      ],
    }),

    // --- INNEHÅLL ---
    defineField({
      name: 'uspItems',
      title: 'USP — Förtroendemärken',
      description: '3 korta punkter under hero.',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Text', type: 'string' }),
            defineField({
              name: 'icon',
              title: 'Ikon',
              type: 'string',
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
          preview: { select: { title: 'label' } },
        },
      ],
      validation: Rule => Rule.max(3),
    }),

    defineField({
      name: 'aboutHeading',
      title: 'Om oss — Rubrik',
      type: 'string',
      group: 'content',
      initialValue: 'Om Kylutbildningen',
    }),
    defineField({
      name: 'aboutText',
      title: 'Om oss — Text',
      type: 'array',
      group: 'content',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'aboutImage',
      title: 'Om oss — Bild',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'Alt-text' }),
      ],
    }),

    defineField({
      name: 'courseCategoryHeading',
      title: 'Utbildningsområden — Rubrik',
      type: 'string',
      group: 'content',
      initialValue: 'Våra utbildningsområden',
    }),
    defineField({
      name: 'courseCategories',
      title: 'Utbildningsområden — Kategorikort',
      type: 'array',
      group: 'content',
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
            }),
          ],
          preview: {
            select: { title: 'coursePage.title', subtitle: 'tagline' },
          },
        },
      ],
    }),

    defineField({
      name: 'upcomingCoursesHeading',
      title: 'Kommande kurser — Rubrik',
      type: 'string',
      group: 'content',
      initialValue: 'Kommande kurser',
    }),
    defineField({
      name: 'upcomingCoursesSubtext',
      title: 'Kommande kurser — Undertext',
      type: 'string',
      group: 'content',
    }),

    defineField({
      name: 'contactHeading',
      title: 'Kontakt — Rubrik',
      type: 'string',
      group: 'content',
      initialValue: 'Har du frågor?',
    }),
    defineField({
      name: 'contactText',
      title: 'Kontakt — Text',
      type: 'text',
      group: 'content',
      rows: 2,
    }),

    // --- LAYOUT ---
    defineField({
      name: 'layout',
      title: 'Sidlayout — dra för att ändra ordning',
      type: 'array',
      group: 'layout',
      description: 'Dra sektionerna i den ordning du vill visa dem. Hero visas alltid först.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'homeSection',
          fields: [
            defineField({
              name: 'sectionType',
              title: 'Sektion',
              type: 'string',
              options: {
                list: [
                  { title: 'USP-rad (förtroendemärken)', value: 'usp' },
                  { title: 'Kommande kurser', value: 'kommandeKurser' },
                  { title: 'Utbildningsområden', value: 'utbildningsomraden' },
                  { title: 'Kontakt', value: 'kontakt' },
                ],
              },
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'visible',
              title: 'Visa',
              type: 'boolean',
              initialValue: true,
            }),
          ],
          preview: {
            select: { sectionType: 'sectionType', visible: 'visible' },
            prepare({ sectionType, visible }) {
              const labels: Record<string, string> = {
                usp: 'USP-rad',
                kommandeKurser: 'Kommande kurser',
                utbildningsomraden: 'Utbildningsområden',
                kontakt: 'Kontakt',
              }
              return {
                title: labels[sectionType] ?? sectionType,
                subtitle: visible === false ? 'Dold' : 'Visas',
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Startsida' }),
  },
})
