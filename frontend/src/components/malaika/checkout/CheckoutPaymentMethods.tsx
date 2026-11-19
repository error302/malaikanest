'use client';

import { Smartphone, CreditCard, Wallet } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'mpesa', labelKey: 'checkout.mpesa', Icon: Smartphone, descKey: 'checkout.mpesaDesc' },
  { value: 'till', labelKey: 'checkout.till', Icon: CreditCard, descKey: 'checkout.tillDesc' },
  { value: 'paypal', labelKey: 'checkout.paypal', Icon: Wallet, descKey: 'checkout.paypalDesc' },
];

interface CheckoutPaymentMethodsProps {
  payment: string;
  onPaymentChange: (payment: string) => void;
  tillCode: string;
  onTillCodeChange: (code: string) => void;
  itemsTotal: number;
  deliveryFee: number;
  t: (key: string) => string;
}

export function CheckoutPaymentMethods({
  payment,
  onPaymentChange,
  tillCode,
  onTillCodeChange,
  itemsTotal,
  deliveryFee,
  t,
}: CheckoutPaymentMethodsProps) {
  return (
    <section
      className="p-5 sm:p-6 rounded-2xl border"
      style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
    >
      <h2
        className="font-serif text-xl font-semibold mb-4"
        style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
      >
        {t('checkout.payment')}
      </h2>
      <div className="space-y-2">
        {PAYMENT_METHODS.map(({ value, labelKey, Icon, descKey }) => (
          <div key={value}>
            <label
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                payment === value ? 'ring-2' : ''
              }`}
              style={{
                borderColor: payment === value ? 'var(--brand-gold)' : 'var(--brand-border)',
                background: payment === value ? 'rgba(139,105,20,0.04)' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="payment"
                value={value}
                checked={payment === value}
                onChange={(e) => onPaymentChange(e.target.value)}
                className="sr-only"
              />
              <Icon size={20} style={{ color: 'var(--brand-gold)' }} />
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>
                  {t(labelKey)}
                </div>
                <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                  {t(descKey)}
                </div>
              </div>
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: payment === value ? 'var(--brand-gold)' : 'var(--brand-border)' }}
              >
                {payment === value && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--brand-gold)' }} />
                )}
              </div>
            </label>

            {payment === 'mpesa' && value === 'mpesa' && (
              <div
                className="mt-2.5 p-3 rounded-xl border text-xs space-y-1"
                style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)' }}
              >
                <div
                  className="font-semibold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--brand-gold)' }}
                >
                  Lipa Na M-Pesa (Buy Goods)
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--brand-text-secondary)' }}>Till Number:</span>
                  <span className="font-mono font-bold text-sm" style={{ color: 'var(--brand-text)' }}>
                    3370347
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--brand-text-secondary)' }}>Store / Shortcode:</span>
                  <span className="font-mono font-medium" style={{ color: 'var(--brand-text-muted)' }}>
                    3104615
                  </span>
                </div>
                <p className="text-[11px] mt-1" style={{ color: 'var(--brand-text-muted)' }}>
                  Enter your phone number above. You will receive an instant STK push prompt on your
                  phone to complete payment.
                </p>
              </div>
            )}

            {payment === 'till' && value === 'till' && (
              <div
                className="mt-2.5 p-3 rounded-xl border text-xs space-y-2"
                style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)' }}
              >
                <div
                  className="font-semibold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--brand-gold)' }}
                >
                  Manual Till Payment — Ready Now
                </div>
                <ol className="list-decimal list-inside space-y-0.5" style={{ color: 'var(--brand-text-secondary)' }}>
                  <li>Go to M-Pesa → Lipa na M-Pesa → Buy Goods and Services</li>
                  <li>
                    Enter Till{' '}
                    <span className="font-mono font-bold" style={{ color: 'var(--brand-text)' }}>
                      3370347
                    </span>{' '}
                    (Malaika Nest)
                  </li>
                  <li>
                    Enter Amount:{' '}
                    <span className="font-mono" style={{ color: 'var(--brand-text)' }}>
                      KES {Math.round(itemsTotal + deliveryFee).toLocaleString('en-KE')}
                    </span>
                  </li>
                  <li>Enter PIN &amp; Send</li>
                  <li>Paste the 10-char M-Pesa code below (e.g. SHK...)</li>
                </ol>
                <input
                  placeholder="M-Pesa Transaction Code (10 chars)"
                  value={tillCode}
                  onChange={(e) =>
                    onTillCodeChange(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                        .slice(0, 10)
                    )
                  }
                  maxLength={10}
                  className="input-warm w-full !pl-4 font-mono text-sm tracking-wider"
                  style={{ background: '#FFFFFF' }}
                  required={payment === 'till'}
                  pattern="^[A-Z0-9]{10}$"
                />
                <p className="text-[11px]" style={{ color: 'var(--brand-text-muted)' }}>
                  Order will be created as <em>Pending Verification</em>. You’ll verify the SMS code in
                  Admin → Orders → Verify &amp; Mark Paid.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
