'use client';

import { useEffect, useState } from 'react';
import { Plus, Folder, ChevronRight, X, Save } from 'lucide-react';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';

interface Category {
  id: number;
  name: string;
  slug: string;
  full_slug?: string;
  parent?: number | null;
  children?: Category[];
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', parent: '' });

  const fetchCategories = () => {
    setLoading(true);
    api.get('/api/v1/products/categories/')
      .then((res) => {
        const data = res.data;
        setCategories(data?.results ?? data?.data?.results ?? []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setForm({ name: '', description: '', parent: '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm({ name: '', description: '', parent: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string | number | null> = { name: form.name.trim() };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.parent) payload.parent = parseInt(form.parent, 10);
      await api.post('/api/v1/products/categories/', payload);
      showToast('Category created', 'success');
      closeModal();
      fetchCategories();
    } catch (err: any) {
      showToast(err?.response?.data?.name?.[0] || err?.response?.data?.detail || 'Failed to create category', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Flatten categories for parent dropdown (only top-level categories can be parents)
  const flatCategories = categories.map(c => ({ id: c.id, name: c.name }));

  const renderCategory = (cat: Category, depth = 0) => (
    <div key={cat.id}>
      <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-[var(--brand-bg-alt)] transition-colors" style={{ paddingLeft: `${12 + depth * 24}px` }}>
        <Folder size={16} style={{ color: 'var(--brand-gold)' }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate" style={{ color: 'var(--brand-text)' }}>{cat.name}</div>
          <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>/{cat.full_slug || cat.slug}</div>
        </div>
      </div>
      {cat.children?.map((child) => renderCategory(child, depth + 1))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            Categories
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
            Organize your product catalog
          </p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>No categories yet. Click “Add Category” to create your first one.</div>
        ) : (
          <div className="p-3">
            {categories.map((cat) => renderCategory(cat))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(44, 24, 16, 0.5)' }} onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-warm-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--brand-border)' }}>
              <h2 className="font-serif text-xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
                Add Category
              </h2>
              <button type="button" onClick={closeModal} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--brand-warm)]" style={{ color: 'var(--brand-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Baby Essentials"
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
                />
                {form.name && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--brand-text-muted)' }}>
                    Slug will be: <code style={{ color: 'var(--brand-gold)' }}>/{slugify(form.name)}</code>
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description shown in mega menu"
                  rows={2}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Parent category (optional)</label>
                <select
                  value={form.parent}
                  onChange={(e) => setForm({ ...form, parent: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
                >
                  <option value="">— Top level (no parent) —</option>
                  {flatCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
                  <Save size={16} /> {saving ? 'Saving…' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
