import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'guestbookEntry',
  title: 'Gästebuch-Eintrag',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Wie darf der Eintrag unterschrieben werden?',
      validation: (rule) =>
        rule
          .required()
          .min(2)
          .max(80)
          .error('Bitte einen Namen oder ein Pseudonym zwischen 2 und 80 Zeichen eintragen.')
    }),
    defineField({
      name: 'message',
      title: 'Nachricht',
      type: 'text',
      rows: 5,
      description: 'Die Botschaft, die auf der Website erscheinen soll.',
      validation: (rule) =>
        rule
          .required()
          .min(10)
          .max(600)
          .error('Bitte eine Nachricht zwischen 10 und 600 Zeichen eingeben.')
    }),
    defineField({
      name: 'city',
      title: 'Ort (optional)',
      type: 'string',
      description: 'Optional: Woher stammt die Person oder Gruppe?',
      validation: (rule) => rule.max(80)
    }),
    defineField({
      name: 'approved',
      title: 'Freigeben für Website',
      type: 'boolean',
      description: 'Nur freigegebene Einträge werden im Gästebuch angezeigt.',
      initialValue: false,
      validation: (rule) => rule.required()
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'message'
    },
    prepare(selection) {
      const { title, subtitle } = selection;
      const truncated = subtitle ? `${subtitle.slice(0, 100)}${subtitle.length > 100 ? '…' : ''}` : '';
      return {
        title,
        subtitle: truncated
      };
    }
  }
});
