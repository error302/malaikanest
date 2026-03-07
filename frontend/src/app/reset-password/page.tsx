"use client"

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

import api from '@/lib/api'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token || !email) setError('Invalid reset link.')
  }, [token, email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      await api.post('/api/accounts/password/reset/confirm/', {
        token,
        email,
        new_password: password,
      })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="pb-20 pt-10">
        <div className="container-shell">
          <div className="card-soft mx-auto max-w-xl p-8 text-center">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-[var(--text-primary)]">
              <CheckCircle2 size={26} />
            </span>
            <h1 className="font-display mt-4 text-[36px] text-[var(--text-primary)]">Password Updated</h1>
            <p className="mt-3 text-[16px] text-[var(--text-secondary)]">Your password has been reset successfully. Redirecting to login.</p>
            <Link href="/login" className="btn-primary mt-7 inline-flex px-7">Go to Login</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <div className="card-soft mx-auto max-w-md p-6 md:p-8">
          <h1 className="font-display text-[36px] text-[var(--text-primary)]">Reset Password</h1>
          <p className="mt-2 text-[16px] text-[var(--text-secondary)]">Enter your new password below.</p>

          {error && <p className="mt-4 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              New Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-soft mt-2"
                minLength={8}
                required
              />
            </label>

            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-soft mt-2"
                minLength={8}
                required
              />
            </label>

            <button type="submit" disabled={loading || !token || !email} className="btn-primary w-full disabled:opacity-60">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <p className="mt-5 text-sm text-[var(--text-secondary)]">
            <Link href="/login" className="font-semibold text-[var(--text-primary)] underline">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="pb-20 pt-10"><div className="container-shell text-center text-[var(--text-secondary)]">Loading...</div></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
