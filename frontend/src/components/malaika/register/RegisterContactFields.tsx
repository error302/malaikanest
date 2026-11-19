'use client';

import { Mail, Phone } from 'lucide-react';

interface RegisterContactFieldsProps {
  email: string;
  phone: string;
  focusedField: string | null;
  fieldErrors: Record<string, string>;
  emailRef: React.RefObject<HTMLInputElement | null>;
  phoneRef: React.RefObject<HTMLInputElement | null>;
  setFormField: (field: string, value: string) => void;
  setFocusedField: (field: string | null) => void;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  t: (key: string) => string;
}

export function RegisterContactFields({
  email,
  phone,
  focusedField,
  fieldErrors,
  emailRef,
  phoneRef,
  setFormField,
  setFocusedField,
  setFieldErrors,
  t,
}: RegisterContactFieldsProps) {
  return (
    <>
      {/* Email */}
      <div>
        <label
          htmlFor="reg-email"
          className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block"
          style={{ color: 'var(--brand-text-muted)' }}
        >
          {t('auth.email')}
        </label>
        <div className="relative">
          <Mail
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200"
            style={{
              color: focusedField === 'email' ? 'var(--brand-gold)' : 'var(--brand-text-muted)',
            }}
          />
          <input
            id="reg-email"
            name="email"
            autoComplete="email"
            spellCheck={false}
            required
            type="email"
            value={email}
            onChange={(e) => setFormField('email', e.target.value)}
            onFocus={() => setFocusedField('email')}
            onBlur={() => {
              setFocusedField(null);
              if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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
            style={{
              background: 'var(--brand-bg-alt)',
              borderColor: 'var(--brand-border)',
              color: 'var(--brand-text)',
            }}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'reg-email-error' : undefined}
          />
        </div>
        {fieldErrors.email && (
          <p id="reg-email-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
            <span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="reg-phone"
          className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block"
          style={{ color: 'var(--brand-text-muted)' }}
        >
          {t('auth.phone')}
        </label>
        <div className="relative">
          <Phone
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200"
            style={{
              color: focusedField === 'phone' ? 'var(--brand-gold)' : 'var(--brand-text-muted)',
            }}
          />
          <input
            id="reg-phone"
            name="phone"
            autoComplete="tel"
            inputMode="numeric"
            required
            type="tel"
            value={phone}
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
            style={{
              background: 'var(--brand-bg-alt)',
              borderColor: 'var(--brand-border)',
              color: 'var(--brand-text)',
            }}
            aria-invalid={!!fieldErrors.phone}
            aria-describedby={fieldErrors.phone ? 'reg-phone-error' : undefined}
          />
        </div>
        {fieldErrors.phone && (
          <p id="reg-phone-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
            <span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
            {fieldErrors.phone}
          </p>
        )}
      </div>
    </>
  );
}
