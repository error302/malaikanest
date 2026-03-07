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
      const responseData = err?.response?.data
      if (responseData?.detail) {
        // Parse specific error messages from backend
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDF8F5] dark:bg-[#0F0F0F]">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-[#8B4513] dark:text-[#FF7A59]">Admin Login</h1>
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        <input 
          className="w-full border border-[#E5E5E5] dark:border-[#333333] rounded-lg px-3 py-2 bg-white dark:bg-[#262626] text-[#111111] dark:text-[#F5F5F5]" 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          className="w-full border border-[#E5E5E5] dark:border-[#333333] rounded-lg px-3 py-2 bg-white dark:bg-[#262626] text-[#111111] dark:text-[#F5F5F5]" 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        {captchaRequired && <Turnstile siteKey={captchaSiteKey} action="login" onToken={setCaptchaToken} />}
        <button 
          className="w-full bg-[#8B4513] dark:bg-[#FF7A59] text-white rounded-lg py-2 disabled:opacity-50" 
          type="submit" 
          disabled={loading || (captchaRequired && !captchaToken)}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
