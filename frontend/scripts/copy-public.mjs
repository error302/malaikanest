#!/usr/bin/env node
/**
 * Copy public/ into .next/standalone/public/ after `next build`.
 *
 * Works on Windows and Linux/macOS.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = path.join(root, 'public');
const dest = path.join(root, '.next', 'standalone', 'public');

async function copyDir(s, d) {
  const entries = await fs.readdir(s, { withFileTypes: true });
  await fs.mkdir(d, { recursive: true });
  for (const entry of entries) {
    const sp = path.join(s, entry.name);
    const dp = path.join(d, entry.name);
    if (entry.isDirectory()) {
      await copyDir(sp, dp);
    } else if (entry.isFile()) {
      await fs.copyFile(sp, dp);
    }
  }
}

try {
  await fs.access(src);
} catch {
  console.warn(`[copy-public] Source not found: ${src}`);
  process.exit(0);
}
try {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await copyDir(src, dest);
  console.log(`[copy-public] Copied ${src} -> ${dest}`);
} catch (err) {
  console.error('[copy-public] Failed:', err);
  process.exit(1);
}
