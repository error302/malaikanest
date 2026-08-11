'use client';

import Link from 'next/link';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { getImageUrl } from '@/lib/media';
import { useI18n } from '@/lib/i18n';

export default function CartPage() {
  const { t } = useI18n();
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
          {t('cart.empty')}
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--brand-text-secondary)' }}>
          {t('cart.emptySub')}
        </p>
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium"
          style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
        >
          {t('cart.continue')} <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-shell py-6 sm:py-10">
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-6" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
        {t('cart.title')} ({items.length})
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
              <Link href={`/products/${item.slug || 'categories'}`} className="flex-shrink-0">
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
                <Link href={`/products/${item.slug || 'categories'}`} className="block">
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
                      aria-label={t('cart.decreaseQty')}
                      className="w-10 h-10 rounded-full border flex items-center justify-center active:scale-95 transition-transform"
                      style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-medium" style={{ color: 'var(--brand-text)' }}>{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      aria-label={t('cart.increaseQty')}
                      className="w-10 h-10 rounded-full border flex items-center justify-center active:scale-95 transition-transform"
                      style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label={t('cart.remove')}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--brand-warm)] active:scale-95"
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
            {t('cart.clear')}
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <h2 className="font-serif text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
              {t('checkout.orderSummary')}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between" style={{ color: 'var(--brand-text-secondary)' }}>
                <span>{t('cart.subtotal')}</span>
                <span>KES {subtotal.toLocaleString('en-KE')}</span>
              </div>
              <div className="flex justify-between" style={{ color: 'var(--brand-text-secondary)' }}>
                <span>{t('cart.shipping')}</span>
                <span>{deliveryFee === 0 ? t('cart.shippingFree') : `KES ${deliveryFee.toLocaleString('en-KE')}`}</span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-[11px] pt-1" style={{ color: 'var(--brand-text-muted)' }}>
                  {t('cart.addMore', { amount: (3000 - subtotal).toLocaleString('en-KE') })}
                </p>
              )}
              <div className="pt-3 mt-3 flex justify-between text-base font-semibold" style={{ borderTop: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}>
                <span>{t('cart.total')}</span>
                <span>KES {total.toLocaleString('en-KE')}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all"
              style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
            >
              {t('cart.checkout')} <ArrowRight size={16} />
            </Link>
            <Link
              href="/categories"
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-medium"
              style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
            >
              {t('cart.continue')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
