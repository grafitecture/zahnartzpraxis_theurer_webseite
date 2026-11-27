/**
 * Instagram-Kacheln auf der Startseite (Abschnitt #instagram, DE und EN).
 *
 * Datenschutz: Die Kacheln sind Bilder von unserem eigenen Server und normale
 * Links. Beim Aufruf der Website wird keine Verbindung zu Instagram/Meta
 * aufgebaut, kein Einbettungscode, kein Skript, kein Cookie. Erst ein Klick
 * öffnet Instagram in einem neuen Fenster.
 *
 * Aufruf:  node tools/instagram.cjs <ordner-mit-titelbildern>
 *   - liest tools/instagram/beitraege.json (Reihenfolge = Instagram-Raster)
 *   - schneidet jedes Titelbild auf 3:4 (wie das Profilraster von Instagram):
 *     Beitrag 1080 × 1350 → Mitte 1012 × 1350, Reel-Cover 1080 × 1920 → Mitte 1080 × 1440
 *   - schreibt AVIF + WebP in 360 und 720 px Breite nach public/assets/img/instagram/
 *   - setzt die Kacheln zwischen <!-- instagram:start --> und <!-- instagram:end -->
 *     in public/index.html und public/en/index.html ein
 *   - Beiträge, deren Titelbild nicht im Ordner liegt, werden übersprungen; ihre
 *     vorhandenen Kachelbilder bleiben. So reicht es, nur neue Titelbilder in den
 *     Ordner zu legen.
 * Ohne Ordner-Argument werden nur die Kacheln (HTML) neu gesetzt, z. B. nachdem
 * in beitraege.json die Links auf die einzelnen Beiträge eingetragen wurden.
 * typ: "karussell" (Symbol mehrere Bilder), "reel" (Symbol Video) oder "bild"
 * (Einzelbild, ohne Symbol – wie im Profilraster von Instagram).
 * Benötigt "sharp" (npm i sharp).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'instagram', 'beitraege.json'), 'utf8'));
const OUT = path.join(ROOT, 'public', 'assets', 'img', 'instagram');
const SRC = process.argv[2];
const WIDTHS = [360, 720];
const SIZES = '(min-width: 80em) 16rem, (min-width: 64em) 20vw, 31vw';

const T = {
  de: { types: { karussell: 'Instagram-Beitrag mit mehreren Bildern', reel: 'Instagram-Reel (Video)', bild: 'Instagram-Beitrag' }, pre: '' },
  en: { types: { karussell: 'Instagram post with several images', reel: 'Instagram reel (video)', bild: 'Instagram post' }, pre: '../' },
};

async function images() {
  const sharp = require('sharp');
  fs.mkdirSync(OUT, { recursive: true });
  for (const b of DATA.beitraege) {
    const input = path.join(SRC, b.datei);
    if (!fs.existsSync(input)) { console.log(`${b.slug}: kein Titelbild im Ordner, Kachelbilder bleiben`); continue; }
    const { width, height } = await sharp(input).metadata();
    // 3:4-Ausschnitt aus der Mitte (wie das Profilraster)
    let w = width, h = Math.round(width * 4 / 3);
    if (h > height) { h = height; w = Math.round(height * 3 / 4); }
    const left = Math.round((width - w) / 2), top = Math.round((height - h) / 2);
    for (const tw of WIDTHS) {
      const img = sharp(input).extract({ left, top, width: w, height: h }).resize({ width: tw }).flatten({ background: '#ffffff' });
      await img.clone().avif({ quality: 55, effort: 6 }).toFile(path.join(OUT, `${b.slug}-${tw}.avif`));
      await img.clone().webp({ quality: 82, effort: 6 }).toFile(path.join(OUT, `${b.slug}-${tw}.webp`));
    }
    console.log(`${b.slug}: ${width}×${height} → 3:4 (${w}×${h}), ${WIDTHS.join(' / ')} px`);
  }
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tiles(lang) {
  const { types, pre } = T[lang];
  const img = (slug, ext) => WIDTHS.map(w => `${pre}assets/img/instagram/${slug}-${w}.${ext} ${w}w`).join(', ');
  return DATA.beitraege.map(b => {
    const t = b[lang];
    const href = b.url || DATA.profil;
    const icon = b.typ === 'reel' ? 'i-reel' : 'i-stack';
    const badge = b.typ === 'bild'
      ? `<span class="visually-hidden">${types.bild}</span>`
      : `<span class="insta__badge"><svg class="icon" aria-hidden="true"><use href="#${icon}"/></svg><span class="visually-hidden">${types[b.typ]}</span></span>`;
    return `            <li>
              <a class="insta__tile" href="${esc(href)}" target="_blank" rel="noopener" aria-describedby="hinweis-neues-fenster">
                <picture>
                  <source type="image/avif" srcset="${img(b.slug, 'avif')}" sizes="${SIZES}">
                  <img src="${pre}assets/img/instagram/${b.slug}-360.webp" srcset="${img(b.slug, 'webp')}" sizes="${SIZES}" width="720" height="960" loading="lazy" decoding="async" alt="${esc(t.alt)}">
                </picture>
                ${badge}
                <span class="insta__cap" aria-hidden="true">${esc(t.titel)}</span>
              </a>
            </li>`;
  }).join('\n');
}

function inject() {
  for (const [lang, file] of [['de', 'public/index.html'], ['en', 'public/en/index.html']]) {
    const p = path.join(ROOT, file);
    const html = fs.readFileSync(p, 'utf8');
    const re = /(<!-- instagram:start -->)[\s\S]*?(<!-- instagram:end -->)/;
    if (!re.test(html)) throw new Error(`Marker fehlen in ${file}`);
    fs.writeFileSync(p, html.replace(re, `$1\n${tiles(lang)}\n$2`));
    console.log(`Kacheln gesetzt: ${file}`);
  }
}

(async () => {
  if (SRC) await images();
  inject();
})().catch(e => { console.error(e); process.exit(1); });
