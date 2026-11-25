# Zahnarztpraxis Theurer – Website

Neue Website der Zahnarztpraxis Désirée Theurer, Schützenstraße 2, 21726 Oldendorf
(Relaunch von www.zahnarztpraxis-theurer.de).

Statisches HTML, CSS und JavaScript ohne Framework und ohne Build-Schritt.
Keine Cookies, keine externen Dienste, keine Einwilligungsabfrage nötig.
Zweisprachig: Deutsch unter `/`, Englisch unter `/en/`.

## Aufbau

```
public/                    Web-Root (wird von Vercel ausgeliefert)
  index.html               Startseite (One-Pager)
  impressum/index.html     Impressum
  datenschutz/index.html   Datenschutzerklärung
  en/index.html            Startseite Englisch
  en/legal-notice/         Impressum Englisch (Übersetzung, deutsche Fassung verbindlich)
  en/privacy/              Datenschutzerklärung Englisch (dto.)
  404.html                 Fehlerseite (Deutsch mit englischem Block, für beide Sprachen)
  assets/css/main.css      Gesamtes Styling inkl. Design-Tokens
  assets/js/main.js        Navigation, Sprechzeiten-Status, Feiertage
  assets/img/              Optimierte Bilder (AVIF + WebP)
  assets/fonts/            Selbst gehostete Schriften
docs/design-system.md      Farben, Typo-Skala, Abstände, Breakpoints
kit/grafitecture-credit/   Grafitecture-Feld für Impressum und Datenschutz (Kit, nicht online)
tools/                     Werkzeuge für Bilder, Karte und Prüfung (nicht online)
vercel.json                Auslieferung, Sicherheits-Header, Caching
```

Seitenaufbau der Startseite: Kopfzeile · Hero (Überschrift, Einleitung,
Teamfoto und drei Call to Actions Telefon / WhatsApp / Anfahrt; zusammen mit
der Kopfzeile genau ein Bildschirm hoch) · Auf einen Blick
(Adresse, heutige Zeiten, Parken, Bus) · Frau Theurer · Leistungen und
Kompetenz · Team · Praxisräume · Anfahrt mit Karte · Kontakt und Sprechzeiten ·
Fußzeile. Mobil und auf dem Tablet (unter 1024 px) sind die Call to Actions
die Buttons der festen Leiste unten („Anrufen“, „WhatsApp“, „Anfahrt“, immer
sichtbar). Am Desktop stehen sie als Dreierblock (Telefon mit Live-Status,
WhatsApp, Anfahrt) im Hero; der Telefon-Button der Kopfzeile erscheint erst,
wenn der Dreierblock aus dem Bild scrollt, damit die Nummer nie doppelt zu
sehen ist.

## Zwei Sprachen

| Deutsch | Englisch |
| --- | --- |
| `/` | `/en/` |
| `/impressum/` | `/en/legal-notice/` |
| `/datenschutz/` | `/en/privacy/` |

- **Sprachumschalter:** In der Kopfzeile jeder Seite steht direkt nach dem
  Logo ein leiser Link auf die andere Sprache („EN“ bzw. „DE“ mit Globus),
  in der Fußzeile zusätzlich „English“ bzw. „Deutsch“. Er führt immer auf
  das Gegenstück der aktuellen Seite. Auf der Startseite nimmt `main.js`
  den Abschnitt mit (z. B. `/#anfahrt` → `/en/#directions`, Zuordnung in
  `ANCHORS`). Keine automatische Weiterleitung nach Browsersprache, nichts
  wird gespeichert.
- **Anker auf Englisch:** `#dentist`, `#services`, `#team`, `#careers`,
  `#practice`, `#directions`, `#contact`, `#hours`. Der versteckte Hinweis
  für externe Links heißt auf allen Seiten `#hinweis-neues-fenster`
  (Text auf Englisch „opens in a new window“).
- **Telefonnummern** stehen auf den englischen Seiten international
  (+49 4144 6639, +49 151 420 82774, Fax +49 4144 6730).
- **Rechtstexte:** Die englischen Fassungen sind Übersetzungen; ein Hinweis
  oben verweist auf die verbindliche deutsche Fassung. Wer Impressum oder
  Datenschutzerklärung ändert, ändert beide Sprachen.
- **SEO:** Jede Seite nennt ihr Gegenstück per `hreflang` (x-default =
  Deutsch), die `sitemap.xml` ebenso.
- `tools/check_site.py` prüft zusätzlich: `<html lang>` passend zum Ordner,
  `hreflang`-Paare in beide Richtungen, Sprachumschalter vorhanden.

