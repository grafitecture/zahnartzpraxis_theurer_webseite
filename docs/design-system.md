# Designsystem – Zahnarztpraxis Theurer

Frisch, modern, viel Weißraum. Weiße Flächen im Wechsel mit Verläufen von
Hellblau zu Weiß, Überschriften in Praxisblau, eine klare Hierarchie über die
Schriftgröße. Alle Werte sind als CSS-Variablen in
`public/assets/css/main.css` (Abschnitt „Tokens“) hinterlegt.

## Farben

| Token | Wert | Rolle | Kontrast auf Weiß |
|---|---|---|---|
| `--c-blue` | `#0087cb` | Praxisblau (Marke): große Schrift ab 24 px, Icons, Telefonnummer, Fokusrahmen | 3,9 : 1 |
| `--c-sky` | `#a3cbeb` | Himmelblau (Marke): Akzentflächen, Hinweislinie | 1,7 : 1 (nur Fläche) |
| `--c-silver` | `#b5bfc5` | Silbergrau (Marke): Linien, Status „geschlossen“ | 1,9 : 1 (nur Linie) |
| `--c-blue-ink` | `#006da3` | Abgeleitet: Links, Buttons, kleine blaue Schrift | 5,6 : 1 |
| `--c-blue-deep` | `#00517a` | Abgeleitet: Hover und aktiv | 8,5 : 1 |
| `--c-grad-top` | `#daeaf7` | Start der Verlaufsflächen (Himmelblau mit 60 % Weiß) | Praxisblau darauf 3,2 : 1 |
| `--c-stage` | `#d6e8f6` | Bühnen hinter freigestellten Fotos (Hero, Zahnärztin) | – |
| `--c-sky-50` | `#edf5fb` | Kacheln hinter den Team-Porträts | – |
| `--c-ink` | `#1a2933` | Auszeichnungen, Rollen, Tabellenköpfe | 14,9 : 1 |
| `--c-text` | `#33434d` | Fließtext | 10,2 : 1 |
| `--c-muted` | `#56646d` | Nebeninformationen | 6,1 : 1 |

Praxisblau `#0087cb` erreicht auf Weiß 3,9 : 1. Das genügt WCAG AA nur für
große Schrift. Für Buttons, Links und kleine blaue Texte gibt es deshalb das
abgeleitete Tiefblau `#006da3` im gleichen Farbton.

**Ausnahme:** Das Grafitecture-Feld ganz unten in Impressum und Datenschutz
behält Farben und Größe der Agentur (Lime `#dafd55`, Schrift `#435960`, Linie
Weiß; höchstens 25,2 rem breit). Es kommt unverändert aus
`kit/grafitecture-credit/` und folgt nicht den Tokens dieser Website.

## Überschriften und Flächen

- **Überschriften blau:** h1–h4 (ab 24 px) in Praxisblau `#0087cb`, kleinere
  Überschriften (h5, h6, Namen, Listentitel) im dunkleren `#006da3`, damit auch
  sie AA erfüllen.
- **Flächen im Wechsel:** Verlauf `--c-grad-top` → Weiß (von oben nach unten),
  dazwischen weiße Abschnitte. Der Hero-Verlauf ist umgedreht (oben Weiß,
  unten Hellblau). Reihenfolge der Startseite: Hero + Auf einen
  Blick (Verlauf) · Frau Theurer (weiß) · Leistungen (Verlauf) · Team (weiß) ·
  Praxis (Verlauf) · Anfahrt (weiß) · Kontakt (Verlauf) · Fußzeile (weiß mit
  Zahn-Grafik). Der Verlaufsstart ist so gewählt, dass Praxisblau darauf noch
  3,2 : 1 erreicht.
- **Unterseiten** (Impressum, Datenschutz, 404): Der Kopf mit der Überschrift
  hat wie der Hero den umgedrehten Verlauf (oben Weiß, unten Hellblau), der
  Text darunter steht auf Weiß.
- **Fußzeile:** Zahn-Grafik (`zahn-hintergrund-1920`) im Hintergrund, oben
  angesetzt, mindestens 60 rem breit.

