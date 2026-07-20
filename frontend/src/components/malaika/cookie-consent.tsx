'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X, Check } from 'lucide-react';

const CONSENT_KEY = 'malaika_cookie_consent_v1';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        // Small delay so it doesn't flash on initial load
        const t = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, ts: Date.now() }));
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const dismiss = () => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, dismissed: true, ts: Date.now() }));
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[150] p-3 sm:p-4 animate-fade-in-up"
      style={{ pointerEvents: 'none' }}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
    >
      <div
        className="max-w-3xl mx-auto rounded-2xl shadow-warm-lg border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)', pointerEvents: 'auto' }}
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,105,20,0.1)' }}>
          <Cookie size={20} style={{ color: 'var(--brand-gold)' }} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>
            We use cookies to improve your shopping experience, analyze traffic and personalize content. By clicking &quot;Accept&quot;, you agree to our use of cookies.{' '}
            <Link href="/privacy-policy" className="underline font-medium" style={{ color: 'var(--brand-gold)' }}>
              Learn more
            </Link>
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={accept}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold"
            style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
          >
            <Check size={14} /> Accept
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="w-9 h-9 inline-flex items-center justify-center rounded-full border"
            style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text-muted)' }}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
