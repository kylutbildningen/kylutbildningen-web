import { defineField, defineType } from 'sanity'

export const coursePage = defineType({
  name: 'coursePage',
  title: 'Kurssida',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'eduAdminCourseTemplateId',
      title: 'EduAdmin CourseTemplate ID',
      type: 'number',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Kort beskrivning',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'description',
      title: 'Beskrivning',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'antalDagar',
      title: 'Antal dagar',
      type: 'number',
      description: 'T.ex. 3 för nyexaminering, 2 för omexaminering',
    }),
    defineField({
      name: 'omUtbildningen',
      title: 'Om utbildningen',
      type: 'text',
      rows: 4,
      description: 'Kort intro — vilket regelverk kursen uppfyller och vad den ger.',
    }),
    defineField({
      name: 'innehall',
      title: 'Innehåll — vad vi går igenom',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Punktlista med kursinnehållet.',
    }),
    defineField({
      name: 'upplagg',
      title: 'Upplägg — dag för dag',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'T.ex. "Dag 1–2: Teoretisk genomgång", "Dag 3: Prov"',
    }),
    defineField({
      name: 'upplaggText',
      title: 'Uppläggstext — avslutande mening',
      type: 'text',
      rows: 2,
      description: 'T.ex. "Under den sista dagen examineras du..."',
    }),
    defineField({
      name: 'certifiering',
      title: 'Certifiering',
      type: 'text',
      rows: 3,
      description: 'Information om certifiering, t.ex. vilken typ av certifikat som utfärdas.',
    }),
    defineField({
      name: 'lodprov',
      title: 'Lödprov',
      type: 'text',
      rows: 3,
      description: 'Information om lödprov.',
    }),
    defineField({
      name: 'targetGroup',
      title: 'Målgrupp',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'prerequisites',
      title: 'Förkunskaper',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'slug.current' },
  },
})
