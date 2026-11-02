/**
 * Zahn-Grafik für den mitwandernden Hintergrund der Startseite.
 *
 * Das Original (THEURER_ZAHN_30.webp, 1920 × 517 px) läuft unten in Weiß aus.
 * Auf der weißen Fußzeile passt das (zahn-hintergrund-*). Über den
 * hellblauen Verläufen ergäbe der weiße Auslauf aber einen Schleier mit Kante.
 *
 * Dieses Skript rechnet die Grafik in reines Silbergrau (#b5bfc5, Token
 * --c-silver) mit veränderlicher Deckkraft um: Auf Weiß sieht sie aus wie das
 * Original, auf Hellblau läuft sie in Transparenz aus.
 *
 * Aufruf:  node tools/zahn-schwebend.cjs <pfad/zu/THEURER_ZAHN_30.webp>
 * Ergebnis: public/assets/img/zahn-schwebend-1920.{avif,webp}
 * Benötigt "sharp" (npm i sharp).
 */
const path = require('path');
const sharp = require('sharp');

const SRC = process.argv[2];
if (!SRC) {
  console.error('Bitte die Original-Grafik angeben.');
  process.exit(1);
}
const OUT = path.resolve(__dirname, '..', 'public', 'assets', 'img');
const SILVER = [0xb5, 0xbf, 0xc5];
const AVIF = { quality: 52, effort: 6 };
const WEBP = { quality: 80, alphaQuality: 90, effort: 6 };

(async () => {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] / 255;
    // Deckkraft, die Silbergrau braucht, um auf Weiß denselben Ton zu ergeben
    let alpha = 0;
    for (let c = 0; c < 3; c++) alpha += (a * (255 - data[i + c])) / (255 - SILVER[c]);
    alpha = Math.min(1, Math.max(0, alpha / 3));
    out[i] = SILVER[0];
    out[i + 1] = SILVER[1];
    out[i + 2] = SILVER[2];
    out[i + 3] = Math.round(alpha * 255);
  }

  const img = sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize({ width: 1920, withoutEnlargement: true });
  await img.clone().avif(AVIF).toFile(path.join(OUT, 'zahn-schwebend-1920.avif'));
  await img.clone().webp(WEBP).toFile(path.join(OUT, 'zahn-schwebend-1920.webp'));
  console.log(`zahn-schwebend-1920 (Original ${info.width}x${info.height})`);
})();
