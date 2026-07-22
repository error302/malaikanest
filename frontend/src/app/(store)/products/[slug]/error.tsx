'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from '@/lib/icons';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Product page error:', error);
  }, [error]);

  return (
    <div className="container-shell py-16 sm:py-24 text-center max-w-xl mx-auto">
      <div
        className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-5"
        style={{ background: 'var(--brand-warm)' }}
      >
        <AlertCircle size={26} style={{ color: 'var(--brand-terra)' }} />
      </div>
      <h1
        className="font-serif text-2xl sm:text-3xl font-semibold mb-2"
        style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
      >
        Something went wrong
      </h1>
      <p className="text-sm mb-7" style={{ color: 'var(--brand-text-muted)' }}>
        We couldn't load this product. Please try again.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
        style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
      >
        <RotateCcw size={16} /> Try again
      </button>
    </div>
  );
}
