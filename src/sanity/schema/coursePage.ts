import { defineField, defineType, defineArrayMember } from 'sanity'

export const coursePage = defineType({
  name: 'coursePage',
  title: 'Kurssida',
  type: 'document',
  groups: [
    { name: 'settings', title: 'Inställningar' },
    { name: 'content', title: 'Innehåll', default: true },
    { name: 'layout', title: 'Layout' },
  ],
  fields: [
    // --- INSTÄLLNINGAR ---
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      group: 'settings',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'settings',
      options: { source: 'title' },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'eduAdminCourseTemplateId',
      title: 'EduAdmin CourseTemplate ID',
      type: 'number',
      group: 'settings',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Kort beskrivning',
      type: 'text',
      group: 'settings',
      rows: 3,
    }),

    // --- INNEHÅLL ---
    defineField({
      name: 'description',
      title: 'Beskrivning',
      type: 'array',
      group: 'content',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'antalDagar',
      title: 'Antal dagar',
      type: 'number',
      group: 'content',
      description: 'T.ex. 3 för nyexaminering, 2 för omexaminering',
    }),
    defineField({
      name: 'omUtbildningen',
      title: 'Om utbildningen',
      type: 'text',
      group: 'content',
      rows: 4,
      description: 'Kort intro — vilket regelverk kursen uppfyller och vad den ger.',
    }),
    defineField({
      name: 'innehall',
      title: 'Innehåll — vad vi går igenom',
      type: 'array',
      group: 'content',
      of: [{ type: 'string' }],
      description: 'Punktlista med kursinnehållet.',
    }),
    defineField({
      name: 'upplagg',
      title: 'Upplägg — dag för dag',
      type: 'array',
      group: 'content',
      of: [{ type: 'string' }],
      description: 'T.ex. "Dag 1–2: Teoretisk genomgång", "Dag 3: Prov"',
    }),
    defineField({
      name: 'upplaggText',
      title: 'Uppläggstext — avslutande mening',
      type: 'text',
      group: 'content',
      rows: 2,
      description: 'T.ex. "Under den sista dagen examineras du..."',
    }),
    defineField({
      name: 'certifiering',
      title: 'Certifiering',
      type: 'text',
      group: 'content',
      rows: 3,
    }),
    defineField({
      name: 'lodprov',
      title: 'Lödprov',
      type: 'text',
      group: 'content',
      rows: 3,
    }),
    defineField({
      name: 'targetGroup',
      title: 'Målgrupp',
      type: 'text',
      group: 'content',
      rows: 2,
    }),
    defineField({
      name: 'prerequisites',
      title: 'Förkunskaper',
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
      description: 'Dra sektionerna i den ordning du vill visa dem. Avmarkera "Visa" för att dölja en sektion.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'courseSection',
          fields: [
            defineField({
              name: 'sectionType',
              title: 'Sektion',
              type: 'string',
              options: {
                list: [
                  { title: 'Snabbfakta (dagar, målgrupp, förkunskaper, certifiering)', value: 'snabbfakta' },
                  { title: 'Beskrivning', value: 'beskrivning' },
                  { title: 'Om utbildningen', value: 'omUtbildningen' },
                  { title: 'Innehåll — vad vi går igenom', value: 'innehall' },
                  { title: 'Upplägg — dag för dag', value: 'upplagg' },
                  { title: 'Certifiering', value: 'certifiering' },
                  { title: 'Lödprov', value: 'lodprov' },
                  { title: 'Kommande tillfällen', value: 'kommandeTillfallen' },
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
                snabbfakta: 'Snabbfakta',
                beskrivning: 'Beskrivning',
                omUtbildningen: 'Om utbildningen',
                innehall: 'Innehåll',
                upplagg: 'Upplägg',
                certifiering: 'Certifiering',
                lodprov: 'Lödprov',
                kommandeTillfallen: 'Kommande tillfällen',
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
    select: { title: 'title', subtitle: 'slug.current' },
  },
})
