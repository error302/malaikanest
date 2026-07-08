import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** GET /api/blog/[slug] — single published post */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const post = await db.blogPost.findUnique({ where: { slug } });
    if (!post || !post.isPublished) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
