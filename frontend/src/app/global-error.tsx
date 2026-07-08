'use client';

import Link from 'next/link';
import { Home, AlertCircle } from 'lucide-react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#FDF8F3', color: '#2C1810' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ width: '64px', height: '64px', margin: '0 auto 24px', borderRadius: '50%', background: 'rgba(196,112,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={28} color="#C4704A" />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '12px', fontFamily: 'Georgia, serif' }}>
              Site temporarily unavailable
            </h1>
            <p style={{ fontSize: '0.875rem', marginBottom: '28px', color: '#5C4033' }}>
              We&apos;re experiencing a technical issue. Please refresh in a moment, or contact us on WhatsApp if it persists.
            </p>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600, background: '#8B6914', color: '#FFFFFF', textDecoration: 'none' }}>
              <Home size={16} /> Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
