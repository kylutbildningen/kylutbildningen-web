import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Webbplatsinställningar',
  type: 'document',
  fields: [
    defineField({
      name: 'contactEmail',
      title: 'Kontakt-e-post',
      type: 'string',
    }),
    defineField({
      name: 'contactPhone',
      title: 'Telefonnummer',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Adress',
      type: 'string',
    }),
  ],
})
