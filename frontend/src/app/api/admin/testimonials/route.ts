import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invalidateSettingsCache } from '@/lib/settings';
import { guardAdminRequest, sanitizeError } from '@/lib/admin-guard';

/**
 * GET /api/admin/testimonials — list all testimonials (including inactive)
 * POST /api/admin/testimonials — create a testimonial
 */
export async function GET(req: NextRequest) {
  const guard = await guardAdminRequest(req);
  if (guard) return guard;
  try {
    const url = new URL(req.url);
    const take = Math.min(Math.max(parseInt(url.searchParams.get('take') || '50', 10) || 50, 1), 200);
    const skip = Math.max(parseInt(url.searchParams.get('skip') || '0', 10) || 0, 0);
    const [testimonials, total] = await Promise.all([
      db.testimonial.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'desc' }], take, skip }),
      db.testimonial.count(),
    ]);
    return NextResponse.json({ testimonials, total, hasMore: skip + take < total });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await guardAdminRequest(req);
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
