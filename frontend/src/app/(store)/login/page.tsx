'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { AuthCard } from '@/components/malaika/auth-card';
import { showToast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import { extractApiError } from '@/lib/api';
import { useHydrated } from '@/lib/use-hydrated';
import { LoginEmailField } from '@/components/malaika/login/LoginEmailField';
import { LoginPasswordField } from '@/components/malaika/login/LoginPasswordField';

export default function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const hydrated = useHydrated();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const clearFieldError = (field: 'email' | 'password') => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

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

  const handleEmailBlur = () => {
    setFocusedField(null);
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      clearFieldError('email');
    }
  };

  return (
    <AuthCard title={t('auth.loginTitle')} subtitle={t('auth.loginSub')}>
      <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-5" noValidate>
        <LoginEmailField
          email={email}
          focusedField={focusedField}
          error={fieldErrors.email}
          inputRef={emailRef}
          onChange={(val) => { setEmail(val); clearFieldError('email'); }}
          onFocus={() => setFocusedField('email')}
          onBlur={handleEmailBlur}
          label={t('auth.email')}
        />

        <LoginPasswordField
          password={password}
          focusedField={focusedField}
          error={fieldErrors.password}
          inputRef={passwordRef}
          onChange={(val) => { setPassword(val); clearFieldError('password'); }}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
          label={t('auth.password')}
        />

        <div className="flex justify-end pt-1">
          <Link
            href="/forgot-password"
            className="text-xs font-medium underline-offset-2 hover:underline transition-[color] duration-200"
            style={{ color: 'var(--brand-gold)' }}
          >
            {t('auth.forgot')}
          </Link>
        </div>

        <button
          type="submit"
          disabled={!hydrated || loading}
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
    </AuthCard>
  );
}
