# Arbeitsweise für dieses Repo

Website der Zahnarztpraxis Theurer (Relaunch von www.zahnarztpraxis-theurer.de).
Statisches HTML/CSS/JS, Web-Root `public/`, kein Build. Details: `README.md`,
Designsystem: `docs/design-system.md`.

## Immer nach Änderungen

1. Prüfen: `python3 tools/check_site.py` (Tags, IDs, Links, Anker, alt-Texte)
2. Committen und auf `main` pushen – **immer auf GitHub und Vercel**.
   Das Repo `grafitecture/zahnartzpraxis_theurer_webseite` ist mit dem
   gleichnamigen Vercel-Projekt (Team „grafitecture“) verbunden: Jeder Push
   auf `main` erzeugt ein Production-Deployment, andere Branches bekommen eine
   Vorschau-URL. Bis zum Domain-Umzug ist alles nur unter der geschützten
   vercel.app-Adresse erreichbar.
3. Nach dem Push den Vercel-Deploy kontrollieren (Status „Ready“), z. B. mit
   dem Vercel-Connector (`list_deployments`, Projekt
   `zahnartzpraxis_theurer_webseite`).

## Konventionen

- Sprache der Seite und der Commits: Deutsch
- Farben, Typo-Skala, Abstände und Breakpoints nur über die Tokens in
  `public/assets/css/main.css` ändern und `docs/design-system.md` mitpflegen
- Sprechzeiten, Feiertage, Praxisurlaub: `public/assets/js/main.js` (HOURS, CLOSURES)
  und die Tabelle `#sprechzeiten` in `public/index.html`
- Karte: `python3 tools/map/build_map.py && python3 tools/inject_map.py`
- Keine externen Dienste, Cookies oder Tracker einbinden (Datenschutz, CSP in `vercel.json`)
- Externe Links immer in neuem Fenster: `target="_blank" rel="noopener"
  aria-describedby="hinweis-neues-fenster"` (der versteckte Hinweistext steht
  direkt nach `<body>` jeder Seite; das Grafitecture-Feld bringt seinen eigenen mit)
- **Grafitecture-Feld** (Lime-Fläche mit Logo, „Marken mit KI.“, Link auf
  `https://www.grafitecture.de/` in neuem Fenster): steht ganz unten in
  Impressum und Datenschutz, als letztes Element von `.prose` direkt vor der
  Fußzeile. Quelle ist das Kit `kit/grafitecture-credit/` (README dort,
  Original in `grafitecture/lannee_webseite`): Markup = Inhalt von
  `snippet.de.html`, CSS = Abschnitt 10 am Ende von `main.css`, beides
  unverändert. Farben (#dafd55, #435960, Weiß) und Größe des Feldes gehören
  der Agentur und sind die **einzige Ausnahme** von „Farben nur über die
  Tokens“; am Feld nichts an das Designsystem der Praxis anpassen.
  Änderungen nur im Kit machen und neu kopieren.
