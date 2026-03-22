import { defineField, defineType } from 'sanity'

export const page = defineType({
  name: 'page',
  title: 'Sida',
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
      name: 'heroHeading',
      title: 'Hero-rubrik',
      type: 'string',
    }),
    defineField({
      name: 'heroText',
      title: 'Hero-text',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'content',
      title: 'Innehåll',
      type: 'array',
      of: [{ type: 'block' }],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'slug.current' },
  },
})
