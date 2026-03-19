"use client"

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'

import api from '@/lib/api'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
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
      const detail = err?.response?.data?.detail || ''
      if (detail.includes('expired')) {
        setError('This reset link has expired. Please request a new one.')
      } else {
        setError('Failed to reset password. The link may be invalid.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-8">
        <div className="container-shell w-full">
          <div className="card-soft mx-auto max-w-md p-8 text-center">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 size={26} />
            </span>
            <h1 className="font-display mt-4 text-[36px] text-[var(--text-primary)]">Password Updated</h1>
            <p className="mt-3 text-[16px] text-[var(--text-secondary)]">Your password has been reset successfully. Redirecting to login...</p>
            <Link href="/login" className="btn-primary mt-7 inline-flex px-7">Go to Login</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-8">
      <div className="container-shell w-full">
        <div className="card-soft mx-auto max-w-md p-6 md:p-8">
          <h1 className="font-display text-[36px] text-[var(--text-primary)]">Reset Password</h1>
          <p className="mt-2 text-[16px] text-[var(--text-secondary)]">Enter your new password below.</p>

          {error && (
            <div className="mt-4 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              New Password
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-soft mt-2 w-full pr-10"
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Confirm Password
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-soft mt-2 w-full pr-10"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading || !token || !email}
              className="btn-primary w-full disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Resetting...
                </span>
              ) : 'Reset Password'}
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
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
