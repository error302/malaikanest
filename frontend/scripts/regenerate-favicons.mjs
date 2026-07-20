// Regenerate all favicon variants from a single source PNG.
// Run via `node scripts/regenerate-favicons.mjs`.

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const publicDir = path.join(root, 'public');
const sourcePath = path.join(publicDir, 'favicon-source-original.png');

const variants = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
  { size: 150, name: 'mstile-150x150.png' },
];

try {
  await fs.access(sourcePath);
} catch {
  console.error(`[favicons] Source not found: ${sourcePath}`);
  console.error('Place your source PNG at frontend/public/favicon-source-original.png');
  process.exit(1);
}

const sourceBuf = await fs.readFile(sourcePath);

for (const v of variants) {
  const outPath = path.join(publicDir, v.name);
  await sharp(sourceBuf).resize(v.size, v.size, { fit: 'cover' }).png({ quality: 95, compressionLevel: 9 }).toFile(outPath);
  const stat = await fs.stat(outPath);
  console.log(`[favicons] ${v.name.padEnd(28)} ${v.size}x${v.size}  ${(stat.size / 1024).toFixed(1)} KB`);
}

// Multi-resolution favicon.ico (browsers expect ICO format with multiple sizes).
const icoBuffers = [];
const icoSizes = [16, 32, 48];
for (const sz of icoSizes) {
  const png = await sharp(sourceBuf).resize(sz, sz, { fit: 'cover' }).png().toBuffer();
  icoBuffers.push({ size: sz, png });
}

const headerSize = 6 + icoBuffers.length * 16;
let offset = headerSize;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoBuffers.length, 4);

const entries = [];
const datas = [];
for (const item of icoBuffers) {
  const e = Buffer.alloc(16);
  e.writeUInt8(item.size === 256 ? 0 : item.size, 0);
  e.writeUInt8(item.size === 256 ? 0 : item.size, 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(item.png.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += item.png.length;
  entries.push(e);
  datas.push(item.png);
}

const ico = Buffer.concat([header, ...entries, ...datas]);
await fs.writeFile(path.join(publicDir, 'favicon.ico'), ico);

const icoStat = await fs.stat(path.join(publicDir, 'favicon.ico'));
console.log(`[favicons] favicon.ico                  multi-res  ${(icoStat.size / 1024).toFixed(1)} KB`);

// Also regenerate the og:image and social variants from this new source.
await sharp(sourceBuf).resize(1200, 630, { fit: 'contain', background: { r: 253, g: 248, b: 243, alpha: 1 } }).png({ quality: 80, compressionLevel: 9 }).toFile(path.join(publicDir, 'logo-og.png'));
await sharp(sourceBuf).resize(512, 512, { fit: 'contain', background: { r: 253, g: 248, b: 243, alpha: 1 } }).png({ quality: 85, compressionLevel: 9 }).toFile(path.join(publicDir, 'logo-social.png'));
const ogStat = await fs.stat(path.join(publicDir, 'logo-og.png'));
console.log(`[favicons] logo-og.png                  1200x630   ${(ogStat.size / 1024).toFixed(1)} KB`);

console.log('[favicons] Done. Run scripts/copy-public.mjs to ship them to the standalone bundle.');
