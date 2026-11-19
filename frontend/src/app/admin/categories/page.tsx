'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Plus, Folder, Loader2, RefreshCw } from 'lucide-react';
import api, { handleApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';
import type { ApiCategory, CategoryForm } from '@/components/admin/category-types';
import { CategoryRow } from '@/components/admin/CategoryRow';
import { CategoryModal } from '@/components/admin/CategoryModal';
import { CategoryDeleteDialog } from '@/components/admin/CategoryDeleteDialog';

const EMPTY_FORM: CategoryForm = { name: '', group: '', description: '', parent: '' };

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
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                uploadingId={uploadingId}
                onThumbClick={handleThumbClick}
                onEdit={openEdit}
                onDelete={setConfirmDelete}
              />
            ))}
          </div>
        )}
      </div>

      <CategoryModal
        isOpen={modalOpen}
        mode={mode}
        editing={editing}
        form={form}
        setForm={setForm}
        imagePreview={imagePreview}
        saving={saving}
        flatOptions={flatOptions}
        invalidParents={invalidParents}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onFileChange={handleModalFile}
        onParentChange={handleParentChange}
      />

      {confirmDelete && (
        <CategoryDeleteDialog
          category={confirmDelete}
          isDeleting={deletingId !== null}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
