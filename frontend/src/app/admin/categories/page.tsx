'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
  Plus,
  Folder,
  Upload,
  Image as ImageIcon,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import api, { handleApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

interface ApiCategory {
  id: string | number;
  name: string;
  slug: string;
  full_slug?: string;
  parent?: string | number | null;
  description?: string;
  group?: string;
  image?: string | null;
  children?: ApiCategory[];
  product_count?: number;
  level?: number;
}

interface CategoryForm {
  name: string;
  group: string;
  description: string;
  parent: string;
}

const EMPTY_FORM: CategoryForm = { name: '', group: '', description: '', parent: '' };

const fieldCls =
  'w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/60 bg-[var(--brand-bg-alt)] border border-[var(--brand-border)]';
const labelCls =
  'text-xs uppercase tracking-wider font-semibold mb-1.5 block text-[var(--brand-text-muted)]';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<ApiCategory | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [uploadingId, setUploadingId] = useState<string | number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ApiCategory | null>(null);
  const [seeding, setSeeding] = useState(false);

  const thumbFileRef = useRef<HTMLInputElement>(null);
  const modalFileRef = useRef<HTMLInputElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | number | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/products/categories/', {
        headers: { 'X-No-Auth-Redirect': 'true' },
      });
      const data = res.data;
      setCategories(data?.results ?? data?.data?.results ?? []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const flatOptions = useMemo(() => {
    const out: { id: string | number; name: string; depth: number }[] = [];
    const walk = (nodes: ApiCategory[], depth: number) => {
      nodes.forEach((c) => {
        out.push({ id: c.id, name: c.name, depth });
        if (c.children?.length) walk(c.children, depth + 1);
      });
    };
    walk(categories, 0);
    return out;
  }, [categories]);

  const invalidParents = useMemo(() => {
    if (!editing) return new Set<string | number>();
    const set = new Set<string | number>();
    const collect = (node: ApiCategory) => {
      set.add(node.id);
      node.children?.forEach(collect);
    };
    collect(editing);
    return set;
  }, [editing]);

  const resetImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    setForm(EMPTY_FORM);
    resetImage();
    setModalOpen(true);
  };

  const openEdit = (cat: ApiCategory) => {
    setMode('edit');
    setEditing(cat);
    setForm({
      name: cat.name || '',
      group: cat.group || '',
      description: cat.description || '',
      parent: cat.parent ? String(cat.parent) : '',
    });
    resetImage();
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    resetImage();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append('name', form.name.trim());
    if (form.group) fd.append('group', form.group.trim());
    if (form.description) fd.append('description', form.description.trim());
    if (form.parent) fd.append('parent', form.parent);
    if (imageFile) fd.append('image', imageFile);
    try {
      if (mode === 'create') {
        await api.post('/api/v1/products/admin/categories/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Category created', 'success');
      } else {
        if (!editing) throw new Error('Missing category');
        await api.patch(`/api/v1/products/admin/categories/${editing.id}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Category updated', 'success');
      }
      closeModal();
      fetchCategories();
    } catch (err: any) {
      showToast(handleApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleThumbClick = (id: string | number) => {
    setActiveCategoryId(id);
    thumbFileRef.current?.click();
  };

  const handleThumbFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCategoryId) return;
    setUploadingId(activeCategoryId);
    const fd = new FormData();
    fd.append('image', file);
    try {
      await api.patch(`/api/v1/products/admin/categories/${activeCategoryId}/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Category image updated', 'success');
      fetchCategories();
    } catch (err: any) {
      showToast(handleApiError(err), 'error');
    } finally {
      setUploadingId(null);
      setActiveCategoryId(null);
      if (thumbFileRef.current) thumbFileRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await api.delete(`/api/v1/products/admin/categories/${confirmDelete.id}/`);
      showToast('Category deleted', 'success');
      setConfirmDelete(null);
      fetchCategories();
    } catch (err: any) {
      showToast(handleApiError(err), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await api.post('/api/v1/products/admin/categories/seed/');
      showToast(res.data?.detail || 'Default categories restored', 'success');
      fetchCategories();
    } catch (err: any) {
      showToast(handleApiError(err), 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleModalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleParentChange = (value: string) => {
    setForm((prev) => {
      const parent = flatOptions.find((o) => String(o.id) === value);
      return { ...prev, parent: value, group: prev.group || parent?.name || '' };
    });
  };

  const renderRow = (cat: ApiCategory, depth = 0) => (
    <div key={cat.id}>
      <div
        className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--brand-bg-alt)] transition-colors group"
        style={{ paddingLeft: `${12 + depth * 24}px` }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer border hover:opacity-80 transition-opacity relative"
            style={{ background: 'var(--brand-warm)', borderColor: 'var(--brand-border)' }}
            onClick={() => handleThumbClick(cat.id)}
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
            <div className="text-sm font-medium truncate flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
              {cat.name}
              {cat.product_count !== undefined && (
                <span className="text-xs font-normal" style={{ color: 'var(--brand-text-muted)' }}>
                  ({cat.product_count} {cat.product_count === 1 ? 'product' : 'products'})
                </span>
              )}
            </div>
            <div className="text-xs flex items-center gap-1" style={{ color: 'var(--brand-text-muted)' }}>
              {cat.group && <Folder size={12} />} /{cat.full_slug || cat.slug}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => openEdit(cat)}
            className="p-2 rounded-lg hover:bg-[var(--brand-warm)] transition-colors"
            title="Edit category"
            aria-label={`Edit ${cat.name}`}
          >
            <Pencil size={15} style={{ color: 'var(--brand-brown)' }} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(cat)}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete category"
            aria-label={`Delete ${cat.name}`}
          >
            <Trash2 size={15} style={{ color: 'var(--brand-brown)', opacity: 0.6 }} />
          </button>
        </div>
      </div>
      {cat.children?.map((child) => renderRow(child, depth + 1))}
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium border bg-white disabled:opacity-60"
            style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
          >
            {seeding ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Restore Defaults
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
            style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
          >
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      <input type="file" ref={thumbFileRef} onChange={handleThumbFile} className="hidden" accept="image/*" />

      <div className="rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--brand-warm)' }}>
              <Folder size={26} style={{ color: 'var(--brand-gold)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>No categories yet</p>
            <p className="text-xs mt-1 mb-4" style={{ color: 'var(--brand-text-muted)' }}>
              Create your first category to start organizing products.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
              style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
            >
              <Plus size={16} /> Add Category
            </button>
          </div>
        ) : (
          <div className="p-3 space-y-1">
            {categories.map((cat) => renderRow(cat))}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(44,24,16,0.5)' }}
          onClick={closeModal}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
                {mode === 'create' ? 'Add Category' : `Edit · ${editing?.name || ''}`}
              </h2>
              <button type="button" onClick={closeModal} aria-label="Close">
                <X size={20} style={{ color: 'var(--brand-brown)' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls} htmlFor="cat-name">Name *</label>
                <input
                  id="cat-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Baby Onesies"
                  className={fieldCls}
                  style={{ color: 'var(--brand-text)' }}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="cat-parent">Parent Category</label>
                <select
                  id="cat-parent"
                  value={form.parent}
                  onChange={(e) => handleParentChange(e.target.value)}
                  className={fieldCls}
                  style={{ color: 'var(--brand-text)' }}
                >
                  <option value="">— Top level (no parent) —</option>
                  {flatOptions
                    .filter((o) => !invalidParents.has(o.id))
                    .map((o) => (
                      <option key={o.id} value={String(o.id)}>
                        {'\u00A0'.repeat(o.depth * 2)}{o.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className={labelCls} htmlFor="cat-group">Group</label>
                <input
                  id="cat-group"
                  value={form.group}
                  onChange={(e) => setForm((p) => ({ ...p, group: e.target.value }))}
                  placeholder="e.g. Clothing"
                  className={fieldCls}
                  style={{ color: 'var(--brand-text)' }}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="cat-description">Description</label>
                <textarea
                  id="cat-description"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional short description"
                  className={fieldCls}
                  style={{ color: 'var(--brand-text)', resize: 'none' }}
                />
              </div>

              <div>
                <label className={labelCls}>Image</label>
                <button
                  type="button"
                  onClick={() => modalFileRef.current?.click()}
                  className="relative w-full h-32 rounded-xl overflow-hidden border border-dashed flex items-center justify-center gap-2 text-sm"
                  style={{
                    borderColor: 'var(--brand-border)',
                    color: 'var(--brand-text-muted)',
                    background: 'var(--brand-bg-alt)',
                  }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Category preview" className="absolute inset-0 w-full h-full object-cover" />
                  ) : editing?.image ? (
                    <Image src={editing.image} alt={editing.name} fill className="object-cover" />
                  ) : (
                    <>
                      <Upload size={16} /> Upload image
                    </>
                  )}
                  {imagePreview && (
                    <span className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs bg-black/60 text-white">
                      New image
                    </span>
                  )}
                </button>
                <input
                  ref={modalFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleModalFile}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="inline-flex items-center rounded-full border px-5 py-2.5 text-sm font-medium"
                  style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-60"
                  style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving…' : mode === 'create' ? 'Create Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(44,24,16,0.5)' }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>
              Delete “{confirmDelete.name}”?
            </h3>
            <p className="text-sm mt-1 mb-5" style={{ color: 'var(--brand-text-muted)' }}>
              This category will be removed. Categories still in use by products cannot be deleted.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deletingId !== null}
                className="inline-flex items-center rounded-full border px-5 py-2.5 text-sm font-medium"
                style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-60"
                style={{ background: '#B91C1C', color: '#FFFFFF' }}
              >
                {deletingId !== null ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deletingId !== null ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
