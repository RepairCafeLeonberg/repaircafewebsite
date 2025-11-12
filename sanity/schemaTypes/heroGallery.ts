import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'heroGallery',
  title: 'Startseite Hero – Bilder',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      initialValue: 'Hero Bilder'
    }),
    defineField({
      name: 'slides',
      title: 'Bilder',
      type: 'array',
      of: [
        defineField({
          name: 'slide',
          type: 'object',
          fields: [
            defineField({
              name: 'image',
              title: 'Bild',
              type: 'image',
              options: { hotspot: true },
              validation: (rule) => rule.required()
            }),
            defineField({
              name: 'alt',
              title: 'Alt-Text',
              type: 'string'
            })
          ],
          preview: {
            select: { title: 'alt', media: 'image' },
            prepare(selection) {
              const { title, media } = selection;
              return {
                title: title || 'Hero Bild',
                media
              };
            }
          }
        })
      ]
    })
  ],
  preview: {
    select: {
      title: 'title',
      slides: 'slides'
    },
    prepare({ title, slides }) {
      return {
        title: title || 'Hero Bilder',
        subtitle: slides?.length ? `${slides.length} Bilder` : 'Keine Bilder hinterlegt'
      };
    }
  }
});
