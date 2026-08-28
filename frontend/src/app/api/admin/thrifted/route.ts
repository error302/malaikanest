import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guardAdminRequest, sanitizeError } from '@/lib/admin-guard';
import { slugify } from '@/lib/slugify';

/**
 * GET /api/admin/thrifted — list ALL thrifted products (including sold/hidden)
 * POST /api/admin/thrifted — create a new thrifted product
 */
export async function GET(req: NextRequest) {
  const guard = await guardAdminRequest(req);
  if (guard) return guard;
  try {
    const url = new URL(req.url);
    const take = Math.min(Math.max(parseInt(url.searchParams.get('take') || '50', 10) || 50, 1), 200);
    const skip = Math.max(parseInt(url.searchParams.get('skip') || '0', 10) || 0, 0);
    const [products, total] = await Promise.all([
      db.thriftedProduct.findMany({ orderBy: { createdAt: 'desc' }, take, skip }),
      db.thriftedProduct.count(),
    ]);
    return NextResponse.json({ products, total, hasMore: skip + take < total });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e), products: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await guardAdminRequest(req);
  if (guard) return guard;
  try {
    const body = await req.json();

    // Generate unique slug
    let slug = slugify(body.name || 'thrifted-item');
    const existing = await db.thriftedProduct.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const created = await db.thriftedProduct.create({
      data: {
        name: body.name || 'Untitled Thrifted Item',
        slug,
        description: body.description || '',
        price: parseFloat(body.price) || 0,
        originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
        condition: body.condition || 'good',
        brand: body.brand || '',
        size: body.size || '',
        gender: body.gender || 'unisex',
        ageGroup: body.ageGroup || '',
        image: body.image || '',
        image2: body.image2 || null,
        image3: body.image3 || null,
        isAvailable: body.isAvailable !== false,
        isFeatured: body.isFeatured === true,
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json({ product: created });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
