# Repair Café Leonberg – Website (Astro + Tailwind)

Eine moderne, schnelle und barrierearme Website für das Repair Café Leonberg, gebaut mit Astro und Tailwind CSS.

## Entwicklung

Voraussetzungen: Node.js 18+ (oder 20+ empfohlen)

```
# Abhängigkeiten installieren
npm install

# Entwicklung starten
npm run dev

# Produktion bauen
npm run build
npm run preview
```

## Inhalte anpassen

- Termine: `src/data/events.ts`
- Startseite: `src/pages/index.astro`
- Impressum: `src/pages/impressum.astro`
- Datenschutz: `src/pages/datenschutz.astro`
- Farben/Design: `tailwind.config.mjs` und `src/styles/global.css`

## Hinweise

- Bilder/Icons können in `public/` abgelegt werden.
- Die Domain/`site`-Angabe kann später in `astro.config.mjs` ergänzt werden (z. B. für Sitemap/OG-URLs).

# repaircafewebsite
