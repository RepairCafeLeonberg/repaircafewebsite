import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'teamVoice',
  title: 'Team-Stimmen & Portraits',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'badge',
      title: 'Kurzlabel (z. B. Team oder Fachgebiet)',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'role',
      title: 'Rolle/Position',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'quote',
      title: 'Zitat',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Beschreibung',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'portrait',
      title: 'Portraitfoto',
      type: 'image',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'portraitAlt',
      title: 'Alternativtext für das Portrait',
      type: 'string',
      hidden: ({ parent }) => !parent?.portrait,
      validation: (rule) => rule.custom((value, context) => {
        if (context.parent?.portrait && !value) {
          return 'Bitte Alternativtext für das Bild angeben.';
        }
        return true;
      })
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'portrait'
    }
  }
});
