import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** GET /api/blog — list published posts */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { isPublished: true };
    if (category && category !== 'all') where.category = category;

    const posts = await db.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
    return NextResponse.json({ posts }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, posts: [] }, { status: 500 });
  }
}
