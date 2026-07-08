'use client';

import { useState } from 'react';
import { ShoppingCart, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { getAbandonedCart, type AbandonedCart } from '@/lib/cartRecovery';

/**
 * Recovery banner shown to users who have an abandoned cart (items added
 * but no checkout for > 1 hour). Appears at the top of the homepage.
 */
export function CartRecoveryBanner() {
  // Read on first client render — useState initializer avoids the effect entirely
  const [cart, setCart] = useState<AbandonedCart | null>(() => {
    if (typeof window === 'undefined') return null;
    return getAbandonedCart();
  });
  const [dismissed, setDismissed] = useState(false);

  if (!cart || dismissed) return null;

  const itemCount = cart.items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div
      className="relative z-50 border-b"
      style={{ background: 'var(--brand-terra)', borderColor: 'rgba(0,0,0,0.1)' }}
      role="banner"
    >
      <div className="container-shell py-3 flex items-center gap-3 flex-wrap">
        <ShoppingCart size={18} className="text-white flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium">
            You left {itemCount} item{itemCount === 1 ? '' : 's'} in your cart (KES {cart.total.toLocaleString('en-KE')})
          </p>
          <p className="text-[11px] text-white/80">Complete your order before they&apos;re gone!</p>
        </div>
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold transition-transform hover:scale-105"
          style={{ color: 'var(--brand-terra)' }}
        >
          Complete Order <ArrowRight size={12} />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
