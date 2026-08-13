'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { showToast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import { extractApiError } from '@/lib/api';

export default function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

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
    if (errors.email) {
      setTimeout(() => emailRef.current?.focus(), 0);
    } else if (errors.password) {
      setTimeout(() => passwordRef.current?.focus(), 0);
    }
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
      const msg = extractApiError(err, 'Invalid email or password');
      showToast(msg, 'error');
      if (msg.toLowerCase().includes('password')) {
        setFieldErrors((prev) => ({ ...prev, password: msg }));
        setTimeout(() => passwordRef.current?.focus(), 0);
      } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account') || msg.toLowerCase().includes('verify') || msg.toLowerCase().includes('locked')) {
        setFieldErrors((prev) => ({ ...prev, email: msg }));
        setTimeout(() => emailRef.current?.focus(), 0);
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
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-10 sm:py-16 px-4 bg-grain">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* ── Card ──────────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl border shadow-warm-md transition-shadow duration-300 hover:shadow-warm-lg"
          style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
        >
          {/* Decorative top accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{
              background: 'linear-gradient(90deg, var(--brand-gold) 0%, var(--brand-gold-light) 50%, var(--brand-terra) 100%)',
            }}
          />

          {/* Brand mark — decorative pattern area */}
          <div
            className="relative pt-10 pb-6 px-8 sm:px-10 text-center overflow-hidden"
            style={{ background: 'var(--brand-bg-alt)' }}
          >
            {/* Decorative corner dots */}
            <div className="absolute top-4 right-6 flex gap-1.5" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold-soft)' }} />
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold-soft)' }} />
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold-soft)' }} />
            </div>
            <div className="absolute bottom-4 left-6 flex gap-1.5" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold-soft)' }} />
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold-soft)' }} />
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold-soft)' }} />
            </div>

            {/* Welcome icon */}
            <div
              className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--brand-gold-soft) 0%, var(--brand-warm) 100%)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <path d="M18 8l1 1 3-3" />
              </svg>
            </div>

            <h1
              className="font-serif text-3xl sm:text-4xl font-semibold leading-tight"
              style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
            >
              {t('auth.loginTitle')}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--brand-text-secondary)' }}>
              {t('auth.loginSub')}
            </p>
          </div>

          {/* ── Form ────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200" style={{ color: focusedField === 'email' ? 'var(--brand-gold)' : 'var(--brand-text-muted)' }} />
                <input
                  id="login-email"
                  name="email"
                  autoComplete="email"
                  spellCheck={false}
                  required
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => {
                    setFocusedField(null);
                    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                      setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
                    } else {
                      clearFieldError('email');
                    }
                  }}
                  ref={emailRef}
                  placeholder="you@email.com"
                  className={`w-full rounded-xl text-sm transition-[colors,box-shadow] duration-200 pl-11 pr-4 py-3 ${
                    fieldErrors.email
                      ? 'ring-2 ring-red-300 border-red-300'
                      : 'border focus:ring-2 focus:ring-[var(--brand-gold)]/20 focus:border-[var(--brand-gold)]'
                  }`}
                  style={{
                    background: 'var(--brand-bg-alt)',
                    borderColor: fieldErrors.email ? undefined : 'var(--brand-border)',
                    color: 'var(--brand-text)',
                  }}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                />
              </div>
              {fieldErrors.email && (
                <p id="login-email-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200" style={{ color: focusedField === 'password' ? 'var(--brand-gold)' : 'var(--brand-text-muted)' }} />
                <input
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  ref={passwordRef}
                  placeholder="••••••••"
                  className={`w-full rounded-xl text-sm transition-[colors,box-shadow] duration-200 pl-11 pr-11 py-3 ${
                    fieldErrors.password
                      ? 'ring-2 ring-red-300 border-red-300'
                      : 'border focus:ring-2 focus:ring-[var(--brand-gold)]/20 focus:border-[var(--brand-gold)]'
                  }`}
                  style={{
                    background: 'var(--brand-bg-alt)',
                    borderColor: fieldErrors.password ? undefined : 'var(--brand-border)',
                    color: 'var(--brand-text)',
                  }}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-[colors,transform] duration-200 hover:bg-[var(--brand-warm)] active:scale-95"
                  style={{ color: 'var(--brand-text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="login-password-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: 'var(--brand-text-muted)' }}>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 accent-[var(--brand-gold)] cursor-pointer"
                />
                {t('auth.remember')}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium underline-offset-2 hover:underline transition-[color] duration-200"
                style={{ color: 'var(--brand-gold)' }}
              >
                {t('auth.forgot')}
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold transition-[colors,box-shadow,transform] duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-[var(--brand-gold-dark)] hover:enabled:shadow-warm-md hover:enabled:-translate-y-0.5 active:scale-[0.98]"
              style={{
                background: loading ? 'var(--brand-gold-light)' : 'var(--brand-gold)',
                color: '#FFFFFF',
                boxShadow: loading ? 'none' : '0 2px 8px rgba(139, 105, 20, 0.25)',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('auth.signingIn')}
                </span>
              ) : (
                <>{t('auth.signin')} <ArrowRight size={16} className="transition-[transform] duration-200 group-hover:translate-x-0.5" /></>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--brand-border)' }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-[11px] uppercase tracking-[0.12em] font-semibold" style={{ background: '#FFFFFF', color: 'var(--brand-text-muted)' }}>
                  {t('auth.noAccount')}
                </span>
              </div>
            </div>

            {/* Register CTA */}
            <Link
              href="/register"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-[colors,transform] duration-200 border hover:bg-[var(--brand-warm)] active:scale-[0.98]"
              style={{
                borderColor: 'var(--brand-border)',
                color: 'var(--brand-brown)',
                background: 'transparent',
              }}
            >
              {t('auth.signupLink')}
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
