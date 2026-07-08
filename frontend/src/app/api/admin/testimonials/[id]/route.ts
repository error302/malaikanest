import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invalidateSettingsCache } from '@/lib/settings';

/**
 * PUT /api/admin/testimonials/[id] — update a testimonial
 * DELETE /api/admin/testimonials/[id] — delete a testimonial
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await db.testimonial.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.rating !== undefined && { rating: Math.min(5, Math.max(1, parseInt(body.rating) || 5)) }),
        ...(body.text !== undefined && { text: body.text }),
        ...(body.product !== undefined && { product: body.product }),
        ...(body.initials !== undefined && { initials: body.initials }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.position !== undefined && { position: parseInt(body.position) || 0 }),
      },
    });
    invalidateSettingsCache();
    return NextResponse.json({ testimonial: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.testimonial.delete({ where: { id } });
    invalidateSettingsCache();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
