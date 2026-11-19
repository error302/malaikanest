import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAdminGuard } from '@/lib/admin-guard';
import { clearThriftedCache } from '@/lib/thrifted';

/**
 * PUT /api/admin/thrifted/[id] — update a thrifted product
 * DELETE /api/admin/thrifted/[id] — delete a thrifted product
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminGuard(req, async () => {
    const { id } = await params;
    const body = await req.json();
    const updated = await db.thriftedProduct.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(body.originalPrice !== undefined && {
          originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
        }),
        ...(body.condition !== undefined && { condition: body.condition }),
        ...(body.brand !== undefined && { brand: body.brand }),
        ...(body.size !== undefined && { size: body.size }),
        ...(body.gender !== undefined && { gender: body.gender }),
        ...(body.ageGroup !== undefined && { ageGroup: body.ageGroup }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.image2 !== undefined && { image2: body.image2 || null }),
        ...(body.image3 !== undefined && { image3: body.image3 || null }),
        ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });
    clearThriftedCache();
    return NextResponse.json({ product: updated });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminGuard(req, async () => {
    const { id } = await params;
    await db.thriftedProduct.delete({ where: { id } });
    clearThriftedCache();
    return NextResponse.json({ success: true });
  });
}
