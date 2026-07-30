'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { showToast } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';

export default function RegisterPage() {
  const { t } = useI18n();
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
      if (data && typeof data === 'object') {
        // Map backend field errors to form fields
        const fieldMapping: Record<string, string> = {
          first_name: 'firstName',
          last_name: 'lastName',
          phone_number: 'phone',
          email: 'email',
          password: 'password',
        };
        const newErrors: Record<string, string> = {};
        for (const [key, val] of Object.entries(data)) {
          const mappedKey = fieldMapping[key] || key;
          const message = Array.isArray(val) ? val[0] : typeof val === 'string' ? val : '';
          if (mappedKey && message) {
            newErrors[mappedKey] = message;
          }
        }
        if (Object.keys(newErrors).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...newErrors }));
        } else {
          showToast(data.detail || 'Registration failed. Please check your details.', 'error');
        }
      } else {
        showToast('Registration failed. Please check your details.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-10 sm:py-16 px-4">
      <div className="container-shell w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            {t('auth.registerTitle')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
            {t('auth.registerSub')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl border space-y-4" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>{t('auth.firstName')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setFormField('firstName', e.target.value)}
                  className={`input-warm w-full ${fieldErrors.firstName ? 'ring-2 ring-red-300' : ''}`}
                  style={{ background: 'var(--brand-bg-alt)' }}
                  aria-invalid={!!fieldErrors.firstName}
                />
              </div>
              {fieldErrors.firstName && <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>{t('auth.lastName')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setFormField('lastName', e.target.value)}
                  className={`input-warm w-full ${fieldErrors.lastName ? 'ring-2 ring-red-300' : ''}`}
                  style={{ background: 'var(--brand-bg-alt)' }}
                  aria-invalid={!!fieldErrors.lastName}
                />
              </div>
              {fieldErrors.lastName && <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.lastName}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>{t('auth.email')}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setFormField('email', e.target.value)}
                onBlur={() => {
                  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
                    setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email' }));
                  }
                }}
                className={`input-warm w-full ${fieldErrors.email ? 'ring-2 ring-red-300' : ''}`}
                style={{ background: 'var(--brand-bg-alt)' }}
                aria-invalid={!!fieldErrors.email}
              />
            </div>
            {fieldErrors.email && <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>{t('auth.phone')}</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setFormField('phone', e.target.value)}
                placeholder="0712345678"
                className={`input-warm w-full ${fieldErrors.phone ? 'ring-2 ring-red-300' : ''}`}
                style={{ background: 'var(--brand-bg-alt)' }}
                aria-invalid={!!fieldErrors.phone}
              />
            </div>
            {fieldErrors.phone && <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.phone}</p>}
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>{t('auth.password')}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setFormField('password', e.target.value)}
                className={`input-warm w-full pr-10 ${fieldErrors.password ? 'ring-2 ring-red-300' : ''}`}
                style={{ background: 'var(--brand-bg-alt)' }}
                aria-invalid={!!fieldErrors.password}
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
            {fieldErrors.password && <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.password}</p>}
            {form.password && form.password.length > 0 && form.password.length < 8 && (
              <p className="mt-1 text-xs" style={{ color: 'var(--brand-text-muted)' }} role="status">
                Weak — at least 8 characters
              </p>
            )}
            {form.password.length >= 8 && (
              <p className="mt-1 text-xs text-green-600" role="status">✓ Strong password</p>
            )}
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>{t('auth.confirmPassword')}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
              <input
                required
                type={showConfirm ? 'text' : 'password'}
                value={form.confirm}
                onChange={(e) => setFormField('confirm', e.target.value)}
                className={`input-warm w-full pr-10 ${fieldErrors.confirm ? 'ring-2 ring-red-300' : ''}`}
                style={{ background: 'var(--brand-bg-alt)' }}
                aria-invalid={!!fieldErrors.confirm}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
                style={{ color: 'var(--brand-text-muted)' }}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.confirm && <p className="mt-1 text-xs text-red-500" role="alert">{fieldErrors.confirm}</p>}
            {form.confirm && form.password === form.confirm && (
              <p className="mt-1 text-xs text-green-600" role="status">✓ Passwords match</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
            {loading ? t('auth.creating') : <>{t('auth.register')} <ArrowRight size={16} /></>}
          </button>

          <p className="text-xs text-center mt-5" style={{ color: 'var(--brand-text-muted)' }}>
            {t('auth.haveAccount')}{' '}
            <Link href="/login" className="font-semibold underline min-h-[44px] inline-block leading-tight" style={{ color: 'var(--brand-gold)' }}>{t('auth.signinLink')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
