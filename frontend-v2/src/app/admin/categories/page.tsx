'use client';

import { useEffect, useState } from 'react';
import { Plus, Folder, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  full_slug?: string;
  parent?: number | null;
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/products/categories/')
      .then((res) => {
        const data = res.data;
        setCategories(data?.results ?? data?.data?.results ?? []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

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
        <button type="button" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>No categories yet.</div>
        ) : (
          <div className="p-3">
            {categories.map((cat) => renderCategory(cat))}
          </div>
        )}
      </div>
    </div>
  );
}
