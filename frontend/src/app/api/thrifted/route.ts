import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeError } from '@/lib/admin-guard';

/**
 * GET /api/thrifted — list available thrifted products (public)
 * Query params: condition, gender, ageGroup, search
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const condition = searchParams.get('condition') || undefined;
    const gender = searchParams.get('gender') || undefined;
    const ageGroup = searchParams.get('ageGroup') || undefined;
    const search = searchParams.get('search') || undefined;

    const where: any = { isAvailable: true, isActive: true };
    if (condition) where.condition = condition;
    if (gender && gender !== 'all') where.gender = gender;
    if (ageGroup && ageGroup !== 'all') where.ageGroup = ageGroup;
    if (search) where.name = { contains: search };

    const products = await db.thriftedProduct.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e), products: [] }, { status: 500 });
  }
}
