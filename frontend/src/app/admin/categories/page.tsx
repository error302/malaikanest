'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Folder, Upload, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';

interface Category {
  id: string | number;
  name: string;
  slug: string;
  full_slug?: string;
  parent?: string | number | null;
  image?: string | null;
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | number | null>(null);

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

  const handleImageClick = (id: string | number) => {
    setActiveCategoryId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCategoryId) return;

    setUploadingId(activeCategoryId);
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      await api.patch(`/api/v1/products/categories/${activeCategoryId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showToast('Category image updated successfully', 'success');
      fetchCategories();
    } catch (error) {
      showToast('Failed to upload image', 'error');
    } finally {
      setUploadingId(null);
      setActiveCategoryId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderCategory = (cat: Category, depth = 0) => (
    <div key={cat.id}>
      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--brand-bg-alt)] transition-colors group" style={{ paddingLeft: `${12 + depth * 24}px` }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer border hover:opacity-80 transition-opacity relative"
            style={{ 
              background: 'var(--brand-warm)',
              borderColor: 'var(--brand-border)'
            }}
            onClick={() => handleImageClick(cat.id)}
            title="Upload/Change Image"
          >
            {uploadingId === cat.id ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-[var(--brand-gold)] rounded-full animate-spin" />
            ) : cat.image ? (
              <Image src={cat.image} alt={cat.name} fill className="object-cover" />
            ) : (
              <ImageIcon size={18} style={{ color: 'var(--brand-gold)' }} />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Upload size={14} className="text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: 'var(--brand-text)' }}>{cat.name}</div>
            <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>/{cat.full_slug || cat.slug}</div>
          </div>
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

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />

      <div className="rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>No categories yet.</div>
        ) : (
          <div className="p-3 space-y-1">
            {categories.map((cat) => renderCategory(cat))}
          </div>
        )}
      </div>
    </div>
  );
}
