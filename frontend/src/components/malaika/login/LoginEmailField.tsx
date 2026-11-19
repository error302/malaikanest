'use client';

import { Mail } from 'lucide-react';

interface LoginEmailFieldProps {
  email: string;
  focusedField: string | null;
  error?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  label: string;
}

export function LoginEmailField({
  email,
  focusedField,
  error,
  inputRef,
  onChange,
  onFocus,
  onBlur,
  label,
}: LoginEmailFieldProps) {
  return (
    <div>
      <label
        htmlFor="login-email"
        className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block"
        style={{ color: 'var(--brand-text-muted)' }}
      >
        {label}
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
          id="login-email"
          name="email"
          autoComplete="email"
          spellCheck={false}
          required
          type="email"
          value={email}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          ref={inputRef}
          placeholder="you@email.com"
          className={`w-full rounded-xl text-sm transition-[colors,box-shadow] duration-200 pl-11 pr-4 py-3 ${
            error
              ? 'ring-2 ring-red-300 border-red-300'
              : 'border focus:ring-2 focus:ring-[var(--brand-gold)]/20 focus:border-[var(--brand-gold)]'
          }`}
          style={{
            background: 'var(--brand-bg-alt)',
            borderColor: error ? undefined : 'var(--brand-border)',
            color: 'var(--brand-text)',
          }}
          aria-invalid={!!error}
          aria-describedby={error ? 'login-email-error' : undefined}
        />
      </div>
      {error && (
        <p id="login-email-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
          <span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
