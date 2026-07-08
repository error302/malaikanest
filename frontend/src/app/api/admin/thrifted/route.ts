import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/admin/thrifted — list ALL thrifted products (including sold/hidden)
 * POST /api/admin/thrifted — create a new thrifted product
 */
export async function GET() {
  try {
    const products = await db.thriftedProduct.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ products });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, products: [] }, { status: 500 });
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'thrifted-item';
}

export async function POST(req: NextRequest) {
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
