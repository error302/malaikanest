'use client';

import Image from 'next/image';
import { Folder, Upload, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import type { ApiCategory } from './category-types';

interface CategoryRowProps {
  cat: ApiCategory;
  depth?: number;
  uploadingId: string | number | null;
  onThumbClick: (id: string | number) => void;
  onEdit: (cat: ApiCategory) => void;
  onDelete: (cat: ApiCategory) => void;
}

export function CategoryRow({
  cat,
  depth = 0,
  uploadingId,
  onThumbClick,
  onEdit,
  onDelete,
}: CategoryRowProps) {
  return (
    <div>
      <div
        className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--brand-bg-alt)] transition-colors group"
        style={{ paddingLeft: `${12 + depth * 24}px` }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer border hover:opacity-80 transition-opacity relative"
            style={{ background: 'var(--brand-warm)', borderColor: 'var(--brand-border)' }}
            onClick={() => onThumbClick(cat.id)}
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
            onClick={() => onEdit(cat)}
            className="p-2 rounded-lg hover:bg-[var(--brand-warm)] transition-colors"
            title="Edit category"
            aria-label={`Edit ${cat.name}`}
          >
            <Pencil size={15} style={{ color: 'var(--brand-brown)' }} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(cat)}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete category"
            aria-label={`Delete ${cat.name}`}
          >
            <Trash2 size={15} style={{ color: 'var(--brand-brown)', opacity: 0.6 }} />
          </button>
        </div>
      </div>
      {cat.children?.map((child) => (
        <CategoryRow
          key={child.id}
          cat={child}
          depth={depth + 1}
          uploadingId={uploadingId}
          onThumbClick={onThumbClick}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
