import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invalidateSettingsCache } from '@/lib/settings';
import { guardAdminRequest, sanitizeError } from '@/lib/admin-guard';

/**
 * GET /api/admin/content — list all content blocks
 * PUT /api/admin/content — upsert content blocks [{ section, key, value }, ...]
 */
export async function GET(req: NextRequest) {
  const guard = guardAdminRequest(req);
  if (guard) return guard;
  try {
    const blocks = await db.contentBlock.findMany({ orderBy: [{ section: 'asc' }, { key: 'asc' }] });
    return NextResponse.json({ blocks });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = guardAdminRequest(req);
  if (guard) return guard;
  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Expected an array of { section, key, value }' }, { status: 400 });
    }

    for (const item of body) {
      if (!item.section || !item.key) continue;
      await db.contentBlock.upsert({
        where: { section_key: { section: item.section, key: item.key } },
        update: { value: String(item.value ?? ''), isActive: item.isActive ?? true },
        create: { section: item.section, key: item.key, value: String(item.value ?? ''), isActive: item.isActive ?? true },
      });
    }

    invalidateSettingsCache();
    return NextResponse.json({ success: true, updated: body.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