## Logo und Kopfzeile

- Logo in Kopf- und Fußzeile immer gleich groß: `--logo-h`, fluide von
  4,25 rem (360 px) bis 6 rem (1440 px).
- Die Kopfzeile ist oben transparent und bleibt beim Scrollen immer oben
  angeheftet (dann mit heller, leicht transparenter Fläche und feiner Linie).
  Das Logo schrumpft nie.
- **Telefonnummer nur einmal im Bild:** Auf der Startseite steht die Nummer im
  Dreierblock des Hero. Solange er sichtbar ist, sind der Telefon-Button der
  Kopfzeile (Desktop) und die Schnellkontakt-Leiste (mobil) ausgeblendet; sie
  erscheinen, sobald der Block aus dem Bild scrollt (Button klappt weich auf,
  Leiste fährt von unten herein). Unterseiten zeigen den Telefon-Button immer.
- Navigationspunkte (Kopf- und Fußzeile): 16 px, keine Unterstreichung, kein
  Rahmen. Eine Fläche mit Verlauf (Rundung 2 px) erscheint nur bei
  Mouseover (`#c8e0f3` → `#edf5fb`) und beim aktiven Punkt
  (Himmelblau `#a3cbeb` → `#daeaf7`).

## Schrift

Corporate S (Light 300 für Überschriften, Regular 400 für Text, Demi/Bold für
Auszeichnungen). Ersatzschrift: Source Sans 3, selbst gehostet.

## Typo-Skala: Perfect Fourth (1,333), fluide

Die Werte wachsen stufenlos mit der Fensterbreite (`clamp()`): bei 360 px gilt
eine Minor Third (1,2), ab 1440 px die volle Perfect Fourth. So passen lange
deutsche Wörter wie „Zahngesundheit“ auch auf kleine Displays.

| Stufe | Element | 360 px | ab 1440 px | CSS |
|---|---|---|---|---|
| `--step-6` | h1 | 2,986 rem | 5,61 rem | `clamp(2.986rem, 2.111rem + 3.887vw, 5.61rem)` |
| `--step-5` | h2 | 2,488 rem | 4,209 rem | `clamp(2.488rem, 1.914rem + 2.55vw, 4.209rem)` |
| `--step-4` | h3 | 2,074 rem | 3,157 rem | `clamp(2.074rem, 1.713rem + 1.604vw, 3.157rem)` |
| `--step-3` | h4 | 1,728 rem | 2,369 rem | `clamp(1.728rem, 1.514rem + 0.9496vw, 2.369rem)` |
| `--step-2` | h5 | 1,44 rem | 1,777 rem | `clamp(1.44rem, 1.328rem + 0.4993vw, 1.777rem)` |
| `--step-1` | h6, Lead | 1,2 rem | 1,333 rem | `clamp(1.2rem, 1.156rem + 0.197vw, 1.333rem)` |
| `--step-0` | p | 1 rem | 1 rem | `1rem` |
| `--step-n1` | small | 0,833 rem | 0,75 rem | `clamp(0.75rem, 0.8607rem - 0.123vw, 0.833rem)` |
| `--step-n2` | xs | 0,694 rem | 0,563 rem | `clamp(0.563rem, 0.7377rem - 0.1941vw, 0.694rem)` |

Kleine Stufen werden auf dem Smartphone größer statt kleiner: 12 px sind am
Desktop vertretbar, auf dem Handy für ältere Patienten nicht. `xs` ist
definiert, wird für lesbare Inhalte aber bewusst nicht eingesetzt.

Semantik und Optik sind getrennt: `.t-h1` … `.t-h6` geben jedem Element die
passende Größe, ohne die Überschriften-Hierarchie zu verbiegen.

## Abstände

Gleiche fluide Logik von 360 px bis 1440 px, z. B. `--space-s` 1 → 1,25 rem,
`--space-xl` 3 → 3,75 rem, `--space-3xl` 6 → 7,5 rem (Abstand zwischen
Abschnitten). Seitenrand `--gutter` 1,25 → 2,5 rem.

