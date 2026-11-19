'use client';

import { Check, ShoppingBasket } from 'lucide-react';

interface ProductStickyCTAProps {
  showSticky: boolean;
  productName: string;
  currentPrice: number;
  isOutOfStock: boolean;
  adding: boolean;
  added: boolean;
  onAdd: () => void;
}

export function ProductStickyCTA({
  showSticky,
  productName,
  currentPrice,
  isOutOfStock,
  adding,
  added,
  onAdd,
}: ProductStickyCTAProps) {
  return (
    <div
      aria-hidden={!showSticky}
      className={`lg:hidden fixed left-0 right-0 z-50 transition-transform duration-300 ${
        showSticky ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        bottom: '64px',
        background: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--brand-border)',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div className="flex items-stretch gap-3 px-4 py-3">
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <span
            className="text-[10px] uppercase tracking-[0.16em] font-medium"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            {productName.length > 28 ? productName.slice(0, 28) + '…' : productName}
          </span>
          <span className="text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>
            KES {currentPrice.toLocaleString('en-KE')}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={isOutOfStock || adding}
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold text-sm transition-all disabled:opacity-50"
          style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
          aria-label={added ? 'Added to cart' : 'Add to cart'}
        >
          {added ? (
            <>
              <Check size={18} /> Added
            </>
          ) : (
            <>
              <ShoppingBasket size={18} /> {adding ? 'Adding…' : 'Add to Cart'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
