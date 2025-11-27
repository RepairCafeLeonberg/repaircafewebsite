import { defineType, defineField, type Rule } from 'sanity';

const timeValidation = (rule: Rule) =>
  rule
    .required()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
      name: '24h time',
      invert: false,
      message: 'Bitte im Format HH:MM (24-Stunden) angeben.'
    });

export default defineType({
  name: 'event',
  title: 'Event',
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
      description:
        'Bitte selbst einen eindeutigen Slug vergeben (z. B. repair-cafe-leonberg-maerz-2025).',
      options: {
        maxLength: 96
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'date',
      title: 'Datum',
      type: 'date',
      options: {
        calendarTodayLabel: 'Heute'
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'startTime',
      title: 'Beginn (Uhrzeit)',
      type: 'string',
      description: 'Format HH:MM (24-Stunden).',
      validation: timeValidation
    }),
    defineField({
      name: 'endTime',
      title: 'Ende (Uhrzeit)',
      type: 'string',
      description: 'Format HH:MM (24-Stunden).',
      validation: timeValidation
    }),
    defineField({
      name: 'location',
      title: 'Ort / Treffpunkt',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'streetAddress',
      title: 'Adresse',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'postalCode',
      title: 'PLZ',
      type: 'string',
      validation: (rule) =>
        rule
          .required()
          .regex(/^\d{5}$/, {
            name: 'PLZ',
            invert: false,
            message: 'Bitte eine fünfstellige Postleitzahl eintragen.'
          })
    }),
    defineField({
      name: 'city',
      title: 'Ort (Stadt/Gemeinde)',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'summary',
      title: 'Kurzbeschreibung (optional)',
      type: 'text',
      rows: 3,
      description: 'Kurzer Hinweis- oder Infotext für die Termin-Karte.'
    }),
    defineField({
      name: 'infoLink',
      title: 'Optionaler Link (Anmeldung/Details)',
      type: 'object',
      fields: [
        {
          name: 'label',
          title: 'Link-Label',
          type: 'string',
          initialValue: 'Mehr Infos / Anmeldung'
        },
        {
          name: 'url',
          title: 'URL',
          type: 'url',
          description: 'Bitte mit http(s) oder mailto beginnen – z. B. https://… oder mailto:info@…',
          validation: (rule) => rule.uri({ allowRelative: false, scheme: ['http', 'https', 'mailto'] })
        }
      ],
      options: { collapsible: true },
      description: 'Optionaler Button auf der Karte, z. B. zur Anmeldung oder für weitere Infos.'
    }),
    defineField({
      name: 'showInfoBox',
      title: 'Standard-Hinweisbox anzeigen',
      type: 'boolean',
      initialValue: true,
      description: 'Blende die Standard-Hinweise (z. B. keine Anmeldung nötig, Spenden willkommen) ein oder aus.'
    })
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      startTime: 'startTime',
      endTime: 'endTime'
    },
    prepare(selection: { title?: string; date?: string; startTime?: string; endTime?: string }) {
      const { title, date, startTime, endTime } = selection;
      const datePart = date ?? '';
      const timePart = startTime && endTime ? `${startTime}–${endTime}` : startTime ?? '';
      const subtitle = [datePart, timePart].filter(Boolean).join(' · ');
      return {
        title,
        subtitle
      };
    }
  }
});
