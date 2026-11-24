'use client';

import Link from 'next/link';
import { Lock, Smartphone } from 'lucide-react';

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  qty: number;
}

interface AppliedCoupon {
  code: string;
  discount_amount: number;
  discount_label: string;
}

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  freeThreshold: number;
  region: string;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  couponCode: string;
  setCouponCode: (val: string) => void;
  appliedCoupon: AppliedCoupon | null;
  couponLoading: boolean;
  couponError: string | null;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (agreed: boolean) => void;
  submitting: boolean;
  paymentPending: boolean;
  paymentPollingError: string | null;
  onCancelPaymentPending: () => void;
  t: (key: string) => string;
}

export function CheckoutOrderSummary({
  items,
  subtotal,
  freeThreshold,
  region,
  deliveryFee,
  discountAmount,
  total,
  couponCode,
  setCouponCode,
  appliedCoupon,
  couponLoading,
  couponError,
  onApplyCoupon,
  onRemoveCoupon,
  agreedToTerms,
  setAgreedToTerms,
  submitting,
  paymentPending,
  paymentPollingError,
  onCancelPaymentPending,
  t,
}: CheckoutOrderSummaryProps) {
  return (
    <div className="lg:col-span-1">
      <div
        className="sticky top-24 p-6 rounded-2xl border"
        style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
      >
        <h2
          className="font-serif text-xl font-semibold mb-4"
          style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
        >
          {t('checkout.orderSummary')}
        </h2>
        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-xs"
              style={{ color: 'var(--brand-text-secondary)' }}
            >
              <span className="truncate flex-1 mr-2">
                {item.name} × {item.qty}
              </span>
              <span>KES {(item.price * item.qty).toLocaleString('en-KE')}</span>
            </div>
          ))}
        </div>

        {!appliedCoupon && (
          <div className="flex gap-2 py-2">
            <input
              type="text"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="input-warm flex-1 !pl-3 text-xs"
              style={{ background: 'var(--brand-bg-alt)' }}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onApplyCoupon())}
            />
            <button
              type="button"
              onClick={onApplyCoupon}
              disabled={couponLoading}
              className="px-3 py-2 rounded-full text-xs font-medium disabled:opacity-50"
              style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
            >
              {couponLoading ? '...' : 'Apply'}
            </button>
          </div>
        )}
        {couponError && (
          <p className="text-xs pb-2" style={{ color: 'var(--brand-terra)' }}>
            {couponError}
          </p>
        )}

        {appliedCoupon && (
          <div
            className="flex items-center justify-between text-sm py-2"
            style={{ color: 'var(--brand-green-light)' }}
          >
            <span>{appliedCoupon.discount_label || `Coupon: ${appliedCoupon.code}`}</span>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="text-xs underline"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              Remove
            </button>
          </div>
        )}

        <div className="space-y-2 text-sm pt-3" style={{ borderTop: '1px solid var(--brand-border)' }}>
          <div className="flex justify-between" style={{ color: 'var(--brand-text-secondary)' }}>
            <span>{t('cart.subtotal')}</span>
            <span>KES {subtotal.toLocaleString('en-KE')}</span>
          </div>
          <div className="flex justify-between" style={{ color: 'var(--brand-text-secondary)' }}>
            <span>
              {t('cart.shipping')}
              {region && deliveryFee === 0
                ? ` (${t('cart.shippingFree').toLowerCase()} ${t('checkout.over')} KES ${freeThreshold.toLocaleString('en-KE')})`
                : ''}
            </span>
            <span>
              {!region
                ? t('checkout.chooseDelivery') || 'Please choose'
                : deliveryFee === 0
                ? t('cart.shippingFree')
                : `KES ${deliveryFee.toLocaleString('en-KE')}`}
            </span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between" style={{ color: 'var(--brand-green-light)' }}>
              <span>Discount</span>
              <span>-KES {discountAmount.toLocaleString('en-KE')}</span>
            </div>
          )}
          <div
            className="flex justify-between text-base font-semibold pt-3"
            style={{ borderTop: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
          >
            <span>{t('cart.total')}</span>
            <span>KES {total.toLocaleString('en-KE')}</span>
          </div>
        </div>

        {/* Clickwrap Legal Agreement Checkbox */}
        <div className="pt-4 pb-2">
          <label
            className="flex items-start gap-2.5 text-xs cursor-pointer select-none"
            style={{ color: 'var(--brand-text-secondary)' }}
          >
            <input
              type="checkbox"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[var(--brand-gold)] cursor-pointer flex-shrink-0"
            />
            <span className="leading-snug">
              I agree to the{' '}
              <Link
                href="/terms-of-service"
                target="_blank"
                className="font-semibold underline"
                style={{ color: 'var(--brand-gold)' }}
              >
                Terms of Service
              </Link>
              ,{' '}
              <Link
                href="/returns"
                target="_blank"
                className="font-semibold underline"
                style={{ color: 'var(--brand-gold)' }}
              >
                72-Hour Return Policy (tags attached)
              </Link>
              , and{' '}
              <Link
                href="/privacy-policy"
                target="_blank"
                className="font-semibold underline"
                style={{ color: 'var(--brand-gold)' }}
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        </div>

        {/* Merchant return shield note */}
        <div
          className="p-3 rounded-xl border text-[11px] mb-4 space-y-1"
          style={{
            background: 'var(--brand-bg-alt)',
            borderColor: 'var(--brand-border)',
            color: 'var(--brand-text-secondary)',
          }}
        >
          <div className="font-semibold" style={{ color: 'var(--brand-text)' }}>
            ⚠️ 72-Hour Return &amp; Exchange Terms:
          </div>
          <p>
            Returns &amp; sizing exchanges are accepted within 72 hours of courier delivery only. All
            original brand tags must remain attached and untampered. Customer covers return courier
            transit.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'var(--accent, var(--brand-terra))', color: '#FFFFFF' }}
        >
          {submitting ? (
            t('checkout.processing')
          ) : (
            <>
              {t('checkout.placeOrder')} <Lock size={14} />
            </>
          )}
        </button>

        {/* WhatsApp Assistance */}
        <div className="mt-4 pt-3 border-t text-center" style={{ borderColor: 'var(--brand-border)' }}>
          <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
            Need help with your order or payment?
          </p>
          <a
            href="https://wa.me/254726771321?text=Hi%20Malaika%20Nest%2C%20I%20need%20assistance%20completing%20my%20checkout%20order"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
            style={{ color: '#128C7E' }}
          >
            <Smartphone size={14} style={{ color: '#25D366' }} /> Chat on WhatsApp (+254 726 771 321)
          </a>
        </div>

        {paymentPending && (
          <div
            className="mt-4 p-4 rounded-xl border text-center"
            style={{ background: 'rgba(139,105,20,0.06)', borderColor: 'var(--brand-gold)' }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>
                Waiting for M-Pesa payment…
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--brand-text-secondary)' }}>
              Check your phone and enter your PIN
            </p>
            {paymentPollingError ? (
              <p className="text-xs text-red-600 mb-3">{paymentPollingError}</p>
            ) : null}
            <button
              type="button"
              onClick={onCancelPaymentPending}
              className="text-xs underline"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              Cancel and try again
            </button>
          </div>
        )}
        <p className="text-[11px] mt-3 text-center" style={{ color: 'var(--brand-text-muted)' }}>
          {t('checkout.secured')}
        </p>
      </div>
    </div>
  );
}
