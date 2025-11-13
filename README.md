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

## Sanity-Anbindung

1. `.env.example` nach `.env` kopieren und `SANITY_*`-Werte mit der aktuellen Projekt-ID, Dataset und optionalen Tokens befüllen. Ohne diese Angaben fällt die Seite auf die lokalen Fallback-Daten zurück.
2. Für das Gästebuch wird ein `SANITY_WRITE_TOKEN` benötigt, das in Sanity mit den Rechten `create`/`read` für `guestbookEntry` ausgestattet ist.
3. Nach Änderungen in Sanity (neues Projekt oder Dataset) muss die Seite neu gebaut/deployed werden (`npm run build` bzw. Vercel-Deploy), damit die Serverless-Funktionen die neuen Variablen laden.
4. Im Sanity-Projekt unter **API → CORS Origins** sowohl `localhost` (für lokale Entwicklung) als auch die produktive Domain eintragen, damit die Vercel-Funktionen Daten lesen/schreiben dürfen.

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
