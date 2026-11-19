'use client';

import { Trash2, Loader2 } from 'lucide-react';

interface CategoryDeleteDialogProps {
  category: { id: string | number; name: string };
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CategoryDeleteDialog({
  category,
  isDeleting,
  onCancel,
  onConfirm,
}: CategoryDeleteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(44,24,16,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>
          Delete “{category.name}”?
        </h3>
        <p className="text-sm mt-1 mb-5" style={{ color: 'var(--brand-text-muted)' }}>
          This category will be removed. Categories still in use by products cannot be deleted.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="inline-flex items-center rounded-full border px-5 py-2.5 text-sm font-medium"
            style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-60"
            style={{ background: '#B91C1C', color: '#FFFFFF' }}
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
