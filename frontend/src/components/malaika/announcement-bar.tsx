'use client';

import { useEffect, useState } from 'react';

const MESSAGES = [
  'Free delivery on orders over KES 3,000',
  'Same-day delivery in Mombasa',
  'Lipa Na M-Pesa · Till 3370347',
  'Handcrafted with love in Kenya',
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative z-[60] overflow-hidden text-center text-[11px] sm:text-xs py-2.5 px-4 font-light tracking-wide"
      style={{
        background: 'var(--brand-gold)',
        color: '#FFFFFF',
      }}
      role="banner"
      aria-live="polite"
    >
      <div
        key={index}
        className="animate-fade-in-up inline-flex items-center gap-2"
      >
        <span
          className="inline-block w-1 h-1 rounded-full"
          style={{ background: 'var(--brand-gold-soft)' }}
          aria-hidden
        />
        <span dangerouslySetInnerHTML={{ __html: MESSAGES[index] }} />
      </div>
    </div>
  );
}
