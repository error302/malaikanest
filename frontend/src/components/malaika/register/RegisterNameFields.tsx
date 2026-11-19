'use client';

import { User } from 'lucide-react';

interface RegisterNameFieldsProps {
  firstName: string;
  lastName: string;
  focusedField: string | null;
  fieldErrors: Record<string, string>;
  firstNameRef: React.RefObject<HTMLInputElement | null>;
  lastNameRef: React.RefObject<HTMLInputElement | null>;
  setFormField: (field: string, value: string) => void;
  setFocusedField: (field: string | null) => void;
  t: (key: string) => string;
}

export function RegisterNameFields({
  firstName,
  lastName,
  focusedField,
  fieldErrors,
  firstNameRef,
  lastNameRef,
  setFormField,
  setFocusedField,
  t,
}: RegisterNameFieldsProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <div>
        <label
          htmlFor="reg-firstName"
          className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block"
          style={{ color: 'var(--brand-text-muted)' }}
        >
          {t('auth.firstName')}
        </label>
        <div className="relative">
          <User
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200"
            style={{
              color: focusedField === 'firstName' ? 'var(--brand-gold)' : 'var(--brand-text-muted)',
            }}
          />
          <input
            id="reg-firstName"
            name="firstName"
            autoComplete="given-name"
            required
            value={firstName}
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
            style={{
              background: 'var(--brand-bg-alt)',
              borderColor: 'var(--brand-border)',
              color: 'var(--brand-text)',
            }}
            aria-invalid={!!fieldErrors.firstName}
            aria-describedby={fieldErrors.firstName ? 'reg-firstName-error' : undefined}
          />
        </div>
        {fieldErrors.firstName && (
          <p id="reg-firstName-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
            <span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
            {fieldErrors.firstName}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="reg-lastName"
          className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block"
          style={{ color: 'var(--brand-text-muted)' }}
        >
          {t('auth.lastName')}
        </label>
        <div className="relative">
          <User
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200"
            style={{
              color: focusedField === 'lastName' ? 'var(--brand-gold)' : 'var(--brand-text-muted)',
            }}
          />
          <input
            id="reg-lastName"
            name="lastName"
            autoComplete="family-name"
            required
            value={lastName}
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
            style={{
              background: 'var(--brand-bg-alt)',
              borderColor: 'var(--brand-border)',
              color: 'var(--brand-text)',
            }}
            aria-invalid={!!fieldErrors.lastName}
            aria-describedby={fieldErrors.lastName ? 'reg-lastName-error' : undefined}
          />
        </div>
        {fieldErrors.lastName && (
          <p id="reg-lastName-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
            <span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
            {fieldErrors.lastName}
          </p>
        )}
      </div>
    </div>
  );
}
