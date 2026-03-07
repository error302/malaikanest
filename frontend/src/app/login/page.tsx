'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import api from '@/lib/api'
import Turnstile from '@/components/Turnstile'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')

  const captchaSiteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || ''
  const captchaRequired = Boolean(captchaSiteKey)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload: Record<string, string> = { email, password }
      if (captchaRequired) payload.captcha_token = captchaToken

      await api.post('/api/accounts/token/', payload)
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <div className="mx-auto max-w-md rounded-[12px] border border-default bg-surface p-6 shadow-[var(--shadow-soft)] md:p-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Account</p>
            <h1 className="font-display mt-3 text-[48px] text-[var(--text-primary)]">Sign In</h1>
            <p className="mt-2 text-[16px] text-[var(--text-secondary)]">Welcome back to Malaika Nest.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Email
              <input className="input-soft mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Password
              <input className="input-soft mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>

            {captchaRequired && <Turnstile siteKey={captchaSiteKey} action="login" onToken={setCaptchaToken} />}

            <button className="btn-primary w-full" type="submit" disabled={loading || (captchaRequired && !captchaToken)}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <Link href="/forgot-password" className="underline">Forgot password?</Link>
              <span>
                No account?{' '}
                <Link href="/register" className="font-semibold text-[var(--text-primary)] underline">
                  Register
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
