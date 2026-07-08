'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, FileText, Eye, EyeOff } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: string;
  updatedAt: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/blog');
        if (cancelled) return;
        const data = await res.json();
        setPosts(data.posts || []);
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post permanently?')) return;
    try {
      await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      setPosts((p) => p.filter((x) => x.id !== id));
      showToast('Post deleted', 'success');
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const togglePublish = async (post: Post) => {
    try {
      await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !post.isPublished }),
      });
      setPosts((arr) => arr.map((x) => (x.id === post.id ? { ...x, isPublished: !x.isPublished } : x)));
      showToast(post.isPublished ? 'Unpublished' : 'Published', 'success');
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  const filtered = posts.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            Blog Posts
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
            {posts.length} post{posts.length === 1 ? '' : 's'} · {posts.filter((p) => p.isPublished).length} published
          </p>
        </div>
        <Link href="/admin/blog/new" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
          <Plus size={16} /> New Post
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts…" className="input-warm w-full" style={{ background: '#FFFFFF' }} />
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--brand-text-muted)' }} />
            <p className="text-sm mb-4" style={{ color: 'var(--brand-text-muted)' }}>No blog posts yet. Write your first article!</p>
            <Link href="/admin/blog/new" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
              <Plus size={16} /> Write First Post
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--brand-bg-alt)' }}>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Title</th>
                  <th className="text-left p-4 font-semibold hidden sm:table-cell" style={{ color: 'var(--brand-text)' }}>Category</th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Status</th>
                  <th className="text-left p-4 font-semibold hidden md:table-cell" style={{ color: 'var(--brand-text)' }}>Updated</th>
                  <th className="text-right p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr key={post.id} style={{ borderTop: '1px solid var(--brand-border)' }}>
                    <td className="p-4">
                      <div className="font-medium truncate" style={{ color: 'var(--brand-text)' }}>{post.title}</div>
                      <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>/{post.slug}</div>
                    </td>
                    <td className="p-4 hidden sm:table-cell" style={{ color: 'var(--brand-text-secondary)' }}>{post.category}</td>
                    <td className="p-4">
                      <button type="button" onClick={() => togglePublish(post)} className="text-[10px] px-2 py-1 rounded-full" style={{ background: post.isPublished ? 'rgba(45,90,66,0.12)' : 'var(--brand-warm)', color: post.isPublished ? 'var(--brand-green-light)' : 'var(--brand-text-muted)' }}>
                        {post.isPublished ? '● Published' : '○ Draft'}
                      </button>
                    </td>
                    <td className="p-4 hidden md:table-cell text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                      {new Date(post.updatedAt).toLocaleDateString('en-KE')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/blog/${post.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--brand-warm)]" aria-label="Edit">
                          <Pencil size={14} style={{ color: 'var(--brand-brown)' }} />
                        </Link>
                        <button type="button" onClick={() => handleDelete(post.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--brand-warm)]" aria-label="Delete">
                          <Trash2 size={14} style={{ color: 'var(--brand-terra)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
