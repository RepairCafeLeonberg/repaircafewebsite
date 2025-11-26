# Optimierungsvorschläge für die Repair Café Webseite

Basierend auf der Analyse der Webseite und des Codes (`Header.astro`, `Footer.astro`) habe ich folgende Optimierungsvorschläge erarbeitet. Ziel ist es, die Seite übersichtlicher und benutzerfreundlicher zu gestalten – besonders für die Zielgruppe der Senioren.

## 1. Navigation aufräumen (Das Wichtigste!)

Aktuell gibt es **9 Menüpunkte** im Header. Das ist zu viel und wirkt überladen.
*Aktuell:* Termine | Reparaturen | So läuft's | Ort & Anfahrt | Über uns | Aktuelles | Gästebuch | Log in | Kontakt

### Empfohlene neue Struktur (5-6 Punkte):

1.  **Termine** (Das Wichtigste, muss bleiben)
2.  **Ablauf & Reparaturen** (Zusammenfassen! Wer wissen will, *was* repariert wird, will meist auch wissen, *wie* es abläuft.)
3.  **Aktuelles** (Berichte & Neuigkeiten)
4.  **Über uns** (Team, Verein)
5.  **Kontakt** (Hier gehört auch "Ort & Anfahrt" hin – das ist Standard.)

### Wohin mit dem Rest?
*   **Log in:** Das brauchen nur interne Mitglieder. Das sollte nicht prominent im Hauptmenü stehen. **Vorschlag:** Verschieben in den Footer (ganz unten) als kleiner Link "Interner Bereich".
*   **Gästebuch:** Ein schönes Feature, aber nicht entscheidend für den Besuch. **Vorschlag:** In den Footer oder als Unterpunkt auf der Startseite verlinken.
*   **Ort & Anfahrt:** In den Menüpunkt "Kontakt" integrieren.

---

## 2. Visuelle Hierarchie & Design

*   **Schriftgröße:** Im Code ist die Navigation auf `text-sm` (klein) eingestellt. Für Senioren wäre `text-base` (Standardgröße) oder sogar `text-lg` (groß) besser lesbar.
*   **Buttons:** Der "Kontakt"-Button ist gut hervorgehoben. Wenn wir das Menü aufräumen, sticht er noch besser hervor.
*   **"Log in" Button:** Aktuell ist er sehr präsent (Outline-Button). Das lenkt normale Besucher ab. Wie oben erwähnt: Ab in den Footer damit.

## 3. Mobile Ansicht

*   Das "Hamburger-Menü" ist gut umgesetzt. Durch die Reduzierung der Menüpunkte wird es aber auch auf dem Handy viel übersichtlicher, da man nicht scrollen muss, um alle Punkte zu sehen.

## 4. Zusammenfassung der Änderungen

Hier ist ein direkter Vergleich, wie das Menü aussehen könnte:

**Vorher:**
`Termine` `Reparaturen` `So läuft's` `Ort & Anfahrt` `Über uns` `Aktuelles` `Gästebuch` `[Log in]` `[Kontakt]`

**Nachher (Vorschlag):**
`Termine` `Ablauf & Reparaturen` `Aktuelles` `Über uns` `[Kontakt]`

*(Die anderen Punkte finden sich dann logisch sortiert im Footer oder auf den Unterseiten wieder.)*

---

## Nächste Schritte

Soll ich diese Änderungen für dich umsetzen? Ich würde:
1.  Die `Header.astro` Datei anpassen.
2.  Den "Log in" Link in den `Footer.astro` verschieben.
3.  Die Schriftgröße im Menü leicht erhöhen.
