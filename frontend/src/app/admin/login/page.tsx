'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Turnstile from '@/components/Turnstile'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')

  const captchaSiteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || ''
  const captchaRequired = Boolean(captchaSiteKey)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload: Record<string, string> = { email, password }
      if (captchaRequired) payload.captcha_token = captchaToken
      await api.post('/api/accounts/admin/login/', payload)

      // Mark that an authenticated admin session exists so the API
      // client will automatically refresh JWT cookies on 401s.
      localStorage.setItem('malaika_token', 'admin_session')

      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      const responseData = err?.response?.data
      if (responseData?.detail) {
        const detail = responseData.detail
        if (detail.includes('No active account found')) {
          setError('Invalid email or password')
        } else if (detail.includes('Admin access required')) {
          setError('Admin access required. This account is not authorized.')
        } else if (detail.includes('locked')) {
          setError('Account temporarily locked. Please try again later.')
        } else {
          setError(detail)
        }
      } else {
        setError('Server temporarily unavailable. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <div className="mx-auto max-w-md rounded-[12px] border border-default bg-surface p-6 shadow-[var(--shadow-soft)] md:p-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Admin Access</p>
            <h1 className="font-display mt-3 text-[48px] text-[var(--text-primary)]">Admin Login</h1>
            <p className="mt-2 text-[16px] text-[var(--text-secondary)]">Welcome to Malaika Nest Admin.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Email
              <input
                className="input-soft mt-2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Password
              <input
                className="input-soft mt-2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {captchaRequired && (
              <Turnstile siteKey={captchaSiteKey} action="admin_login" onToken={setCaptchaToken} />
            )}

            <button
              className="btn-primary w-full"
              type="submit"
              disabled={loading || (captchaRequired && !captchaToken)}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="text-center text-sm text-[var(--text-secondary)]">
              <Link href="/login" className="underline hover:text-[var(--text-primary)]">
                Back to Customer Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
