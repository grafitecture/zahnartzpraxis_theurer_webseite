# Zahnarztpraxis Theurer – Website

Neue Website der Zahnarztpraxis Désirée Theurer, Schützenstraße 2, 21726 Oldendorf
(Relaunch von www.zahnarztpraxis-theurer.de).

Statisches HTML, CSS und JavaScript ohne Framework und ohne Build-Schritt.
Keine Cookies, keine externen Dienste, keine Einwilligungsabfrage nötig.

## Aufbau

```
public/                    Web-Root (wird von Vercel ausgeliefert)
  index.html               Startseite (One-Pager)
  impressum/index.html     Impressum
  datenschutz/index.html   Datenschutzerklärung
  404.html                 Fehlerseite
  assets/css/main.css      Gesamtes Styling inkl. Design-Tokens
  assets/js/main.js        Navigation, Sprechzeiten-Status, Feiertage
  assets/img/              Optimierte Bilder (AVIF + WebP)
  assets/fonts/            Selbst gehostete Schriften
docs/design-system.md      Farben, Typo-Skala, Abstände, Breakpoints
tools/                     Werkzeuge für Bilder, Karte und Prüfung (nicht online)
vercel.json                Auslieferung, Sicherheits-Header, Caching
```

Seitenaufbau der Startseite: Kopfzeile · Hero mit Live-Status · Auf einen Blick
(Adresse, heutige Zeiten, Parken, Bus) · Frau Theurer · Leistungen und
Kompetenz · Team · Praxisräume · Anfahrt mit Karte · Kontakt und Sprechzeiten ·
Fußzeile. Auf dem Smartphone gibt es zusätzlich eine feste Leiste mit
„Anrufen“, „WhatsApp“ und „Anfahrt“.

## Lokal ansehen

```bash
cd public && python3 -m http.server 8000
# http://localhost:8000
```

## Deployment

GitHub → Vercel. In Vercel das Repository importieren; `vercel.json` setzt
`public/` als Ausgabeordner, es gibt keinen Build. Jeder Push auf `main`
geht live, jeder andere Branch bekommt eine Vorschau-URL.

Vor dem Livegang: Domain `www.zahnarztpraxis-theurer.de` in Vercel hinzufügen
und die DNS-Einträge beim bisherigen Anbieter umstellen.

## Pflege

**Sprechzeiten, Feiertage, Urlaub** – `public/assets/js/main.js`, ganz oben:

- `HOURS`: Zeiten je Wochentag. Die Tabelle in `index.html` (`#sprechzeiten`)
  bei Änderungen ebenfalls anpassen.
- `CLOSURES`: Praxisurlaub und Brückentage, z. B.
  `{ from: '2026-12-24', to: '2027-01-01', label: 'Praxisurlaub' }`.
  Der Status („Jetzt geöffnet“, „Mittagspause“ …) berücksichtigt das
  automatisch, ebenso alle gesetzlichen Feiertage in Niedersachsen.

**Team** – in `index.html` je Person ein `<li class="member">`. Neue Porträts
freigestellt (PNG/WebP mit Transparenz) in `tools/images.cjs` eintragen und
neu erzeugen.

**Bilder** – `node tools/images.cjs <ordner-mit-originalen>` (benötigt `sharp`).
Die Originale der alten Website liegen im Branch `legacy-import`.

**Karte** – `python3 tools/map/build_map.py && python3 tools/inject_map.py`.
Die Karte wird aus OpenStreetMap-Daten (`tools/map/osm-umgebung.json`) selbst
gezeichnet und direkt in die Seite eingebettet.

**Prüfen** – `python3 tools/check_site.py` (Tags, IDs, Links, Anker, alt-Texte).

## Schrift: Corporate S

Hausschrift ist Corporate S. Sie wird in dieser Reihenfolge gesucht:

1. `Corporate S Web` – lizenzierte Webfonts (noch nicht hinterlegt)
2. lokal installierte Corporate S (z. B. auf den Agentur-Macs in Chrome/Firefox)
3. Source Sans 3 (OFL), selbst gehostet, als Ersatz für alle anderen

Für den Livegang wird eine **Webfont-Lizenz** für Corporate S benötigt
(Anbieter z. B. URW Type Foundry bzw. Berthold). Dann:

1. WOFF2-Dateien nach `public/assets/fonts/corporate-s/` legen
   (`CorporateS-Light.woff2`, `-Regular`, `-Medium`, `-Demi`, `-Bold`)
2. In `main.css` den auskommentierten `@font-face`-Block „Corporate S Web“ aktivieren
3. Optional: `<link rel="preload">` in den HTML-Köpfen auf die Corporate-S-Datei umstellen

## Vor dem Livegang klären

- Corporate-S-Webfontlizenz (siehe oben)
- Datenschutzerklärung: auf Vercel-Hosting, WhatsApp und den Wegfall von
  Kontaktformular, Google Maps und Cookie-Banner angepasst – bitte von der
  Praxis bzw. ihrem Datenschutzbeauftragten prüfen lassen, inkl.
  Auftragsverarbeitungsvertrag für das Hosting
- Impressum: „§ 5 TMG“ wurde auf „§ 5 DDG“ aktualisiert; die Faxnummer
  lautete dort 04144 673, auf der übrigen Seite 04144 6730 – verwendet ist 6730
- Bushaltestelle: laut Fahrplan- und Kartendaten „Lämmerhof“ (alte Seite:
  „Lämmershof“); Fußweg laut Karte rund 200 m bzw. etwa 3 Minuten
- Fachgesellschaften (DGZMK, DGKiZ, DG PARO, DGOI, APW): Mitgliedschaften bestätigen
- Kontaktformular der alten Seite entfällt bewusst (Telefon, WhatsApp, E-Mail);
  bei Bedarf als Vercel-Funktion nachrüstbar

## Herkunft der Inhalte

Texte, Bilder und Rechtstexte stammen von der bisherigen Website
(Branch `legacy-import`, per GitHub Action gesichert). Kartendaten:
© OpenStreetMap-Mitwirkende, ODbL (Branch `osm-import`).
