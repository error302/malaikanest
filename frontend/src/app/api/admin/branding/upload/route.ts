import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/branding/upload — accept a single image file and save it
 * under /public/uploads/branding/. Returns the public URL the front-end can
 * paste into the "Logo URL" / "Favicon URL" field.
 *
 * Body: multipart/form-data with one file field (any name).
 */
export async function POST(req: NextRequest) {
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

    const dir = path.join(process.cwd(), 'public', 'uploads', 'branding');
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    const filename = `logo-${Date.now()}.${ext}`;
    const fullPath = path.join(dir, filename);
    const buf = Buffer.from(await f.arrayBuffer());
    await writeFile(fullPath, buf);

    return NextResponse.json({ url: `/uploads/branding/${filename}`, filename, bytes: f.size });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Upload failed' }, { status: 500 });
  }
}
