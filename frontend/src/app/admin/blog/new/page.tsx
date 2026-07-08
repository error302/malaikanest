'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { showToast } from '@/lib/toast';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', excerpt: '', content: '', coverImage: '',
    category: 'Baby Care', tags: '', author: 'Malaika Nest',
    isPublished: false, isFeatured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { showToast('Title is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      showToast(form.isPublished ? 'Post published!' : 'Draft saved', 'success');
      router.push('/admin/blog');
    } catch {
      showToast('Failed to save post', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none';
  const inputStyle = { background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' };

  return (
    <div className="max-w-3xl">
      <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--brand-text-muted)' }}>
        <ArrowLeft size={14} /> Back to blog
      </Link>
      <h1 className="font-serif text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
        <FileText size={24} style={{ color: 'var(--brand-gold)' }} /> New Blog Post
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Title *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="5 Organic Cotton Benefits for Baby" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Excerpt (for list pages + SEO)</label>
              <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Short summary shown on blog list and search results…" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Content (Markdown)</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} placeholder="# Heading&#10;&#10;Paragraph text…&#10;&#10;## Subheading&#10;&#10;More text…" className={`${inputClass} font-mono text-xs`} style={inputStyle} />
              <p className="text-[11px] mt-1" style={{ color: 'var(--brand-text-muted)' }}>Supports: # H1, ## H2, **bold**, [link](url), --- divider</p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Settings</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Cover image URL</label>
              <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://res.cloudinary.com/…/cover.jpg" className={inputClass} style={inputStyle} />
              {form.coverImage && <div className="mt-2 aspect-[16/9] rounded-lg overflow-hidden border" style={{ borderColor: 'var(--brand-border)' }}><img src={form.coverImage} alt="Preview" className="w-full h-full object-cover" /></div>}
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Category</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Baby Care" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Author</label>
                <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Tags (comma-sep)</label>
                <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="organic, cotton, skincare" className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--brand-brown)' }}>
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Publish immediately
              </label>
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--brand-brown)' }}>
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Feature on blog homepage
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
            <Save size={16} /> {saving ? 'Saving…' : form.isPublished ? 'Publish Post' : 'Save Draft'}
          </button>
          <Link href="/admin/blog" className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}
