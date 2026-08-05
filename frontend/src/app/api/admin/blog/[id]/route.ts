import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guardAdminRequest, sanitizeError } from '@/lib/admin-guard';

/**
 * PUT /api/admin/blog/[id] — update a post
 * DELETE /api/admin/blog/[id] — delete a post
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = guardAdminRequest(req);
  if (guard) return guard;
  try {
    const { id } = await params;
    const body = await req.json();

    // Find post by ID or slug
    const current = await db.blogPost.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!current) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const publishingNow = body.isPublished === true && !current.isPublished;

    const updated = await db.blogPost.update({
      where: { id: current.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.excerpt !== undefined && { excerpt: body.excerpt }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.coverImage !== undefined && { coverImage: body.coverImage || null }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.tags !== undefined && { tags: typeof body.tags === 'string' ? body.tags : Array.isArray(body.tags) ? body.tags.join(',') : '' }),
        ...(body.author !== undefined && { author: body.author }),
        ...(body.isPublished !== undefined && { isPublished: Boolean(body.isPublished) }),
        ...(body.isFeatured !== undefined && { isFeatured: Boolean(body.isFeatured) }),
        ...(publishingNow && { publishedAt: new Date() }),
      },
    });
    return NextResponse.json({ post: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update post' }, { status: 500 });
  }
}

/** DELETE /api/admin/blog/[id] — delete a post */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = guardAdminRequest(req);
  if (guard) return guard;
  try {
    const { id } = await params;
    const current = await db.blogPost.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (current) {
      await db.blogPost.delete({ where: { id: current.id } });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: sanitizeError(e) || 'Failed to delete post' }, { status: 500 });
  }
}
