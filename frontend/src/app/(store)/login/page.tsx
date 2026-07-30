'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { showToast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      showToast('Welcome back!', 'success');
      router.push('/account');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Invalid email or password';
      showToast(msg, 'error');
      if (msg.toLowerCase().includes('password')) {
        setFieldErrors((prev) => ({ ...prev, password: msg }));
      } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account')) {
        setFieldErrors((prev) => ({ ...prev, email: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field: 'email' | 'password') => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-10 sm:py-16 px-4">
      <div className="container-shell w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            {t('auth.loginTitle')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
            {t('auth.loginSub')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>{t('auth.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                  onBlur={() => {
                    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                      setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
                    } else {
                      clearFieldError('email');
                    }
                  }}
                  placeholder="you@email.com"
                  className={`input-warm w-full ${fieldErrors.email ? 'ring-2 ring-red-300' : ''}`}
                  style={{ background: 'var(--brand-bg-alt)' }}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>{t('auth.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                  placeholder="••••••••"
                  className={`input-warm w-full pr-10 ${fieldErrors.password ? 'ring-2 ring-red-300' : ''}`}
                  style={{ background: 'var(--brand-bg-alt)' }}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
                  style={{ color: 'var(--brand-text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--brand-text-muted)' }}>
              <input type="checkbox" className="rounded" /> {t('auth.remember')}
            </label>
            <Link href="/forgot-password" className="text-xs underline inline-block min-h-[44px] py-1" style={{ color: 'var(--brand-gold)' }}>{t('auth.forgot')}</Link>
          </div>

          <button type="submit" disabled={loading} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
            {loading ? t('auth.signingIn') : <>{t('auth.signin')} <ArrowRight size={16} /></>}
          </button>

          <p className="text-xs text-center mt-5" style={{ color: 'var(--brand-text-muted)' }}>
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="font-semibold underline inline-block min-h-[44px] py-1" style={{ color: 'var(--brand-gold)' }}>{t('auth.signupLink')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
