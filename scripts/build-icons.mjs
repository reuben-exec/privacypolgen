// scripts/build-icons.mjs
// One-shot script: generates all favicon / icon variants from the brand PNG
// and composes the OG image. Run with `node scripts/build-icons.mjs`.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');

const brandPng = resolve(root, 'icon (2).png');
const brandSvg = resolve(root, 'icon (2).svg');

if (!existsSync(brandPng)) throw new Error(`Missing ${brandPng}`);
if (!existsSync(brandSvg)) throw new Error(`Missing ${brandSvg}`);

const png = readFileSync(brandPng);
const svg = readFileSync(brandSvg, 'utf8');

// ---------- Variants generated from the PNG ----------
const variants = [
  { name: 'favicon-32x32.png',     size: 32,  fit: 'contain', bg: null },
  { name: 'logo.png',              size: 56,  fit: 'contain', bg: null },
  { name: 'apple-touch-icon.png',  size: 180, fit: 'cover',   bg: '#000000' },
];

for (const v of variants) {
  let pipeline = sharp(png).resize(v.size, v.size, { fit: v.fit, kernel: 'lanczos3' });
  if (v.bg) pipeline = pipeline.flatten({ background: v.bg });
  const out = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(resolve(publicDir, v.name), out);
  console.log(`  ✓ ${v.name.padEnd(28)} ${out.length.toString().padStart(7)} bytes (${v.size}x${v.size})`);
}

// ---------- SVG copies (same source — foreignObject SVG) ----------
writeFileSync(resolve(publicDir, 'favicon.svg'), svg);
console.log(`  ✓ favicon.svg${' '.repeat(21)} ${svg.length.toString().padStart(7)} bytes`);
writeFileSync(resolve(publicDir, 'logo.svg'), svg);
console.log(`  ✓ logo.svg${' '.repeat(24)} ${svg.length.toString().padStart(7)} bytes`);

// ---------- OG image: 1200x630, brand + headline on dark gradient ----------
const brandPngBase64 = png.toString('base64');
const ogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#000000"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.18" cy="0.4" r="0.35">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Brand mark (left) -->
  <image x="90" y="165" width="300" height="300"
         xlink:href="data:image/png;base64,${brandPngBase64}"/>

  <!-- Text (right) -->
  <g font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" fill="#ededed">
    <text x="450" y="245" font-size="34" font-weight="500" fill="#888888" letter-spacing="2">PRIVACYPOLGEN</text>
    <text x="450" y="320" font-size="64" font-weight="700" letter-spacing="-1.5">Generate a privacy</text>
    <text x="450" y="395" font-size="64" font-weight="700" letter-spacing="-1.5">policy in 60 seconds.</text>
    <text x="450" y="455" font-size="26" font-weight="400" fill="#888888">Free · No signup · GDPR · CCPA · COPPA</text>
  </g>
</svg>`;

const ogPng = await sharp(Buffer.from(ogSvg)).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(resolve(publicDir, 'og.png'), ogPng);
console.log(`  ✓ og.png${' '.repeat(27)} ${ogPng.length.toString().padStart(7)} bytes (1200x630)`);

console.log('\nDone. Assets written to public/.');
