import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invalidateSettingsCache } from '@/lib/settings';
import { guardAdminRequest, sanitizeError } from '@/lib/admin-guard';

/**
 * GET /api/admin/testimonials — list all testimonials (including inactive)
 * POST /api/admin/testimonials — create a testimonial
 */
export async function GET(req: NextRequest) {
  const guard = guardAdminRequest(req);
  if (guard) return guard;
  try {
    const testimonials = await db.testimonial.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'desc' }] });
    return NextResponse.json({ testimonials });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = guardAdminRequest(req);
  if (guard) return guard;
  try {
    const body = await req.json();
    const created = await db.testimonial.create({
      data: {
        name: body.name || 'Anonymous',
        location: body.location || 'Kenya',
        rating: Math.min(5, Math.max(1, parseInt(body.rating) || 5)),
        text: body.text || '',
        product: body.product || null,
        initials: body.initials || (body.name?.slice(0, 2)?.toUpperCase() || 'AN'),
        isActive: body.isActive !== false,
        position: parseInt(body.position) || 0,
      },
    });
    invalidateSettingsCache();
    return NextResponse.json({ testimonial: created });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e) }, { status: 500 });
  }
}
