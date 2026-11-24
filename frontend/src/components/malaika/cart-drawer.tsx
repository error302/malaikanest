'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingBag, ArrowRight, Plus, Minus } from 'lucide-react';
import { useEffect } from 'react';
import { useCart } from '@/lib/cartContext';
import { useCartDrawer } from '@/lib/cartDrawerStore';
import { formatKES } from '@/lib/format';
import { slideOver } from '@/lib/motion';

/**
 * Slide-over cart drawer. Mounted once at the storefront shell level.
 * Open/close state is driven by the `useCartDrawer` Zustand store so any
 * component (quick-add buttons, navbar cart icon, mobile bottom nav) can
 * surface the cart without prop-drilling.
 *
 * Reads cart items + subtotal from `useCart()` (cartContext). The actual cart
 * data lives in cartContext; this component is purely a presentation layer.
 */
export function CartDrawer() {
  const open = useCartDrawer((s) => s.open);
  const closeDrawer = useCartDrawer((s) => s.closeDrawer);
  const { items, updateQty, remove, loading } = useCart();

  const numericSubtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const FREE_SHIPPING_THRESHOLD = 10000;
  const progressPct = Math.min(100, Math.round((numericSubtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - numericSubtotal);
  const subtotal = formatKES(numericSubtotal);
  const itemCount = items.length;

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Close on Escape (in addition to the X button) for keyboard users
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeDrawer]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50"
            aria-hidden="true"
          />
          <motion.aside
            variants={slideOver}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-paper-card z-50 flex flex-col shadow-xl"
            role="dialog"
            aria-label="Shopping cart"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-line">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} strokeWidth={1.75} className="text-ink" />
                <h2 className="h3 text-ink">Your Cart</h2>
                <span className="text-sm text-ink-muted">({itemCount})</span>
              </div>
              <button
                onClick={closeDrawer}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-paper-alt transition-colors"
                aria-label="Close cart"
              >
                <X size={18} strokeWidth={1.75} className="text-ink" />
              </button>
            </div>

            {/* Free Shipping Progress in Drawer */}
            {itemCount > 0 && (
              <div className="px-6 py-3 border-b border-line bg-paper-alt">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  {numericSubtotal >= FREE_SHIPPING_THRESHOLD ? (
                    <span className="font-semibold text-emerald-700">✓ Free Kenya delivery unlocked!</span>
                  ) : (
                    <span className="text-ink">
                      Add <strong className="text-accent">KES {amountRemaining.toLocaleString('en-KE')}</strong> for Free Delivery
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-ink-muted">{progressPct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-line">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progressPct}%`,
                      backgroundColor: numericSubtotal >= FREE_SHIPPING_THRESHOLD ? 'var(--success, #4A7C59)' : 'var(--brand-gold, #C9A96E)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {itemCount === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag size={48} strokeWidth={1} className="mx-auto text-ink-faint mb-4" />
                  <p className="text-ink-muted mb-6">Your cart is empty</p>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/categories"
                      onClick={closeDrawer}
                      className="btn btn-primary"
                    >
                      Start Shopping
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={closeDrawer}
                      className="btn btn-ghost text-sm"
                    >
                      View Saved Wishlist
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li key={String(item.id)} className="flex gap-4">
                      <div className="relative w-20 h-24 flex-shrink-0 bg-paper-alt rounded overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={item.slug ? `/products/${item.slug}` : '#'}
                          onClick={closeDrawer}
                          className="text-sm font-medium text-ink hover:text-accent transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        {item.variant_label && (
                          <p className="text-xs text-ink-muted mt-0.5">{item.variant_label}</p>
                        )}
                        <p className="price text-ink mt-1">{formatKES(item.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-line rounded-full">
                            <button
                              onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))}
                              disabled={loading}
                              className="w-7 h-7 flex items-center justify-center hover:bg-paper-alt rounded-l-full transition-colors disabled:opacity-50"
                              aria-label={`Decrease quantity of ${item.name}`}
                            >
                              <Minus size={12} strokeWidth={2} className="text-ink" />
                            </button>
                            <span
                              className="w-8 text-center text-sm font-medium text-ink"
                              aria-live="polite"
                            >
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, item.qty + 1)}
                              disabled={loading}
                              className="w-7 h-7 flex items-center justify-center hover:bg-paper-alt rounded-r-full transition-colors disabled:opacity-50"
                              aria-label={`Increase quantity of ${item.name}`}
                            >
                              <Plus size={12} strokeWidth={2} className="text-ink" />
                            </button>
                          </div>
                          <button
                            onClick={() => remove(item.id)}
                            disabled={loading}
                            className="text-xs text-ink-muted hover:text-danger transition-colors ml-2 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {itemCount > 0 && (
              <div className="border-t border-line p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-muted">Subtotal</span>
                  <span className="price-lg text-ink">{subtotal}</span>
                </div>
                <p className="text-xs text-ink-muted">
                  Shipping and taxes calculated at checkout.
                </p>
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="btn btn-primary w-full justify-center"
                >
                  Checkout
                  <ArrowRight size={16} strokeWidth={1.75} />
                </Link>
                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  className="btn btn-ghost w-full justify-center text-sm"
                >
                  View full cart
                </Link>
                <Link
                  href="/wishlist"
                  onClick={closeDrawer}
                  className="text-xs text-center text-ink-muted hover:text-accent underline transition-colors block pt-1"
                >
                  Saved items for later? View Wishlist
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
