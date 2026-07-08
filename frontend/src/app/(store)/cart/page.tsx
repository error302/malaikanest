'use client';

import Link from 'next/link';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { getImageUrl } from '@/lib/media';

export default function CartPage() {
  const { items, updateQty, remove, clear, loading } = useCart();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = subtotal >= 3000 ? 0 : 300;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="container-shell py-16 sm:py-24 text-center">
        <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--brand-warm)' }}>
          <ShoppingBag size={32} style={{ color: 'var(--brand-gold)' }} />
        </div>
        <h1 className="font-serif text-3xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Your cart is empty
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--brand-text-secondary)' }}>
          Looks like you haven&apos;t added anything yet. Let&apos;s find something lovely for your little one.
        </p>
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium"
          style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
        >
          Start Shopping <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-shell py-6 sm:py-10">
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-6" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
        Your Cart ({items.length})
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 rounded-2xl border"
              style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
            >
              <Link href={`/products/${item.slug}`} className="flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden" style={{ background: 'var(--brand-warm)' }}>
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-serif text-2xl opacity-30" style={{ color: 'var(--brand-gold)' }}>{item.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.slug}`} className="block">
                  <h3 className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--brand-text)' }}>{item.name}</h3>
                </Link>
                {item.variant_label && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>{item.variant_label}</p>
                )}
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--brand-gold)' }}>
                  KES {item.price.toLocaleString('en-KE')}
                </p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      aria-label="Decrease quantity"
                      className="w-8 h-8 rounded-full border flex items-center justify-center"
                      style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium" style={{ color: 'var(--brand-text)' }}>{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      aria-label="Increase quantity"
                      className="w-8 h-8 rounded-full border flex items-center justify-center"
                      style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label="Remove item"
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--brand-warm)]"
                    style={{ color: 'var(--brand-terra)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>
                  KES {(item.price * item.qty).toLocaleString('en-KE')}
                </p>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={clear}
            className="text-xs underline mt-2"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            Clear cart
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <h2 className="font-serif text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
              Order Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between" style={{ color: 'var(--brand-text-secondary)' }}>
                <span>Subtotal</span>
                <span>KES {subtotal.toLocaleString('en-KE')}</span>
              </div>
              <div className="flex justify-between" style={{ color: 'var(--brand-text-secondary)' }}>
                <span>Delivery</span>
                <span>{deliveryFee === 0 ? 'FREE' : `KES ${deliveryFee.toLocaleString('en-KE')}`}</span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-[11px] pt-1" style={{ color: 'var(--brand-text-muted)' }}>
                  Add KES {(3000 - subtotal).toLocaleString('en-KE')} more for free delivery
                </p>
              )}
              <div className="pt-3 mt-3 flex justify-between text-base font-semibold" style={{ borderTop: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}>
                <span>Total</span>
                <span>KES {total.toLocaleString('en-KE')}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all"
              style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
            >
              Checkout <ArrowRight size={16} />
            </Link>
            <Link
              href="/categories"
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-medium"
              style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
