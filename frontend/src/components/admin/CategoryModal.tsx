'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Save, Loader2 } from 'lucide-react';
import type { ApiCategory, CategoryForm } from './category-types';

const fieldCls =
  'w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/60 bg-[var(--brand-bg-alt)] border border-[var(--brand-border)]';
const labelCls =
  'text-xs uppercase tracking-wider font-semibold mb-1.5 block text-[var(--brand-text-muted)]';

interface CategoryModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  editing: ApiCategory | null;
  form: CategoryForm;
  setForm: React.Dispatch<React.SetStateAction<CategoryForm>>;
  imagePreview: string | null;
  saving: boolean;
  flatOptions: { id: string | number; name: string; depth: number }[];
  invalidParents: Set<string | number>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onParentChange: (value: string) => void;
}

export function CategoryModal({
  isOpen,
  mode,
  editing,
  form,
  setForm,
  imagePreview,
  saving,
  flatOptions,
  invalidParents,
  onClose,
  onSubmit,
  onFileChange,
  onParentChange,
}: CategoryModalProps) {
  const modalFileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(44,24,16,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            {mode === 'create' ? 'Add Category' : `Edit · ${editing?.name || ''}`}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} style={{ color: 'var(--brand-brown)' }} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
              onChange={(e) => onParentChange(e.target.value)}
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
              onChange={onFileChange}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
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
  );
}
