import { useEffect } from 'react';
import { defineType, defineField, set } from 'sanity';
import type { StringInputProps } from 'sanity';

const galleryCategoryOptions = [
  { title: 'Elektro', value: 'elektro' },
  { title: 'PC-Telefon', value: 'pc-telefon' },
  { title: 'Holz-Sonstiges', value: 'holz-sonstiges' },
  { title: 'Textil', value: 'textil' },
  { title: 'Fahrrad', value: 'fahrrad' },
  { title: 'Kaffee & Community', value: 'kaffee-community' },
  { title: 'Standort & Umgebung', value: 'location' }
];

const categoryLabelMap = galleryCategoryOptions.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.title;
  return acc;
}, {});

const AltTextInput = (props: StringInputProps) => {
  const { value, renderDefault, onChange, context } = props;
  const title = typeof context?.document?.title === 'string' ? context.document.title : '';

  useEffect(() => {
    if (!value && title) {
      onChange?.(set(title));
    }
  }, [value, title, onChange]);

  return renderDefault(props);
};

export default defineType({
  name: 'galleryImage',
  title: 'Bildergalerie – Bild',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      validation: (rule) => rule.required().min(3).max(80)
    }),
    defineField({
      name: 'description',
      title: 'Kurzbeschreibung',
      type: 'text',
      rows: 2
    }),
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
      type: 'string',
      description: 'Wird automatisch aus dem Titel übernommen und kann bei Bedarf angepasst werden.',
      components: { input: AltTextInput },
      initialValue: ({ document }) => (document?.title ? String(document.title) : ''),
      validation: (rule) => rule.required().min(3)
    }),
    defineField({
      name: 'category',
      title: 'Kategorie',
      type: 'string',
      options: {
        list: galleryCategoryOptions,
        layout: 'radio'
      },
      description: 'Haupt-Kategorie für Filter & Darstellung (Pflichtfeld).',
      validation: (rule) => rule.required()
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      media: 'image'
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      const readableSubtitle = subtitle ? categoryLabelMap[subtitle] ?? subtitle : undefined;

      return {
        title,
        subtitle: readableSubtitle,
        media
      };
    }
  }
});
