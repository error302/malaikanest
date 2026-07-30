'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { showToast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import { extractApiError } from '@/lib/api';

export default function RegisterPage() {
  const { t } = useI18n();
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const fieldRefMap: Record<string, React.RefObject<HTMLInputElement | null>> = {
    firstName: firstNameRef,
    lastName: lastNameRef,
    email: emailRef,
    phone: phoneRef,
    password: passwordRef,
    confirm: confirmRef,
  };

  const focusFirstError = (errors: Record<string, string>) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey && fieldRefMap[firstKey]) {
      setTimeout(() => fieldRefMap[firstKey].current?.focus(), 0);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email';
    }
    if (!form.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^0[17]\d{8}$/.test(form.phone.trim())) {
      errors.phone = 'Format: 0712345678';
    }
    if (!form.password) {
      errors.password = 'Password is required';
    } else if (form.password.length < 8) {
      errors.password = 'At least 8 characters';
    }
    if (!form.confirm) {
      errors.confirm = 'Please confirm your password';
    } else if (form.password !== form.confirm) {
      errors.confirm = 'Passwords do not match';
    }
    setFieldErrors(errors);
    focusFirstError(errors);
    return Object.keys(errors).length === 0;
  };

  const setFormField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone_number: form.phone.trim(),
      });
      showToast('Account created! Please check your email to verify.', 'success');
      router.push('/login');
    } catch (err: any) {
      const data = err?.response?.data;

      const fieldMapping: Record<string, string> = {
        first_name: 'firstName',
        last_name: 'lastName',
        phone_number: 'phone',
        email: 'email',
        password: 'password',
      };

      const details = data?.error?.details || data;
      let hasFieldErrors = false;
      const newErrors: Record<string, string> = {};
      if (details && typeof details === 'object' && !Array.isArray(details)) {
        for (const [key, val] of Object.entries(details)) {
          const mappedKey = fieldMapping[key] || key;
          const message = Array.isArray(val) ? val[0] : typeof val === 'string' ? val : '';
          if (mappedKey && message) {
            newErrors[mappedKey] = message;
            hasFieldErrors = true;
          }
        }
      }

      if (hasFieldErrors) {
        setFieldErrors((prev) => ({ ...prev, ...newErrors }));
        focusFirstError(newErrors);
        const firstError = Object.values(newErrors)[0];
        if (firstError) showToast(firstError, 'error');
      } else {
        showToast(
          extractApiError(err) || 'Registration failed. Please check your details.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-10 sm:py-16 px-4 bg-grain">
      <div className="w-full max-w-md animate-fade-in-up">
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

          {/* Brand mark — decorative welcome area */}
          <div
            className="relative pt-10 pb-6 px-8 sm:px-10 text-center overflow-hidden"
            style={{ background: 'var(--brand-bg-alt)' }}
          >
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

            <div
              className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--brand-gold-soft) 0%, var(--brand-warm) 100%)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <path d="M20 8l-3 3-2-2" />
                <path d="M23 8l-3 3-2-2" />
              </svg>
            </div>

            <h1
              className="font-serif text-3xl sm:text-4xl font-semibold leading-tight"
              style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
            >
              {t('auth.registerTitle')}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--brand-text-secondary)' }}>
              {t('auth.registerSub')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-4" noValidate>
            {/* Name row */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-firstName" className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>
                  {t('auth.firstName')}
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200" style={{ color: focusedField === 'firstName' ? 'var(--brand-gold)' : 'var(--brand-text-muted)' }} />
                  <input
                    id="reg-firstName"
                    name="firstName"
                    autoComplete="given-name"
                    required
                    value={form.firstName}
                    onChange={(e) => setFormField('firstName', e.target.value)}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField(null)}
                    ref={firstNameRef}
                    placeholder="Jane"
                    className={`w-full rounded-xl text-sm transition-[colors,box-shadow] duration-200 pl-11 pr-4 py-3 ${
                      fieldErrors.firstName
                        ? 'ring-2 ring-red-300 border-red-300'
                        : 'border focus:ring-2 focus:ring-[var(--brand-gold)]/20 focus:border-[var(--brand-gold)]'
                    }`}
                    style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                    aria-invalid={!!fieldErrors.firstName}
                    aria-describedby={fieldErrors.firstName ? 'reg-firstName-error' : undefined}
                  />
                </div>
                {fieldErrors.firstName && <p id="reg-firstName-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert"><span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />{fieldErrors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="reg-lastName" className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>
                  {t('auth.lastName')}
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200" style={{ color: focusedField === 'lastName' ? 'var(--brand-gold)' : 'var(--brand-text-muted)' }} />
                  <input
                    id="reg-lastName"
                    name="lastName"
                    autoComplete="family-name"
                    required
                    value={form.lastName}
                    onChange={(e) => setFormField('lastName', e.target.value)}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                    ref={lastNameRef}
                    placeholder="Doe"
                    className={`w-full rounded-xl text-sm transition-[colors,box-shadow] duration-200 pl-11 pr-4 py-3 ${
                      fieldErrors.lastName
                        ? 'ring-2 ring-red-300 border-red-300'
                        : 'border focus:ring-2 focus:ring-[var(--brand-gold)]/20 focus:border-[var(--brand-gold)]'
                    }`}
                    style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                    aria-invalid={!!fieldErrors.lastName}
                    aria-describedby={fieldErrors.lastName ? 'reg-lastName-error' : undefined}
                  />
                </div>
                {fieldErrors.lastName && <p id="reg-lastName-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert"><span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />{fieldErrors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200" style={{ color: focusedField === 'email' ? 'var(--brand-gold)' : 'var(--brand-text-muted)' }} />
                <input
                  id="reg-email"
                  name="email"
                  autoComplete="email"
                  spellCheck={false}
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setFormField('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => {
                    setFocusedField(null);
                    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
                      setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email' }));
                    }
                  }}
                  ref={emailRef}
                  placeholder="you@email.com"
                  className={`w-full rounded-xl text-sm transition-[colors,box-shadow] duration-200 pl-11 pr-4 py-3 ${
                    fieldErrors.email
                      ? 'ring-2 ring-red-300 border-red-300'
                      : 'border focus:ring-2 focus:ring-[var(--brand-gold)]/20 focus:border-[var(--brand-gold)]'
                  }`}
                  style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'reg-email-error' : undefined}
                />
              </div>
              {fieldErrors.email && <p id="reg-email-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert"><span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />{fieldErrors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="reg-phone" className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>
                {t('auth.phone')}
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200" style={{ color: focusedField === 'phone' ? 'var(--brand-gold)' : 'var(--brand-text-muted)' }} />
                <input
                  id="reg-phone"
                  name="phone"
                  autoComplete="tel"
                  inputMode="numeric"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setFormField('phone', e.target.value)}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  ref={phoneRef}
                  placeholder="0712345678"
                  className={`w-full rounded-xl text-sm transition-[colors,box-shadow] duration-200 pl-11 pr-4 py-3 ${
                    fieldErrors.phone
                      ? 'ring-2 ring-red-300 border-red-300'
                      : 'border focus:ring-2 focus:ring-[var(--brand-gold)]/20 focus:border-[var(--brand-gold)]'
                  }`}
                  style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                  aria-invalid={!!fieldErrors.phone}
                  aria-describedby={fieldErrors.phone ? 'reg-phone-error' : undefined}
                />
              </div>
              {fieldErrors.phone && <p id="reg-phone-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert"><span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />{fieldErrors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200" style={{ color: focusedField === 'password' ? 'var(--brand-gold)' : 'var(--brand-text-muted)' }} />
                <input
                  id="reg-password"
                  name="password"
                  autoComplete="new-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setFormField('password', e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  ref={passwordRef}
                  placeholder="Create a strong password"
                  className={`w-full rounded-xl text-sm transition-[colors,box-shadow] duration-200 pl-11 pr-11 py-3 ${
                    fieldErrors.password
                      ? 'ring-2 ring-red-300 border-red-300'
                      : 'border focus:ring-2 focus:ring-[var(--brand-gold)]/20 focus:border-[var(--brand-gold)]'
                  }`}
                  style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'reg-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-[colors,transform] duration-200 hover:bg-[var(--brand-warm)] active:scale-95"
                  style={{ color: 'var(--brand-text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldErrors.password && <p id="reg-password-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert"><span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />{fieldErrors.password}</p>}
              {form.password && form.password.length > 0 && form.password.length < 8 && (
                <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: 'var(--brand-terra)' }} role="status">
                  <span className="inline-block w-5 h-1 rounded-full" style={{ background: 'var(--brand-terra-soft)' }} />
                  Weak — at least 8 characters
                </p>
              )}
              {form.password.length >= 8 && (
                <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: 'var(--brand-success)' }} role="status">
                  <span className="inline-block w-5 h-1 rounded-full" style={{ background: 'var(--brand-success)' }} />
                  ✓ Strong password
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reg-confirm" className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200" style={{ color: focusedField === 'confirm' ? 'var(--brand-gold)' : 'var(--brand-text-muted)' }} />
                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={(e) => setFormField('confirm', e.target.value)}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  ref={confirmRef}
                  placeholder="Re-enter your password"
                  className={`w-full rounded-xl text-sm transition-[colors,box-shadow] duration-200 pl-11 pr-11 py-3 ${
                    fieldErrors.confirm
                      ? 'ring-2 ring-red-300 border-red-300'
                      : 'border focus:ring-2 focus:ring-[var(--brand-gold)]/20 focus:border-[var(--brand-gold)]'
                  }`}
                  style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                  aria-invalid={!!fieldErrors.confirm}
                  aria-describedby={fieldErrors.confirm ? 'reg-confirm-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-[colors,transform] duration-200 hover:bg-[var(--brand-warm)] active:scale-95"
                  style={{ color: 'var(--brand-text-muted)' }}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldErrors.confirm && <p id="reg-confirm-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert"><span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />{fieldErrors.confirm}</p>}
              {form.confirm && form.password === form.confirm && (
                <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: 'var(--brand-success)' }} role="status">
                  <span className="inline-block w-5 h-1 rounded-full" style={{ background: 'var(--brand-success)' }} />
                  ✓ Passwords match
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold transition-[colors,box-shadow,transform] duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-[var(--brand-gold-dark)] hover:enabled:shadow-warm-md hover:enabled:-translate-y-0.5 active:scale-[0.98]"
              style={{
                background: loading ? 'var(--brand-gold-light)' : 'var(--brand-gold)',
                color: '#FFFFFF',
                boxShadow: loading ? 'none' : '0 2px 8px rgba(139, 105, 20, 0.25)',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('auth.creating')}
                </span>
              ) : (
                <>{t('auth.register')} <ArrowRight size={16} /></>
              )}
            </button>

            {/* Login link */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--brand-border)' }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-[11px] uppercase tracking-[0.12em] font-semibold" style={{ background: '#FFFFFF', color: 'var(--brand-text-muted)' }}>
                  {t('auth.haveAccount')}
                </span>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-[colors,transform] duration-200 border hover:bg-[var(--brand-warm)] active:scale-[0.98]"
              style={{
                borderColor: 'var(--brand-border)',
                color: 'var(--brand-brown)',
                background: 'transparent',
              }}
            >
              {t('auth.signinLink')}
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
