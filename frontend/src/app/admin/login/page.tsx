'use client'
import { useState } from 'react'
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
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDF8F5]">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-[#8B4513]">Admin Login</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input className="w-full border rounded-lg px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border rounded-lg px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {captchaRequired && <Turnstile siteKey={captchaSiteKey} action="login" onToken={setCaptchaToken} />}
        <button className="w-full bg-[#8B4513] text-white rounded-lg py-2" type="submit" disabled={loading || (captchaRequired && !captchaToken)}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  )
}
