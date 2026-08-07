/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS build utility */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = path.resolve(__dirname, '..', 'public', 'logo.svg');
const OUT_DIR = path.resolve(__dirname, '..', 'public');

async function run() {
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
    { name: 'mstile-150x150.png', size: 150 },
  ];

  for (const s of sizes) {
    await sharp(SRC, { density: 384 })
      .resize(s.size, s.size, { fit: 'contain', background: { r: 0x2D, g: 0x2D, b: 0x2D, alpha: 1 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT_DIR, s.name));
    console.log('wrote', s.name);
  }

  // Multi-resolution .ico via toFormat
  await sharp(SRC, { density: 384 })
    .resize(48, 48, { fit: 'contain', background: { r: 0x2D, g: 0x2D, b: 0x2D, alpha: 1 } })
    .png()
    .toFile(path.join(OUT_DIR, 'favicon.ico'));
  console.log('wrote favicon.ico');
}

run().catch((err) => { console.error(err); process.exit(1); });
