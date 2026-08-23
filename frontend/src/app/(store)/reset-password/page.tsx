'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import api, { handleApiError } from '@/lib/api';
import { useHydrated } from '@/lib/use-hydrated';
import { showToast } from '@/lib/toast';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const hydrated = useHydrated();

  if (!token) {
    return (
      <div
        className="p-6 sm:p-8 rounded-2xl border text-center"
        style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
      >
        <div
          className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(196, 112, 74, 0.12)' }}
        >
          <AlertCircle size={28} style={{ color: 'var(--brand-terra)' }} />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>
          Invalid Reset Link
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--brand-text-secondary)' }}>
          This password reset link is missing a valid token or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
          style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/v1/accounts/password/reset/confirm/', {
        token,
        new_password: newPassword,
      });
      setSuccess(true);
      showToast('Password reset successfully! Please log in.', 'success');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      const msg = handleApiError(err, 'Failed to reset password. The link may have expired.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="p-6 sm:p-8 rounded-2xl border text-center animate-fade-in"
        style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
      >
        <div
          className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(45, 90, 66, 0.12)' }}
        >
          <CheckCircle size={28} style={{ color: 'var(--brand-green-light)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>
          Password Reset Complete!
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--brand-text-secondary)' }}>
          Your password has been successfully updated. Redirecting you to login...
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
          style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
        >
          Go to Login <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 sm:p-8 rounded-2xl border space-y-4"
      style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
    >
      {errorMsg && (
        <div
          className="p-3 rounded-xl text-xs font-medium border"
          style={{
            background: 'rgba(196, 112, 74, 0.08)',
            borderColor: 'var(--brand-terra)',
            color: 'var(--brand-terra)',
          }}
          role="alert"
        >
          {errorMsg}
        </div>
      )}

      <div>
        <label
          className="text-xs uppercase tracking-wider font-semibold mb-2 block"
          style={{ color: 'var(--brand-text-muted)' }}
        >
          New Password
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--brand-text-muted)' }}
          />
          <input
            required
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="input-warm w-full pr-10"
            style={{ background: 'var(--brand-bg-alt)' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={0}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
            style={{ color: 'var(--brand-text-muted)' }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {newPassword && newPassword.length < 8 && (
          <p className="mt-1 text-xs" style={{ color: 'var(--brand-text-muted)' }}>
            Must be at least 8 characters
          </p>
        )}
      </div>

      <div>
        <label
          className="text-xs uppercase tracking-wider font-semibold mb-2 block"
          style={{ color: 'var(--brand-text-muted)' }}
        >
          Confirm New Password
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--brand-text-muted)' }}
          />
          <input
            required
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            className="input-warm w-full pr-10"
            style={{ background: 'var(--brand-bg-alt)' }}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            tabIndex={0}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
            style={{ color: 'var(--brand-text-muted)' }}
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {confirmPassword && newPassword === confirmPassword && (
          <p className="mt-1 text-xs text-green-600">✓ Passwords match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!hydrated || loading}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold disabled:opacity-60 transition-all hover:shadow-warm-md"
        style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
      >
        {loading ? 'Resetting Password…' : <>Set New Password <ArrowRight size={16} /></>}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-10 sm:py-16">
      <div className="container-shell w-full max-w-md">
        <div className="text-center mb-8">
          <h1
            className="font-serif text-3xl sm:text-4xl font-semibold mb-2"
            style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
          >
            Set new password
          </h1>
          <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
            Choose a strong password for your account.
          </p>
        </div>
        <Suspense fallback={<div className="text-center py-8 text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
