'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import api, { handleApiError } from '@/lib/api';
import { getImageUrl } from '@/lib/media';
import { showToast } from '@/lib/toast';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  stock: number;
  is_active: boolean;
  status: string;
  image?: string | null;
  image_full_url?: string | null;
  category_name?: string;
  category?: { name?: string };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Use the ADMIN endpoint — it returns all products (including drafts)
        // and doesn't require is_active=true filtering
        const res = await api.get('/api/v1/products/admin/products/', {
          params: search ? { search } : undefined,
        });
        if (cancelled) return;
        const data = res.data;
        const results = data?.results ?? data?.data?.results ?? data ?? [];
        setProducts(Array.isArray(results) ? results : []);
      } catch (err: any) {
        if (!cancelled) {
          setProducts([]);
          const msg = handleApiError(err, 'Failed to load products');
          showToast(msg, 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const t = setTimeout(load, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/api/v1/products/admin/products/${id}/`);
      showToast('Product deleted', 'success');
      setProducts((p) => p.filter((x) => x.id !== id));
    } catch (err: any) {
      const msg = handleApiError(err, 'Failed to delete product');
      showToast(msg, 'error');
    }
  };

  const getImage = (p: Product) => {
    const img = p.image_full_url || p.image;
    return img ? getImageUrl(img) : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            Products
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
            {loading ? 'Loading…' : `${products.length} product${products.length === 1 ? '' : 's'} in your catalog`}
          </p>
        </div>
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="input-warm w-full"
          style={{ background: '#FFFFFF' }}
        />
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={32} className="mx-auto mb-3" style={{ color: 'var(--brand-text-muted)' }} />
            <p className="text-sm mb-4" style={{ color: 'var(--brand-text-muted)' }}>
              {search ? 'No products match your search.' : 'No products yet. Add your first product!'}
            </p>
            <Link href="/admin/products/new" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
              <Plus size={16} /> Add First Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--brand-bg-alt)' }}>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Product</th>
                  <th className="text-left p-4 font-semibold hidden sm:table-cell" style={{ color: 'var(--brand-text)' }}>Category</th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Price</th>
                  <th className="text-left p-4 font-semibold hidden md:table-cell" style={{ color: 'var(--brand-text)' }}>Stock</th>
                  <th className="text-left p-4 font-semibold hidden lg:table-cell" style={{ color: 'var(--brand-text)' }}>Status</th>
                  <th className="text-right p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const img = getImage(p);
                  return (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--brand-border)' }}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--brand-warm)' }}>
                            {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate" style={{ color: 'var(--brand-text)' }}>{p.name}</div>
                            <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>/{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell" style={{ color: 'var(--brand-text-secondary)' }}>
                        {p.category?.name || p.category_name || '—'}
                      </td>
                      <td className="p-4 font-semibold" style={{ color: 'var(--brand-gold)' }}>
                        KES {parseFloat(p.price).toLocaleString('en-KE')}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-xs px-2 py-1 rounded-full" style={{
                          background: p.stock > 5 ? 'rgba(45,90,66,0.12)' : 'rgba(196,112,74,0.12)',
                          color: p.stock > 5 ? 'var(--brand-green-light)' : 'var(--brand-terra)',
                        }}>
                          {p.stock} in stock
                        </span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-xs px-2 py-1 rounded-full capitalize" style={{
                          background: p.status === 'published' ? 'rgba(45,90,66,0.12)' : 'var(--brand-warm)',
                          color: p.status === 'published' ? 'var(--brand-green-light)' : 'var(--brand-text-muted)',
                        }}>
                          {p.status || (p.is_active ? 'published' : 'draft')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/products/${p.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--brand-warm)]" aria-label="Edit product">
                            <Pencil size={14} style={{ color: 'var(--brand-brown)' }} />
                          </Link>
                          <button type="button" onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--brand-warm)]" aria-label="Delete product">
                            <Trash2 size={14} style={{ color: 'var(--brand-terra)' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
