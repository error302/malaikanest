import React from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

const TRUST_PILLARS = [
  {
    icon: Sparkles,
    title: '100% Gentle on Skin',
    subtitle: 'Pure GOTS-certified organic cotton & non-toxic dyes only',
  },
  {
    icon: Truck,
    title: 'Fast Kenya Delivery',
    subtitle: 'Same-day Nairobi & Mombasa · 24-48 hrs countrywide',
  },
  {
    icon: RotateCcw,
    title: 'Easy Exchanges',
    subtitle: '7-day hassle-free size swaps · doorstep collection',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    subtitle: 'Official M-Pesa Till 3370347 · instant verification',
  },
];

export function FooterTrustPillars() {
  return (
    <div
      className="py-8 sm:py-10 border-b"
      style={{
        background: 'rgba(255, 255, 255, 0.75)',
        borderColor: 'var(--brand-border)',
      }}
    >
      <div className="container-shell">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {TRUST_PILLARS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-3.5">
                <div
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs border"
                  style={{
                    background: '#FFFFFF',
                    borderColor: 'rgba(196, 144, 74, 0.25)',
                  }}
                >
                  <Icon size={22} style={{ color: 'var(--brand-gold)' }} />
                </div>
                <div>
                  <h3
                    className="text-sm font-semibold tracking-tight leading-snug"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-xs mt-1 leading-relaxed"
                    style={{ color: 'var(--brand-text-secondary)' }}
                  >
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
