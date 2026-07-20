import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFile } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads', 'branding');
const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/branding/uploads/[filename] — stream a branding upload (logo/favicon)
 * from the persistent volume. Path-traversal safe.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  // Reject anything that isn't a bare filename (no slashes, no "..").
  if (!/^[A-Za-z0-9._-]+$/.test(filename)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }
  const fullPath = path.join(UPLOAD_DIR, filename);
  // Defense in depth: ensure the resolved path stays inside UPLOAD_DIR.
  if (!fullPath.startsWith(UPLOAD_DIR + path.sep) && fullPath !== UPLOAD_DIR) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  if (!existsSync(fullPath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const buf = await readFile(fullPath);
    const ext = path.extname(filename).toLowerCase();
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': MIME[ext] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Read failed' }, { status: 500 });
  }
}
