'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, AlertCircle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--brand-cream)' }}>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(196,112,74,0.12)' }}>
          <AlertCircle size={28} style={{ color: 'var(--brand-terra)' }} />
        </div>

        <h1 className="font-serif text-2xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Something went wrong
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--brand-text-secondary)' }}>
          We hit an unexpected snag. Don&apos;t worry — our team has been notified. Try again, or head back home.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
            <RefreshCw size={16} /> Try Again
          </button>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
            <Home size={16} /> Back to Home
          </Link>
        </div>

        {error.digest && (
          <p className="text-[10px] mt-6" style={{ color: 'var(--brand-text-muted)' }}>
            Error reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
