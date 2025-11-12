import { defineType, defineField, defineArrayMember } from 'sanity';

export default defineType({
  name: 'post',
  title: 'Aktuelles',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'publishedAt',
      title: 'Veröffentlichungsdatum',
      type: 'date',
      options: {
        dateFormat: 'DD.MM.YYYY'
      },
      initialValue: () => new Date().toISOString().split('T')[0],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'coverImage',
      title: 'Titelbild',
      type: 'image',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'body',
      title: 'Inhalt',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    validation: (rule) => rule.required()
                  }),
                  defineField({
                    name: 'openInNewTab',
                    title: 'In neuem Tab öffnen',
                    type: 'boolean',
                    initialValue: false
                  })
                ]
              }
            ]
          }
        }),
        defineArrayMember({
          type: 'image',
          options: {
            hotspot: true
          },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternativtext',
              type: 'string',
              validation: (rule) => rule.required().warning('Hilft bei Barrierefreiheit und SEO.')
            }),
            defineField({
              name: 'caption',
              title: 'Bildunterschrift',
              type: 'string'
            })
          ]
        })
      ],
      validation: (rule) => rule.required().min(1)
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'publishedAt',
      media: 'coverImage'
    }
  }
});
