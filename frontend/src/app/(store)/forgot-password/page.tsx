'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import api, { handleApiError } from '@/lib/api';
import { useHydrated } from '@/lib/use-hydrated';
import { showToast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const hydrated = useHydrated();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/api/v1/accounts/password/reset/', { email });
      setSent(true);
      showToast('Password reset link sent! Check your email.', 'success');
    } catch (err) {
      const msg = handleApiError(err, 'Unable to send reset link. Please try again.');
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-10 sm:py-16">
      <div className="container-shell w-full max-w-md">
        <div className="text-center mb-8">
          <h1
            className="font-serif text-3xl sm:text-4xl font-semibold mb-2"
            style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
          >
            Reset your password
          </h1>
          <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
            {sent
              ? 'Check your inbox for a reset link.'
              : "Enter your email and we'll send you a link to reset your password."}
          </p>
        </div>

        {sent ? (
          <div
            className="p-6 sm:p-8 rounded-2xl border text-center"
            style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
          >
            <div
              className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(45, 90, 66, 0.12)' }}
            >
              <CheckCircle size={28} style={{ color: 'var(--brand-green-light)' }} />
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--brand-text-secondary)' }}>
              We've sent a password reset link to <strong style={{ color: 'var(--brand-text)' }}>{email}</strong>.
              The link is valid for 30 minutes.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
              style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
            >
              <ArrowRight size={16} /> Back to login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-2xl border"
            style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
          >
            <div>
              <label
                className="text-xs uppercase tracking-wider font-semibold mb-2 block"
                style={{ color: 'var(--brand-text-muted)' }}
              >
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--brand-text-muted)' }}
                />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="input-warm w-full"
                  style={{ background: 'var(--brand-bg-alt)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!hydrated || loading}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold disabled:opacity-60"
              style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
            >
              {loading ? 'Sending…' : <>Send reset link <ArrowRight size={16} /></>}
            </button>

            <p className="text-xs text-center mt-5" style={{ color: 'var(--brand-text-muted)' }}>
              <Link
                href="/login"
                className="font-semibold underline inline-block min-h-[44px] py-1"
                style={{ color: 'var(--brand-gold)' }}
              >
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
