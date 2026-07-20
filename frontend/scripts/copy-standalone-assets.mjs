#!/usr/bin/env node
/** Copy Next.js static assets into the standalone runtime on every platform. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, '.next', 'static');
const dest = path.join(root, '.next', 'standalone', '.next', 'static');

await fs.mkdir(path.dirname(dest), { recursive: true });
await fs.cp(src, dest, { recursive: true, force: true });
console.log(`[copy-standalone-assets] Copied ${src} -> ${dest}`);
