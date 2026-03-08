'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import api from '@/lib/api'
import Turnstile from '@/components/Turnstile'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '', phone: '', first_name: '', last_name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')

  const captchaSiteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || ''
  const captchaRequired = Boolean(captchaSiteKey)

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
        response.data?.warning || 'Account created successfully. Please check your email and verify your address before signing in.'
      )
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (err: any) {
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        const key = Object.keys(data)[0]
        const val = key ? data[key] : 'Registration failed'
        setError(Array.isArray(val) ? String(val[0]) : String(val))
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <div className="mx-auto max-w-xl rounded-[12px] border border-default bg-surface p-6 shadow-[var(--shadow-soft)] md:p-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Account</p>
            <h1 className="font-display mt-3 text-[48px] text-[var(--text-primary)]">Create Account</h1>
            <p className="mt-2 text-[16px] text-[var(--text-secondary)]">Join Malaika Nest to track orders and checkout faster.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {successMessage && <p className="rounded-[12px] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</p>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                First Name
                <input className="input-soft mt-2" name="first_name" value={formData.first_name} onChange={handleChange} required />
              </label>
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Last Name
                <input className="input-soft mt-2" name="last_name" value={formData.last_name} onChange={handleChange} required />
              </label>
            </div>

            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Phone Number
              <input className="input-soft mt-2" name="phone" placeholder="2547..." value={formData.phone} onChange={handleChange} required />
            </label>

            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Email
              <input className="input-soft mt-2" type="email" name="email" value={formData.email} onChange={handleChange} required />
            </label>

            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Password
              <input className="input-soft mt-2" type="password" name="password" value={formData.password} onChange={handleChange} required />
            </label>

            {captchaRequired && <Turnstile siteKey={captchaSiteKey} action="register" onToken={setCaptchaToken} />}

            <button className="btn-primary w-full" type="submit" disabled={loading || (captchaRequired && !captchaToken)}>
              {loading ? 'Creating...' : 'Create account'}
            </button>

            <p className="text-center text-sm text-[var(--text-secondary)]">
              Already have an account? <Link href="/login" className="font-semibold text-[var(--text-primary)] underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
