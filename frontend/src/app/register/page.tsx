'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

import api from '@/lib/api'
import Turnstile from '@/components/Turnstile'

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

function PasswordStrengthIndicator({ password }: { password: string }) {
  const checks = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }), [password])

  const strength = useMemo(() => {
    const passed = Object.values(checks).filter(Boolean).length
    if (passed === 0 || password.length === 0) return { level: 0, text: '', color: '' }
    if (passed <= 2) return { level: 1, text: 'Weak', color: 'bg-red-500' }
    if (passed <= 3) return { level: 2, text: 'Fair', color: 'bg-yellow-500' }
    if (passed <= 4) return { level: 3, text: 'Good', color: 'bg-blue-500' }
    return { level: 4, text: 'Strong', color: 'bg-green-500' }
  }, [checks, password])

  if (!password) return null

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full ${level <= strength.level ? strength.color : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength.level <= 1 ? 'text-red-600' : strength.level <= 2 ? 'text-yellow-600' : strength.level === 3 ? 'text-blue-600' : 'text-green-600'}`}>
        {strength.text}
      </p>
      <ul className="space-y-0.5 text-xs text-[var(--text-secondary)]">
        <li className={checks.length ? 'text-green-600' : ''}>
          {checks.length ? '✓' : '○'} At least 8 characters
        </li>
        <li className={checks.uppercase ? 'text-green-600' : ''}>
          {checks.uppercase ? '✓' : '○'} 1 uppercase letter
        </li>
        <li className={checks.lowercase ? 'text-green-600' : ''}>
          {checks.lowercase ? '✓' : '○'} 1 lowercase letter
        </li>
        <li className={checks.number ? 'text-green-600' : ''}>
          {checks.number ? '✓' : '○'} 1 number
        </li>
        <li className={checks.special ? 'text-green-600' : ''}>
          {checks.special ? '✓' : '○'} 1 special character
        </li>
      </ul>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '', phone: '', first_name: '', last_name: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')

  const captchaSiteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || ''
  const captchaRequired = Boolean(captchaSiteKey)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

  const handleGoogleResponse = useCallback(async (response: any) => {
    if (!response.credential) return

    setGoogleLoading(true)
    setError('')

    try {
      await api.post('/api/accounts/google/', {
        token: response.credential,
      })
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Google sign-up failed')
    } finally {
      setGoogleLoading(false)
    }
  }, [router])

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
        const buttonDiv = document.getElementById('google-signup-button')
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
  }, [googleClientId, handleGoogleResponse])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const payload: Record<string, string> = { ...formData }
      if (captchaRequired) payload.captcha_token = captchaToken

      const response = await api.post('/api/accounts/register/', payload)
      setSuccessMessage(
        response.data?.warning || 'Account created! Check your email to verify your account before signing in.'
      )
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (err: any) {
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        const key = Object.keys(data)[0]
        const val = key ? data[key] : 'Registration failed'
        if (Array.isArray(val)) {
          setError(val[0] || 'Please check your information and try again.')
        } else if (typeof val === 'object') {
          const msgs = Object.values(val).flat()
          setError(msgs[0] || 'Please check your information and try again.')
        } else {
          setError(String(val) || 'Registration failed. Please try again.')
        }
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-8">
      <div className="container-shell w-full">
        <div className="mx-auto max-w-xl rounded-[12px] border border-default bg-surface p-6 shadow-[var(--shadow-soft)] md:p-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Account</p>
            <h1 className="font-display mt-3 text-[48px] text-[var(--text-primary)]">Create Account</h1>
            <p className="mt-2 text-[16px] text-[var(--text-secondary)]">Join Malaika Nest to track orders and checkout faster.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="rounded-[12px] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                First Name
                <input className="input-soft mt-2" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Jane" autoComplete="given-name" required />
              </label>
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Last Name
                <input className="input-soft mt-2" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Doe" autoComplete="family-name" required />
              </label>
            </div>

            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Phone Number
              <input className="input-soft mt-2" name="phone" placeholder="2547..." value={formData.phone} onChange={handleChange} autoComplete="tel" required />
            </label>

            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Email
              <input className="input-soft mt-2" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="jane@example.com" autoComplete="email" required />
            </label>

            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Password
              <div className="relative">
                <input
                  className="input-soft mt-2 w-full pr-10"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordStrengthIndicator password={formData.password} />
            </label>

            {captchaRequired && <Turnstile siteKey={captchaSiteKey} action="register" onToken={setCaptchaToken} />}

            <button
              className="btn-primary w-full"
              type="submit"
              disabled={loading || (captchaRequired && !captchaToken)}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Creating account...
                </span>
              ) : 'Create account'}
            </button>

            {googleClientId && (
              <>
                <div className="relative flex items-center justify-center">
                  <span className="absolute inset-x-0 border-t border-gray-200"></span>
                  <span className="relative bg-surface px-4 text-sm text-[var(--text-secondary)]">or</span>
                </div>
                <div id="google-signup-button" className={googleLoading ? 'opacity-50 pointer-events-none' : ''}>
                  {googleLoading && (
                    <div className="flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    </div>
                  )}
                </div>
              </>
            )}

            <p className="text-center text-sm text-[var(--text-secondary)]">
              Already have an account? <Link href="/login" className="font-semibold text-[var(--text-primary)] underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
