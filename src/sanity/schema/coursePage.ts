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
