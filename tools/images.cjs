/**
 * Bild-Pipeline: erzeugt aus den Originalen der alten Website optimierte
 * AVIF/WebP-Varianten in public/assets/img/.
 *
 * Aufruf:  node tools/images.cjs <ordner-mit-originalen>
 * Die Originale liegen im Branch "legacy-import" unter legacy/media/.
 * Benötigt "sharp" (npm i sharp).
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = process.argv[2];
if (!SRC) {
  console.error('Bitte den Ordner mit den Originalbildern angeben.');
  process.exit(1);
}
const OUT = path.resolve(__dirname, '..', 'public', 'assets', 'img');
fs.mkdirSync(OUT, { recursive: true });

const AVIF = { quality: 52, effort: 6 };
const WEBP = { quality: 80, effort: 6 };

/** Schreibt AVIF + WebP in mehreren Breiten. */
async function variants(input, name, widths, { alpha = false } = {}) {
  const meta = await sharp(input).metadata();
  const out = [];
  for (const w of widths) {
    const width = Math.min(w, meta.width);
    let img = sharp(input).resize({ width, withoutEnlargement: true });
    if (!alpha) img = img.flatten({ background: '#ffffff' });
    await img.clone().avif(AVIF).toFile(path.join(OUT, `${name}-${width}.avif`));
    await img.clone().webp({ ...WEBP, alphaQuality: 90 }).toFile(path.join(OUT, `${name}-${width}.webp`));
    out.push(width);
  }
  const h = Math.round((meta.height / meta.width) * Math.max(...out));
  console.log(`${name}: ${out.join(', ')} px (Seitenverhältnis ${meta.width}x${meta.height}, max-Höhe ${h})`);
}

/** Schneidet ein freigestelltes Brustbild auf ein einheitliches 3:4-Format mit Kopfraum. */
async function portraitTile(file) {
  const input = path.join(SRC, file);
  const img = sharp(input);
  const { width, height } = await img.metadata();
  const { info } = await sharp(input).extractChannel('alpha').threshold(10).trim().toBuffer({ resolveWithObject: true });
  // info.trimOffsetLeft ist negativ: Abstand der Person vom linken Rand
  const left = -info.trimOffsetLeft;
  const center = left + info.width / 2;
  const cropW = Math.round(height * 0.8);
  const x = Math.max(0, Math.min(width - cropW, Math.round(center - cropW / 2)));
  const person = await sharp(input).extract({ left: x, top: 0, width: cropW, height }).toBuffer();
  const canvasH = Math.round(cropW / 0.75);
  return sharp({
    create: { width: cropW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: person, top: canvasH - height, left: 0 }])
    .png()
    .toBuffer();
}

async function split(file, seam) {
  const input = path.join(SRC, file);
  const { width, height } = await sharp(input).metadata();
  const leftPart = await sharp(input).extract({ left: 0, top: 0, width: seam - 3, height }).toBuffer();
  const rightPart = await sharp(input).extract({ left: seam + 3, top: 0, width: width - seam - 3, height }).toBuffer();
  return [leftPart, rightPart];
}

(async () => {
  // Team und Zahnärztin (freigestellt, mit Transparenz)
  await variants(path.join(SRC, '2026_09_theurer_team_2026.webp'), 'team-2026', [800, 1200, 1600], { alpha: true });
  await variants(path.join(SRC, '2025_11_D_THEURER_2025_3.webp'), 'desiree-theurer', [480, 720, 978], { alpha: true });

  const team = {
    'tina-zielinski': '2025_11_t_zielinsky_2025_1.webp',
    'sarah-lipnicki': '2025_11_s_lipniki_2025.webp',
    'sonja-borchers': '2025_11_s_borchert_2025.webp',
    'carina-roggmann': '2025_11_k_roggmann_2025_1.webp',
    'saskia-heyden': '2025_11_s_heyden_2025_1.webp',
    'jenny-niemoeller': '2025_11_j_niemoeller_2025_1.webp',
    'yvonne-tiedemann': '2026_09_Y_Tiedemann_2026.webp',
  };
  for (const [name, file] of Object.entries(team)) {
    const tile = await portraitTile(file);
    await variants(tile, `team-${name}`, [360, 654], { alpha: true });
  }

  // Praxisräume
  await variants(path.join(SRC, '2025_11_SLIDER_1.webp'), 'praxis-empfang-telefon', [640, 1024, 1600]);
  await variants(path.join(SRC, '2025_11_SLIDER_3.webp'), 'praxis-empfang', [640, 1024, 1600]);
  await variants(path.join(SRC, '2025_11_SLIDER_6.webp'), 'praxis-behandlung', [640, 1024, 1600]);
  const [warte, schild] = await split('2025_11_SLIDER_4.webp', 1043);
  await variants(warte, 'praxis-wartezimmer', [520, 1040]);
  await variants(schild, 'praxis-behandlung-1', [440, 870]);
  const [airflow, stuhl] = await split('2025_11_SLIDER_5.webp', 847);
  await variants(airflow, 'praxis-prophylaxe', [420, 840]);
  await variants(stuhl, 'praxis-stuhl', [540, 1070]);

  // Logo (Transparenz behalten)
  await variants(path.join(SRC, '2023_03_LOGO_ZAHNARZTPRAXIS_THEURER.webp'), 'logo-zahnarztpraxis-theurer', [280, 560, 777], { alpha: true });

  // Fachgesellschaften (Graustufen-Logos)
  const logos = { dgzmk: 'dgzmk', dgkiz: 'dgkm', dgparo: 'gdparo', dgoi: 'dgoi', apw: 'apw' };
  for (const [name, file] of Object.entries(logos)) {
    const input = path.join(SRC, `2023_03_${file}.webp`);
    await sharp(input).trim({ threshold: 4 }).webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(OUT, `fg-${name}.webp`));
  }
  console.log('Fachgesellschaften: fertig');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
