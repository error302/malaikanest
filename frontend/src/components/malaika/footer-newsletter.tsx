'use client';

import React, { useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { showToast } from '@/lib/toast';

export function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribed(true);
        setEmail('');
        showToast(data.message || 'Welcome to the Nest family!', 'success');
      } else {
        showToast(data.error || 'Subscription failed. Please try again.', 'error');
      }
    } catch {
      showToast('Unable to subscribe at this moment. Please reach out via WhatsApp.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="py-8 sm:py-10 border-b"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF7F2 100%)',
        borderColor: 'var(--brand-border)',
      }}
    >
      <div className="container-shell">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span
              className="inline-block text-[11px] uppercase tracking-[0.16em] font-semibold mb-1"
              style={{ color: 'var(--brand-gold)' }}
            >
              Join the Nest Family
            </span>
            <h2
              className="font-serif text-xl sm:text-2xl font-semibold tracking-tight"
              style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
            >
              Enjoy 10% Off Your First Order
            </h2>
            <p
              className="text-xs sm:text-sm mt-1 max-w-md"
              style={{ color: 'var(--brand-text-secondary)' }}
            >
              Be the first to hear about curated baby clothing drops, parenting tips, and secret deals.
            </p>
          </div>

          <div className="w-full md:w-auto md:min-w-[340px]">
            {subscribed ? (
              <div
                className="flex items-center gap-2 p-3 rounded-xl border text-xs font-medium"
                style={{
                  background: 'rgba(45, 90, 66, 0.08)',
                  borderColor: 'var(--brand-green-light)',
                  color: 'var(--brand-green-light)',
                }}
              >
                <CheckCircle size={16} />
                <span>You&apos;re subscribed! Welcome to Malaika Nest.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-warm flex-1 px-4 py-3 text-xs sm:text-sm rounded-full w-full"
                  style={{ background: '#FFFFFF' }}
                  aria-label="Email address for newsletter"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full px-6 py-3 text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-warm-sm hover:shadow-warm-md active:scale-95 disabled:opacity-60"
                  style={{
                    background: 'var(--brand-gold)',
                    color: '#FFFFFF',
                  }}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Subscribe <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
