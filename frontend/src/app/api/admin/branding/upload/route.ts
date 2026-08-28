import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { guardAdminRequest, sanitizeError } from '@/lib/admin-guard';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']);

// Persist uploads under the mounted CMS volume (/app/data) so they survive
// container rebuilds. Served back via /api/branding/uploads/[filename].
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads', 'branding');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/branding/upload — accept a single image file and save it
 * under the persistent uploads directory. Returns a URL the front-end can
 * store as `logo_url` / `favicon_url`.
 *
 * Body: multipart/form-data with one file field (any name).
 */
export async function POST(req: NextRequest) {
  const guard = await guardAdminRequest(req);
  if (guard) return guard;
  try {
    const form = await req.formData();
    const file = form.get('file') ?? form.getAll('files')[0];
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided (use multipart/form-data field "file")' }, { status: 400 });
    }
    const f = file as File;
    if (!ALLOWED.has(f.type)) {
      return NextResponse.json({ error: `Unsupported file type ${f.type}. Use PNG, JPEG, WebP or SVG.` }, { status: 400 });
    }
    if (f.size > MAX_BYTES) {
      return NextResponse.json({ error: `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.` }, { status: 400 });
    }

    const ext = (
      f.name.match(/\.(png|jpe?g|webp|svg)$/i)?.[1] ??
      ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' } as Record<string, string>)[f.type] ??
      'png'
    ).toLowerCase();

    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `logo-${Date.now()}.${ext}`;
    const fullPath = path.join(UPLOAD_DIR, filename);
    const buf = Buffer.from(await f.arrayBuffer());
    await writeFile(fullPath, buf);

    return NextResponse.json({ url: `/api/branding/uploads/${filename}`, filename, bytes: f.size });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e) ?? 'Upload failed' }, { status: 500 });
  }
}
