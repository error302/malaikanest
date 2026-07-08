import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** GET /api/admin/blog — list ALL posts (including drafts) */
export async function GET() {
  try {
    const posts = await db.blogPost.findMany({ orderBy: { updatedAt: 'desc' } });
    return NextResponse.json({ posts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, posts: [] }, { status: 500 });
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'blog-post';
}

/** POST /api/admin/blog — create a new post */
export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
