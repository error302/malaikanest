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
import { RegisterNameFields } from '@/components/malaika/register/RegisterNameFields';
import { RegisterContactFields } from '@/components/malaika/register/RegisterContactFields';
import { RegisterPasswordFields } from '@/components/malaika/register/RegisterPasswordFields';

export default function RegisterPage() {
  const { t } = useI18n();
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const hydrated = useHydrated();

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
    } else if (!/^0\d{9}$/.test(form.phone.trim())) {
      errors.phone = 'Enter a valid Kenyan number (e.g. 0712345678)';
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
    <AuthCard title={t('auth.registerTitle')} subtitle={t('auth.registerSub')}>
      <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-4" noValidate>
        <RegisterNameFields
          firstName={form.firstName}
          lastName={form.lastName}
          focusedField={focusedField}
          fieldErrors={fieldErrors}
          firstNameRef={firstNameRef}
          lastNameRef={lastNameRef}
          setFormField={setFormField}
          setFocusedField={setFocusedField}
          t={t}
        />

        <RegisterContactFields
          email={form.email}
          phone={form.phone}
          focusedField={focusedField}
          fieldErrors={fieldErrors}
          emailRef={emailRef}
          phoneRef={phoneRef}
          setFormField={setFormField}
          setFocusedField={setFocusedField}
          setFieldErrors={setFieldErrors}
          t={t}
        />

        <RegisterPasswordFields
          password={form.password}
          confirm={form.confirm}
          focusedField={focusedField}
          fieldErrors={fieldErrors}
          passwordRef={passwordRef}
          confirmRef={confirmRef}
          setFormField={setFormField}
          setFocusedField={setFocusedField}
          t={t}
        />

        <button
          type="submit"
          disabled={!hydrated || loading}
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
            <>
              {t('auth.register')} <ArrowRight size={16} />
            </>
          )}
        </button>

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
    </AuthCard>
  );
}
