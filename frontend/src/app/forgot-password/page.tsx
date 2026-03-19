"use client"

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

import api from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.post('/api/accounts/password/reset/', { email })
      setSent(true)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-8">
        <div className="container-shell w-full">
          <div className="card-soft mx-auto max-w-md p-8 text-center">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 size={26} />
            </span>
            <h1 className="font-display mt-4 text-[36px] text-[var(--text-primary)]">Check Your Email</h1>
            <p className="mt-3 text-[16px] text-[var(--text-secondary)]">
              Password reset instructions were sent to <strong className="text-[var(--text-primary)]">{email}</strong>.
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Check your spam folder if you don't see the email within a few minutes.
            </p>
            <Link href="/login" className="btn-primary mt-7 inline-flex px-7">Back to Login</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-8">
      <div className="container-shell w-full">
        <div className="card-soft mx-auto max-w-md p-6 md:p-8">
          <h1 className="font-display text-[36px] text-[var(--text-primary)]">Forgot Password</h1>
          <p className="mt-2 text-[16px] text-[var(--text-secondary)]">
            Enter your account email and we will send reset instructions.
          </p>

          {error && (
            <div className="mt-4 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Email Address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-soft mt-2"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Sending...
                </span>
              ) : 'Send Reset Link'}
            </button>
          </form>

          <p className="mt-5 text-sm text-[var(--text-secondary)]">
            Remembered your password? <Link href="/login" className="font-semibold text-[var(--text-primary)] underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