## Lokal ansehen

```bash
cd public && python3 -m http.server 8000
# http://localhost:8000
```

## Deployment

GitHub → Vercel. Repo `grafitecture/zahnartzpraxis_theurer_webseite` und
Vercel-Projekt `zahnartzpraxis_theurer_webseite` (Team Grafitecture) sind
verbunden; `vercel.json` setzt `public/` als Ausgabeordner, es gibt keinen
Build. Jeder Push auf `main` geht als Production-Deployment raus, jeder andere
Branch bekommt eine Vorschau-URL. Bis zum Domain-Umzug sind alle Deployments
nur für Team-Mitglieder sichtbar (Vercel Authentication).

Das frühere Repo `grafitecture/zahnartzpraxis_theurer` gibt es nicht mehr;
seine Historie ist in `main` zusammengeführt.

### Vercel datenschutzkonform einrichten

Die Datenschutzerklärung (`public/datenschutz/`) beschreibt genau dieses
Setup. Wer daran etwas ändert, passt sie mit an.

- **Tarif Pro (oder Enterprise).** Hobby ist laut Vercel nur für private,
  nicht-kommerzielle Nutzung erlaubt, und der Auftragsverarbeitungsvertrag
  ([Data Processing Addendum](https://vercel.com/legal/dpa), mit
  EU-Standardvertragsklauseln) gilt nur für Pro und Enterprise.
- **Auftragsverarbeitung:** Liegt das Projekt im Vercel-Team von
  grafitecture, braucht es zusätzlich einen AVV zwischen Praxis und
  grafitecture, mit Vercel als Unterauftragsverarbeiter. Alternative: ein
  eigenes Pro-Team der Praxis.
- **Observability Plus** ist für Teams, die ab dem 3. April 2026 auf Pro
  gewechselt sind, automatisch an. Dieses Projekt unter Billing →
  Observability Plus → Manage projects ausschließen (oder Plus ganz
  ausschalten). Sonst bleiben Protokolle 30 statt 1 Tag gespeichert, und die
  Angabe in der Datenschutzerklärung stimmt nicht mehr.
- **Ausgeschaltet lassen:** Web Analytics, Speed Insights und Log Drains.
- **Funktionsregion `fra1`** (Frankfurt) ist in `vercel.json` gesetzt. Sie
  gilt nur für Vercel Functions, die Seite hat derzeit keine; statische
  Dateien liefert das weltweite CDN aus.
- **Vorschau-Deployments** geschützt lassen (Deployment Protection, Standard).
- **Attack Mode** nur bei einem Angriff einschalten (Sicherheitsabfrage, siehe
  Datenschutzerklärung, Abschnitt 2).

### Domain

Die Domain wurde im August 2025 von comvos zu IONOS umgezogen. Für den
Livegang `www.zahnarztpraxis-theurer.de` (und die Domain ohne `www`) in Vercel
hinzufügen und bei IONOS nur die Einträge für die Website auf die Werte
umstellen, die Vercel unter „Domains“ anzeigt. MX- und andere
E-Mail-Einträge nicht ändern, sonst kommt keine E-Mail mehr an.

## Pflege

**Texte immer in beiden Sprachen ändern:** `index.html` und
`en/index.html` haben dasselbe Markup; nur Texte, Anker und Pfade
(`../assets/…`) unterscheiden sich.

**Sprechzeiten, Feiertage, Urlaub** – `public/assets/js/main.js`, ganz oben:

- `HOURS`: Zeiten je Wochentag. Die Tabellen in `index.html` (`#sprechzeiten`)
  und `en/index.html` (`#hours`) bei Änderungen ebenfalls anpassen.
- `CLOSURES`: Praxisurlaub und Brückentage, z. B.
  `{ from: '2026-12-24', to: '2027-01-01', label: 'Praxisurlaub', labelEn: 'Practice holiday' }`.
  Der Status („Jetzt geöffnet“, „Mittagspause“ …) berücksichtigt das
  automatisch, ebenso alle gesetzlichen Feiertage in Niedersachsen.
  Alle Status-Texte stehen zweisprachig in `TEXT`; welche gilt, entscheidet
  `<html lang>`.

**Team** – in `index.html` und `en/index.html` je Person ein
`<li class="member">`. Neue Porträts freigestellt (PNG/WebP mit Transparenz)
in `tools/images.cjs` eintragen und neu erzeugen.

**Bilder** – `node tools/images.cjs <ordner-mit-originalen>` (benötigt `sharp`).
Die Originale der alten Website liegen im Branch `legacy-import`.

**Zahn-Grafik (mitwandernd)** – `node tools/zahn-schwebend.cjs THEURER_ZAHN_30.webp`
erzeugt `zahn-schwebend-1920` (Silbergrau mit Transparenz, ohne weißen Auslauf).
Wie stark sie beim Scrollen ausblendet, steuert `TOOTH_FADE` in `main.js`.

**Karte** – `python3 tools/map/build_map.py && python3 tools/inject_map.py`.
Die Karte wird aus OpenStreetMap-Daten (`tools/map/osm-umgebung.json`) selbst
gezeichnet und direkt in beide Startseiten eingebettet; `inject_map.py`
übersetzt dabei Titel, Beschreibung und Beschriftungen für `en/index.html`
(Straßennamen bleiben deutsch). Neue Beschriftungen in `MAP_EN` ergänzen.

**Prüfen** – `python3 tools/check_site.py` (Tags, IDs, Links, Anker, alt-Texte,
Sprachfassungen).

**Grafitecture-Feld** – ganz unten in Impressum und Datenschutz steht das
Feld der Agentur (Lime-Fläche, Logo, „Marken mit KI.“, Link auf
https://www.grafitecture.de/ in neuem Fenster). Es kommt unverändert aus dem
Kit `kit/grafitecture-credit/` (Kit v1.2, Original im Repo
`grafitecture/lannee_webseite`): das Markup ist der Inhalt von
`snippet.de.html` bzw. auf den englischen Seiten `snippet.en.html`
(letztes Element von `.prose`), das CSS ist als Abschnitt 10
an `public/assets/css/main.css` angehängt. **Ausnahme vom Designsystem:**
Farben (#dafd55, #435960, Weiß) und Größe des Feldes gehören Grafitecture und
folgen nicht den Tokens der Praxis. Nichts daran anpassen; bei einer neuen
Kit-Version Ordner, Schnipsel und CSS neu übernehmen.

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
- Datenschutzerklärung (Stand Oktober 2026, eigener Text statt der
  e-recht24-Vorlage von comvos): Vercel-Pro-Tarif und AVV-Kette (siehe
  Deployment) vor dem Livegang erledigen und den Text von der Praxis
  freigeben lassen. Falls die Praxis einen Datenschutzbeauftragten benannt
  hat, dessen Kontaktdaten ergänzen.
- E-Mail: `info@` wurde 2023 an ein privates Postfach weitergeleitet. Für
  Patientenanfragen und Bewerbungen ein Praxispostfach bei einem EU-Anbieter
  mit AVV einrichten und die Weiterleitung beenden.
- Die Datenschutzerklärung verweist für die Behandlung auf die
  Patienteninformation zum Datenschutz in der Praxis – die muss es geben.
- WhatsApp: nur mit WhatsApp Business auf einem Praxis-Handy, ohne Zugriff
  auf Patientenkontakte im Adressbuch und ohne Chat-Backup in der Cloud.
- Einwilligungen des Teams für Fotos und Namen auf der Website schriftlich
  vorhalten.
- Impressum (geprüft Oktober 2026): § 5 DDG; Faxnummer 04144 6730 (alte
  Seite: 04144 673, Tippfehler); Approbationsbehörde ist heute der NiZzA;
  Gesetzesnamen auf die amtlichen Titel korrigiert. Offen: Hat die Praxis
  eine Wirtschafts-Identifikationsnummer (W-IdNr, steht im ELSTER-Postfach)
  oder eine USt-IdNr, muss sie ins Impressum. Rechtsform Einzelpraxis
  bestätigen. Berufshaftpflichtversicherung: für Zahnärzte keine Pflicht im
  Impressum (DL-InfoV gilt nicht für Gesundheitsdienstleistungen), kann aber
  ergänzt werden.
- Bushaltestelle: laut Fahrplan- und Kartendaten „Lämmerhof“ (alte Seite:
  „Lämmershof“); Fußweg laut Karte rund 200 m bzw. etwa 3 Minuten
- Fachgesellschaften (DGZMK, DGKiZ, DG PARO, DGOI, APW): Mitgliedschaften bestätigen
- Kontaktformular der alten Seite entfällt bewusst (Telefon, WhatsApp, E-Mail);
  bei Bedarf als Vercel-Funktion nachrüstbar

## Herkunft der Inhalte

Texte und Bilder stammen von der bisherigen Website (Branch `legacy-import`,
per GitHub Action gesichert). Impressum und Datenschutzerklärung wurden im
Oktober 2026 für das Vercel-Hosting neu geschrieben. Kartendaten:
© OpenStreetMap-Mitwirkende, ODbL (Branch `osm-import`).
