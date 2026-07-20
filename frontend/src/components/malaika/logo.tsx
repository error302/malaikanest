'use client';

import { useState } from 'react';
interface LogoProps {
  variant?: 'full' | 'compact';
  className?: string;
  onLight?: boolean;
  logoUrl?: string;
  storeName?: string;
  tagline?: string;
}

export function Logo({ variant = 'full', className = '', onLight = false, logoUrl, storeName, tagline }: LogoProps) {
  const gold = '#8B6914';
  const goldSoft = '#C9A96E';
  const text = '#2C1810';
  const name = storeName || 'Malaika Nest';
  const sub = tagline || 'Baby & Maternity';
  const src = logoUrl || '/logo.png';
  const [imgError, setImgError] = useState(false);

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {(!imgError) ? (
        <img
          src={src}
          alt={name}
          width={38}
          height={38}
          onError={() => setImgError(true)}
          className="flex-shrink-0 object-contain"
        />
      ) : (
        <svg width="38" height="38" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="flex-shrink-0">
          <circle cx="24" cy="14" r="7" stroke={goldSoft} strokeWidth="1.2" strokeDasharray="2 2" opacity="0.7" />
          <path d="M10 28 C 6 26, 4 30, 8 33 C 12 36, 18 35, 24 32" fill={goldSoft} opacity="0.45" />
          <path d="M38 28 C 42 26, 44 30, 40 33 C 36 36, 30 35, 24 32" fill={goldSoft} opacity="0.45" />
          <circle cx="24" cy="18" r="5.5" fill={gold} />
          <path d="M16 32 C 16 27, 20 24, 24 24 C 28 24, 32 27, 32 32 L 32 40 C 32 41.5, 30.5 43, 29 43 L 19 43 C 17.5 43, 16 41.5, 16 40 Z" fill={gold} />
          <path d="M24 26 L 24 41" stroke="#FDF8F3" strokeWidth="1" opacity="0.6" />
          <path d="M19 31 L 29 35" stroke="#FDF8F3" strokeWidth="0.8" opacity="0.4" />
          <path d="M19 35 L 29 31" stroke="#FDF8F3" strokeWidth="0.8" opacity="0.4" />
        </svg>
      )}

      {variant === 'full' && (
        <span className="flex flex-col leading-tight">
          <span
            className="font-serif text-[1.15rem] font-semibold tracking-tight"
            style={{ color: text, fontFamily: 'var(--font-cormorant)' }}
          >
            {name}
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.18em] font-medium"
            style={{ color: 'var(--brand-brown-light)' }}
          >
            {sub}
          </span>
        </span>
      )}
    </span>
  );
}
