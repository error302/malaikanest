import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invalidateSettingsCache } from '@/lib/settings';
import { guardAdminRequest, sanitizeError } from '@/lib/admin-guard';

/**
 * GET /api/admin/branding — list all branding settings
 * PUT /api/admin/branding — upsert branding settings { key: value, ... }
 */
export async function GET(req: NextRequest) {
  const guard = await guardAdminRequest(req);
  if (guard) return guard;
  try {
    const rows = await db.siteSetting.findMany();
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await guardAdminRequest(req);
  if (guard) return guard;
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Expected an object of key/value pairs' }, { status: 400 });
    }

    const entries = Object.entries(body);
    for (const [key, value] of entries) {
      const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await db.siteSetting.upsert({
        where: { key },
        update: { value: strValue },
        create: { key, value: strValue },
      });
    }

    invalidateSettingsCache();
    return NextResponse.json({ success: true, updated: entries.length });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e) }, { status: 500 });
  }
}
