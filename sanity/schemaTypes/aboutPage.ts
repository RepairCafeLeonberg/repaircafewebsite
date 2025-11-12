import {defineType, defineField} from 'sanity';

export default defineType({
  name: 'aboutPage',
  title: 'Über uns Seite',
  type: 'document',
  fields: [
    defineField({
      name: 'teamImage',
      title: 'Teamfoto',
      type: 'image',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'teamImageAlt',
      title: 'Alt-Text für Teamfoto',
      type: 'string',
      description: 'Beschreibt das Foto für Screenreader und SEO.'
    }),
    defineField({
      name: 'teamImageTitle',
      title: 'Titel über dem Teamfoto',
      type: 'string',
      description: 'Kurzer Titel, der auf dem Bild angezeigt wird.'
    }),
    defineField({
      name: 'teamImageDescription',
      title: 'Beschreibung auf dem Teamfoto',
      type: 'text',
      rows: 3,
      description: 'Kurzer Satz, der das Team oder die Szene beschreibt.'
    }),
    defineField({
      name: 'missionParagraphs',
      title: 'Textabschnitte für "Unsere Mission"',
      type: 'array',
      of: [
        defineField({
          name: 'missionParagraph',
          type: 'text',
          rows: 3
        })
      ],
      description: 'Jeder Eintrag entspricht einem Absatz im Bereich "Unsere Mission".',
      validation: (rule) => rule.min(1)
    })
  ],
  preview: {
    prepare() {
      return {
        title: 'Über uns Seite',
        subtitle: 'Teamfoto & Missionstext'
      };
    }
  }
});
