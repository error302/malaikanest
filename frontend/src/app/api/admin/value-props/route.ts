import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invalidateSettingsCache } from '@/lib/settings';
import { guardAdminRequest, sanitizeError } from '@/lib/admin-guard';

/**
 * GET /api/admin/value-props — list all value props
 * POST /api/admin/value-props — create a value prop
 */
export async function GET(req: NextRequest) {
  const guard = await guardAdminRequest(req);
  if (guard) return guard;
  try {
    const url = new URL(req.url);
    const take = Math.min(Math.max(parseInt(url.searchParams.get('take') || '50', 10) || 50, 1), 200);
    const skip = Math.max(parseInt(url.searchParams.get('skip') || '0', 10) || 0, 0);
    const [props, total] = await Promise.all([
      db.valueProp.findMany({ orderBy: [{ position: 'asc' }], take, skip }),
      db.valueProp.count(),
    ]);
    return NextResponse.json({ valueProps: props, total, hasMore: skip + take < total });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await guardAdminRequest(req);
  if (guard) return guard;
  try {
    const body = await req.json();
    const created = await db.valueProp.create({
      data: {
        icon: body.icon || 'Shield',
        title: body.title || 'New Value',
        subtitle: body.subtitle || '',
        isActive: body.isActive !== false,
        position: parseInt(body.position) || 0,
      },
    });
    invalidateSettingsCache();
    return NextResponse.json({ valueProp: created });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
