'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface LoginPasswordFieldProps {
  password: string;
  focusedField: string | null;
  error?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  label: string;
}

export function LoginPasswordField({
  password,
  focusedField,
  error,
  inputRef,
  onChange,
  onFocus,
  onBlur,
  label,
}: LoginPasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label
        htmlFor="login-password"
        className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block"
        style={{ color: 'var(--brand-text-muted)' }}
      >
        {label}
      </label>
      <div className="relative">
        <Lock
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200"
          style={{
            color: focusedField === 'password' ? 'var(--brand-gold)' : 'var(--brand-text-muted)',
          }}
        />
        <input
          id="login-password"
          name="password"
          autoComplete="current-password"
          required
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          ref={inputRef}
          placeholder="••••••••"
          className={`w-full rounded-xl text-sm transition-[colors,box-shadow] duration-200 pl-11 pr-11 py-3 ${
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
          aria-describedby={error ? 'login-password-error' : undefined}
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
      {error && (
        <p id="login-password-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
          <span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
