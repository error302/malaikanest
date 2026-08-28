import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guardAdminRequest, sanitizeError } from '@/lib/admin-guard';
import { slugify } from '@/lib/slugify';

/** GET /api/admin/blog â€” list ALL posts (including drafts) */
export async function GET(req: NextRequest) {
  const guard = await guardAdminRequest(req);
  if (guard) return guard;
  try {
    const url = new URL(req.url);
    const take = Math.min(Math.max(parseInt(url.searchParams.get('take') || '50', 10) || 50, 1), 200);
    const skip = Math.max(parseInt(url.searchParams.get('skip') || '0', 10) || 0, 0);
    const [posts, total] = await Promise.all([
      db.blogPost.findMany({ orderBy: { updatedAt: 'desc' }, take, skip }),
      db.blogPost.count(),
    ]);
    return NextResponse.json({ posts, total, hasMore: skip + take < total });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e), posts: [] }, { status: 500 });
  }
}

/** POST /api/admin/blog â€” create a new post */
export async function POST(req: NextRequest) {
  const guard = await guardAdminRequest(req);
  if (guard) return guard;
  try {
    const body = await req.json();
    let slug = slugify(body.title || 'blog-post');
    const existing = await db.blogPost.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const created = await db.blogPost.create({
      data: {
        title: body.title || 'Untitled',
        slug,
        excerpt: body.excerpt || '',
        content: body.content || '',
        coverImage: body.coverImage || null,
        category: body.category || 'General',
        tags: body.tags || '',
        author: body.author || 'Malaika Nest',
        isPublished: body.isPublished === true,
        isFeatured: body.isFeatured === true,
        publishedAt: body.isPublished ? new Date() : null,
      },
    });
    return NextResponse.json({ post: created });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e) }, { status: 500 });
  }
}
