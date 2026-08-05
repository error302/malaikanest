import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invalidateSettingsCache } from '@/lib/settings';
import { guardAdminRequest, sanitizeError } from '@/lib/admin-guard';

/**
 * PUT /api/admin/value-props/[id] — update a value prop
 * DELETE /api/admin/value-props/[id] — delete a value prop
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = guardAdminRequest(req);
  if (guard) return guard;
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await db.valueProp.update({
      where: { id },
      data: {
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.subtitle !== undefined && { subtitle: body.subtitle }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.position !== undefined && { position: parseInt(body.position) || 0 }),
      },
    });
    invalidateSettingsCache();
    return NextResponse.json({ valueProp: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = guardAdminRequest(req);
  if (guard) return guard;
  try {
    const { id } = await params;
    await db.valueProp.delete({ where: { id } });
    invalidateSettingsCache();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
