'use client';

import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Image as ImageIcon, Star, Trash2, Upload } from 'lucide-react';

export interface GalleryItem {
  id?: string;
  url: string;
  file?: File;
  is_primary: boolean;
}

export interface GalleryChange {
  galleryFiles: File[];
  deleteIds: string[];
  primaryId: string | null;
  order: string[];
}

interface Props {
  initialImages?: { id?: string; url: string; is_primary?: boolean }[];
  onChange?: (change: GalleryChange) => void;
}

function isImageFile(file: File) {
  return file.type.startsWith('image/');
}

export default function ProductGalleryUploader({ initialImages = [], onChange }: Props) {
  const [items, setItems] = useState<GalleryItem[]>(
    initialImages.map((img) => ({
      id: img.id,
      url: img.url,
      is_primary: !!img.is_primary,
    }))
  );
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const emit = (next: GalleryItem[], nextDeleted: string[]) => {
    const galleryFiles = next.filter((i) => i.file).map((i) => i.file as File);
    const order = next.filter((i) => i.id && !i.file).map((i) => i.id as string);
    const primary = next.find((i) => i.is_primary && i.id && !i.file);
    onChange?.({
      galleryFiles,
      deleteIds: nextDeleted,
      primaryId: primary ? (primary.id as string) : null,
      order,
    });
  };

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const created: GalleryItem[] = Array.from(files)
      .filter(isImageFile)
      .map((f) => ({ url: URL.createObjectURL(f), file: f, is_primary: false }));
    if (created.length === 0) return;
    setItems((prev) => {
      const next = [...prev, ...created];
      emit(next, deletedIds);
      return next;
    });
  };

  const removeItem = (index: number) => {
    const target = items[index];
    if (!target) return;
    const next = items.filter((_, i) => i !== index);
    let nextDeleted = deletedIds;
    if (target.id && !target.file) {
      nextDeleted = [...deletedIds, target.id];
      setDeletedIds(nextDeleted);
    } else if (target.file && target.url.startsWith('blob:')) {
      URL.revokeObjectURL(target.url);
    }
    setItems(next);
    emit(next, nextDeleted);
  };

  const setPrimary = (index: number) => {
    setItems((prev) => {
      const next = prev.map((it, i) => ({ ...it, is_primary: i === index }));
      emit(next, deletedIds);
      return next;
    });
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      emit(next, deletedIds);
      return next;
    });
  };

  const onDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const onDropReorder = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      emit(next, deletedIds);
      return next;
    });
    setDragIndex(null);
  };

  const cardStyle = (active: boolean) =>
    active
      ? { background: '#FFFFFF', borderColor: 'var(--brand-gold)' }
      : { background: '#FFFFFF', borderColor: 'var(--brand-border)' };

  return (
    <div className="space-y-3">
      <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
        Gallery images (drag &amp; drop or browse)
      </label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={onDropFiles}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 cursor-pointer text-center transition-colors"
        style={{
          borderColor: isOver ? 'var(--brand-gold)' : 'var(--brand-border)',
          background: isOver ? 'rgba(212,175,55,0.06)' : 'var(--brand-bg-alt)',
        }}
      >
        <Upload size={22} style={{ color: 'var(--brand-gold)' }} />
        <p className="text-sm" style={{ color: 'var(--brand-brown)' }}>
          Drop images here or <span style={{ color: 'var(--brand-gold)', fontWeight: 600 }}>browse</span>
        </p>
        <p className="text-[11px]" style={{ color: 'var(--brand-text-muted)' }}>
          You can select multiple files at once
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Gallery grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item, index) => (
            <div
              key={item.id ? `existing-${item.id}` : `new-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropReorder(index)}
              className="relative rounded-xl border overflow-hidden p-2"
              style={cardStyle(item.is_primary)}
            >
              <div className="w-full h-28 rounded-lg overflow-hidden bg-[var(--brand-bg-alt)]">
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              </div>

              {item.is_primary && (
                <span
                  className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--brand-gold)', color: '#fff' }}
                >
                  Primary
                </span>
              )}

              <div className="flex items-center justify-between mt-2 gap-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Move up"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="p-1 rounded-md disabled:opacity-30"
                    style={{ color: 'var(--brand-brown)' }}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    title="Move down"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    className="p-1 rounded-md disabled:opacity-30"
                    style={{ color: 'var(--brand-brown)' }}
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title={item.is_primary ? 'Primary image' : 'Set as primary'}
                    onClick={() => setPrimary(index)}
                    className="p-1 rounded-md"
                    style={{ color: item.is_primary ? 'var(--brand-gold)' : 'var(--brand-text-muted)' }}
                  >
                    <Star size={15} />
                  </button>
                  <button
                    type="button"
                    title="Remove"
                    onClick={() => removeItem(index)}
                    className="p-1 rounded-md"
                    style={{ color: 'var(--brand-terra)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {item.file && (
                <p className="text-[10px] truncate mt-1" style={{ color: 'var(--brand-text-muted)' }}>
                  {item.file.name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--brand-text-muted)' }}>
          <ImageIcon size={14} /> No gallery images yet — the main product image will be used.
        </div>
      )}
    </div>
  );
}
