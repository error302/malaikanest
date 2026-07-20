'use client';

import { useState } from 'react';
import { Mail, Check, Sparkles, Loader2 } from 'lucide-react';

interface NewsletterProps {
  content?: Record<string, Record<string, string>>;
}

export function Newsletter({ content }: NewsletterProps) {
  const c = content?.newsletter || {};
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || c.success_message || 'Subscribed');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20" style={{ background: 'var(--brand-brown-dark)' }}>
      <div className="container-shell">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{ background: 'rgba(232, 213, 181, 0.12)', border: '1px solid rgba(232, 213, 181, 0.25)' }}
          >
            <Sparkles size={14} style={{ color: 'var(--brand-gold-soft)' }} />
            <span
              className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] font-semibold"
              style={{ color: 'var(--brand-gold-soft)' }}
            >
              {c.badge || 'Join the Nest'}
            </span>
          </div>

          <h2
            className="font-serif font-semibold tracking-tight"
            style={{
              color: '#FFFFFF',
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(1.8rem, 4.5vw, 2.6rem)',
              lineHeight: 1.15,
            }}
          >
            {c.title || 'Get 10% off your first order'}
          </h2>
          <p className="mt-3 text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {c.subtitle || 'Subscribe for new arrivals, exclusive offers and parenting tips — straight to your inbox.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 sm:mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} aria-hidden />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={c.placeholder || 'you@email.com'}
                aria-label="Email address"
                disabled={status === 'loading'}
                className="w-full rounded-full pl-11 pr-4 py-3.5 text-sm disabled:opacity-60"
                style={{ background: '#FFFFFF', color: 'var(--brand-text)', border: '1px solid var(--brand-border)' }}
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="rounded-full px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:shadow-warm-md hover:-translate-y-0.5 disabled:opacity-70 inline-flex items-center justify-center gap-2"
              style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
            >
              {status === 'loading' ? (
                <><Loader2 size={16} className="animate-spin" /> Subscribing…</>
              ) : status === 'success' ? (
                <><Check size={16} /> {c.success_message || 'Subscribed'}</>
              ) : (
                c.cta || 'Subscribe'
              )}
            </button>
          </form>

          {status === 'error' && message && (
            <p className="mt-3 text-xs" style={{ color: 'var(--brand-terra-soft)' }}>{message}</p>
          )}
          {status === 'success' && message && (
            <p className="mt-3 text-xs" style={{ color: 'var(--brand-gold-soft)' }}>{message}</p>
          )}

          <p className="mt-4 text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {c.disclaimer || 'No spam, only love. Unsubscribe anytime.'}
          </p>
        </div>
      </div>
    </section>
  );
}