## Breakpoints

Inhaltsbasiert und in `em`, damit sie mitwachsen, wenn Nutzer die
Schriftgröße im Browser erhöhen.

| Breakpoint | ≈ px | Was passiert | Warum hier |
|---|---|---|---|
| Basis | < 480 | einspaltig, Schnellkontakt-Leiste unten | Smartphones |
| `30em` | 480 | „Auf einen Blick“ zweispaltig | ab hier passen zwei kurze Infoblöcke nebeneinander |
| `48em` | 768 | Text und Bild nebeneinander, Team zweispaltig, Galerie als Raster, Dreierblock nebeneinander | Textspalte erreicht ~ 45 Zeichen neben einem Bild |
| `64em` | 1024 | volle Navigation statt Menü, Schnellkontakt-Leiste entfällt, 12-Spalten-Raster, Team vierspaltig | Logo, fünf Menüpunkte und Telefon-Button passen mit Reserve in eine Zeile (~ 810 von 960 px) |
| `80em` | 1280 | Inhalt erreicht seine Maximalbreite (75 rem), Leistungen vierspaltig | darüber wachsen nur noch die Ränder |
| fluide Skala | 360–1440 | Schrift und Abstände wachsen stufenlos | volle Perfect Fourth auf gängigen Desktop-Breiten |

## Formen und Linien

- Buttons: Pillenform (`--radius-pill`), Mindesthöhe 48 px (Touch)
- Schnellkontakt-Leiste (mobil, < 1024 px): drei gleich breite Buttons
  Anrufen / WhatsApp / Anfahrt, Icon mittig über dem Text, Rundung `--radius-m`,
  Höhe 60 px; „Anrufen“ gefüllt in `--c-blue-ink`, die anderen auf `--c-sky-50`
- Dreierblock im Hero (`.reach`): Telefon / WhatsApp / Anfahrt als drei
  gleich breite, kompakte Kacheln, bewusst zurückhaltend; die ganze Kachel ist
  ein Link. Aufbau: rundes Symbol (2,5 rem), Bezeichnung klein (`--step-n1`),
  Nummer bzw. Adresse in Tiefblau, Demi (`--step-0`, ab 64em `--step-1`),
  Hinweis klein (`--step-n1`). Alle drei weiß mit 1 px Linie
  `--c-chip-line`, Hover Linie `--c-blue-ink` auf `--c-sky-25`, Rundung
  `--radius-m`. Das Telefon ist nur über sein gefülltes Symbol
  (`--c-blue-ink`) hervorgehoben und zeigt den Live-Status der Sprechzeiten.
  Mobil untereinander, ab `48em` nebeneinander.
- Fotos: `--radius-m` (0,875 rem)
- Bühnen hinter freigestellten Porträts: oben `--radius-l` (1,75 rem), unten gerade
- Gliederung über feine Linien (`--c-line`), nicht über Karten mit Schatten
- Hinweisboxen in Rechtstexten (`.callout`): weiße Fläche, 1 px Linie
  `--c-chip-line`, Rundung `--radius-m`

## Bildsprache

Freigestellte Porträts von Frau Theurer und dem Team stehen auf einer
himmelblauen Bühne (`--c-sky-50`); die Köpfe ragen über deren Oberkante.
Praxisfotos hell, ohne Filter. Die Anfahrtskarte ist eine eigene Grafik in den
Hausfarben (Daten: OpenStreetMap).

Teamfoto im Hero: auf dem Smartphone (unter `48em`) randlos direkt unter der
Überschrift, vor dem Einleitungstext; ab `48em` unter Text und Dreierblock.

## Barrierefreiheit

- Textkontraste nach WCAG AA (automatisch geprüft, 0 Fehler)
- sichtbarer Fokusrahmen, Skip-Link, Tastaturbedienung der Navigation
- Bewegungen nur bei `prefers-reduced-motion: no-preference`
- Telefon, WhatsApp und Anfahrt auf dem Handy jederzeit mit einem Tipp erreichbar
  (im Hero über den Dreierblock, sonst über die Schnellkontakt-Leiste)
