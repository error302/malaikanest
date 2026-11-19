'use client';

import { Ruler } from 'lucide-react';

interface Variant {
  id: number;
  size?: string;
  size_label?: string;
  color?: string;
  color_label?: string;
  price_modifier: string;
  stock: number;
}

interface ProductVariantsSelectorProps {
  hasVariants: boolean;
  variants: Variant[];
  selectedVariant: number | null;
  onSelectVariant: (id: number) => void;
  onOpenSizeGuide: () => void;
}

export function ProductVariantsSelector({
  hasVariants,
  variants,
  selectedVariant,
  onSelectVariant,
  onOpenSizeGuide,
}: ProductVariantsSelectorProps) {
  if (hasVariants) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>
            Select Option / Size:
          </span>
          <button
            type="button"
            onClick={onOpenSizeGuide}
            className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
            style={{ color: 'var(--brand-gold)' }}
          >
            <Ruler size={15} /> Size Guide
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const label = [v.size_label, v.color_label].filter(Boolean).join(' / ');
            const isSelected = selectedVariant === v.id;
            const isVariantOutOfStock = v.stock <= 0;

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectVariant(v.id)}
                className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  isSelected ? 'ring-2' : ''
                } ${isVariantOutOfStock ? 'opacity-40 grayscale' : ''}`}
                style={{
                  borderColor: isSelected ? 'var(--brand-gold)' : 'var(--brand-border)',
                  background: isSelected ? 'rgba(139,105,20,0.04)' : '#FFFFFF',
                  color: isSelected ? 'var(--brand-gold)' : 'var(--brand-text)',
                }}
              >
                {label}
                {isVariantOutOfStock && ' (Sold out)'}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onOpenSizeGuide}
        className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
        style={{ color: 'var(--brand-gold)' }}
      >
        <Ruler size={15} /> View Size Guide
      </button>
    </div>
  );
}
