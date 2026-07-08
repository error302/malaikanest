'use client';

import { Shield, Truck, Heart, CreditCard } from 'lucide-react';

const PROPS = [
  {
    Icon: Shield,
    title: 'Safe Materials',
    sub: 'OEKO-TEX certified, tested for your baby',
  },
  {
    Icon: Truck,
    title: 'Fast Delivery',
    sub: 'Same-day in Mombasa, 1–3 days countrywide',
  },
  {
    Icon: Heart,
    title: 'Parent Approved',
    sub: 'Trusted by 5,000+ Kenyan families',
  },
  {
    Icon: CreditCard,
    title: 'Secure M-Pesa',
    sub: 'Till 3370347 · Pay safely, every time',
  },
];

export function ValueProps() {
  return (
    <section
      className="py-10 sm:py-12"
      style={{
        background: 'var(--brand-warm)',
        borderTop: '1px solid var(--brand-border)',
        borderBottom: '1px solid var(--brand-border)',
      }}
    >
      <div className="container-shell">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {PROPS.map(({ Icon, title, sub }) => (
            <div
              key={title}
              className="flex items-start gap-3 sm:gap-4"
            >
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(196, 112, 74, 0.12)',
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={1.75}
                  style={{ color: 'var(--brand-terra)' }}
                />
              </div>
              <div>
                <p
                  className="text-[13px] sm:text-sm font-semibold leading-tight"
                  style={{ color: 'var(--brand-text)' }}
                >
                  {title}
                </p>
                <p
                  className="text-[11px] sm:text-xs mt-1 leading-snug"
                  style={{ color: 'var(--brand-text-secondary)' }}
                >
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
