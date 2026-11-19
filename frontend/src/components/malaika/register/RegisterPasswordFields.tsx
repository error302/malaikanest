'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface RegisterPasswordFieldsProps {
  password: string;
  confirm: string;
  focusedField: string | null;
  fieldErrors: Record<string, string>;
  passwordRef: React.RefObject<HTMLInputElement | null>;
  confirmRef: React.RefObject<HTMLInputElement | null>;
  setFormField: (field: string, value: string) => void;
  setFocusedField: (field: string | null) => void;
  t: (key: string) => string;
}

export function RegisterPasswordFields({
  password,
  confirm,
  focusedField,
  fieldErrors,
  passwordRef,
  confirmRef,
  setFormField,
  setFocusedField,
  t,
}: RegisterPasswordFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      {/* Password */}
      <div>
        <label
          htmlFor="reg-password"
          className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block"
          style={{ color: 'var(--brand-text-muted)' }}
        >
          {t('auth.password')}
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
            id="reg-password"
            name="password"
            autoComplete="new-password"
            required
            type={showPassword ? 'text' : 'password'}
            value={password}
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
            style={{
              background: 'var(--brand-bg-alt)',
              borderColor: 'var(--brand-border)',
              color: 'var(--brand-text)',
            }}
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
        {fieldErrors.password && (
          <p id="reg-password-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
            <span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
            {fieldErrors.password}
          </p>
        )}
        {password && password.length > 0 && password.length < 8 && (
          <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: 'var(--brand-terra)' }} role="status">
            <span className="inline-block w-5 h-1 rounded-full" style={{ background: 'var(--brand-terra-soft)' }} />
            Weak — at least 8 characters
          </p>
        )}
        {password.length >= 8 && (
          <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: 'var(--brand-success)' }} role="status">
            <span className="inline-block w-5 h-1 rounded-full" style={{ background: 'var(--brand-success)' }} />
            ✓ Strong password
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label
          htmlFor="reg-confirm"
          className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 block"
          style={{ color: 'var(--brand-text-muted)' }}
        >
          {t('auth.confirmPassword')}
        </label>
        <div className="relative">
          <Lock
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-[colors] duration-200"
            style={{
              color: focusedField === 'confirm' ? 'var(--brand-gold)' : 'var(--brand-text-muted)',
            }}
          />
          <input
            id="reg-confirm"
            name="confirmPassword"
            autoComplete="new-password"
            required
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
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
            style={{
              background: 'var(--brand-bg-alt)',
              borderColor: 'var(--brand-border)',
              color: 'var(--brand-text)',
            }}
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
        {fieldErrors.confirm && (
          <p id="reg-confirm-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
            <span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
            {fieldErrors.confirm}
          </p>
        )}
        {confirm && password === confirm && (
          <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: 'var(--brand-success)' }} role="status">
            <span className="inline-block w-5 h-1 rounded-full" style={{ background: 'var(--brand-success)' }} />
            ✓ Passwords match
          </p>
        )}
      </div>
    </>
  );
}
