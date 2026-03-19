'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import Turnstile from '@/components/Turnstile'
import api from '@/lib/api'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
          prompt: () => void
        }
      }
    }
  }
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')

  const captchaSiteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || ''
  const captchaRequired = Boolean(captchaSiteKey)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  const redirect = searchParams.get('redirect') || '/'

  useEffect(() => {
    if (!googleClientId || typeof window === 'undefined') return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
        })
        const buttonDiv = document.getElementById('google-signin-button')
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
            width: '100%',
          })
        }
      }
    }
    document.body.appendChild(script)
  }, [googleClientId])

  const handleGoogleResponse = async (response: any) => {
    if (!response.credential) return
    
    setGoogleLoading(true)
    setError('')

    try {
      const res = await api.post('/api/accounts/google/', {
        token: response.credential,
      })
      await router.push(redirect)
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password, captchaRequired ? captchaToken : undefined)
      router.push(redirect)
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-8">
      <div className="container-shell w-full">
        <div className="mx-auto max-w-md rounded-[12px] border border-default bg-surface p-6 shadow-[var(--shadow-soft)] md:p-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Account</p>
            <h1 className="font-display mt-3 text-[48px] text-[var(--text-primary)]">Sign In</h1>
            <p className="mt-2 text-[16px] text-[var(--text-secondary)]">Welcome back to Malaika Nest.</p>
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
              <Turnstile siteKey={captchaSiteKey} action="login" onToken={setCaptchaToken} />
            )}

            <button
              className="btn-primary w-full"
              type="submit"
              disabled={loading || (captchaRequired && !captchaToken)}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {googleClientId && (
              <>
                <div className="relative flex items-center justify-center">
                  <span className="absolute inset-x-0 border-t border-gray-200"></span>
                  <span className="relative bg-surface px-4 text-sm text-[var(--text-secondary)]">or</span>
                </div>
                <div id="google-signin-button" className={googleLoading ? 'opacity-50 pointer-events-none' : ''}>
                  {googleLoading && (
                    <div className="flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <Link href="/forgot-password" className="underline hover:text-[var(--text-primary)]">
                Forgot password?
              </Link>
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
