'use client';

import * as Icons from 'lucide-react';

interface ValuePropData {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  position: number;
}

interface ValuePropsProps {
  props: ValuePropData[];
}

const FALLBACK = [
  { id: '1', icon: 'Shield', title: 'Safe Materials', subtitle: 'OEKO-TEX certified, tested for your baby', isActive: true, position: 0 },
  { id: '2', icon: 'Truck', title: 'Fast Delivery', subtitle: 'Same-day in Mombasa, 1–3 days countrywide', isActive: true, position: 1 },
  { id: '3', icon: 'Heart', title: 'Parent Approved', subtitle: 'Trusted by 5,000+ Kenyan families', isActive: true, position: 2 },
  { id: '4', icon: 'CreditCard', title: 'Secure M-Pesa', subtitle: 'Till 3370347 · Pay safely, every time', isActive: true, position: 3 },
];

export function ValueProps({ props }: ValuePropsProps) {
  const active = (props?.length ? props : FALLBACK).filter((p) => p.isActive).sort((a, b) => a.position - b.position);

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
          {active.map((p) => {
            const Icon = (Icons as any)[p.icon] || Icons.Shield;
            return (
              <div key={p.id} className="flex items-start gap-3 sm:gap-4">
                <div
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(196, 112, 74, 0.12)' }}
                >
                  <Icon size={20} strokeWidth={1.75} style={{ color: 'var(--brand-terra)' }} />
                </div>
                <div>
                  <p className="text-[13px] sm:text-sm font-semibold leading-tight" style={{ color: 'var(--brand-text)' }}>
                    {p.title}
                  </p>
                  <p className="text-[11px] sm:text-xs mt-1 leading-snug" style={{ color: 'var(--brand-text-secondary)' }}>
                    {p.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
