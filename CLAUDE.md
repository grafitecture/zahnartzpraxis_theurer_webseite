# Arbeitsweise für dieses Repo

Website der Zahnarztpraxis Theurer (Relaunch von www.zahnarztpraxis-theurer.de).
Statisches HTML/CSS/JS, Web-Root `public/`, kein Build. Details: `README.md`,
Designsystem: `docs/design-system.md`.

## Immer nach Änderungen

1. Prüfen: `python3 tools/check_site.py` (Tags, IDs, Links, Anker, alt-Texte)
2. Committen und auf `main` pushen – **immer auf GitHub und Vercel**.
   Sobald das Vercel-Projekt mit diesem Repo verbunden ist (Team „grafitecture“,
   Projekt `zahnartzpraxis_theurer_webseite`; Stand 27.10.2026 noch mit einem
   Vorlagen-Repo statt mit diesem verbunden), geht jeder Push auf `main`
   automatisch live, andere Branches bekommen eine Vorschau-URL.
3. Nach dem Push den Vercel-Deploy kontrollieren (Status „Ready“).

## Konventionen

- Sprache der Seite und der Commits: Deutsch
- Farben, Typo-Skala, Abstände und Breakpoints nur über die Tokens in
  `public/assets/css/main.css` ändern und `docs/design-system.md` mitpflegen
- Sprechzeiten, Feiertage, Praxisurlaub: `public/assets/js/main.js` (HOURS, CLOSURES)
  und die Tabelle `#sprechzeiten` in `public/index.html`
- Karte: `python3 tools/map/build_map.py && python3 tools/inject_map.py`
- Keine externen Dienste, Cookies oder Tracker einbinden (Datenschutz, CSP in `vercel.json`)
