import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invalidateSettingsCache } from '@/lib/settings';

/**
 * GET /api/admin/value-props — list all value props
 * POST /api/admin/value-props — create a value prop
 */
export async function GET() {
  try {
    const props = await db.valueProp.findMany({ orderBy: [{ position: 'asc' }] });
    return NextResponse.json({ valueProps: props });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
