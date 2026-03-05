'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import DarkModeToggle from '@/components/DarkModeToggle'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if already logged in
    const token = document.cookie.includes('access_token')
    if (token) {
      router.push('/admin')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/api/accounts/token/', { email, password })
      router.push('/admin')
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Invalid credentials'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--pastel-beige)] via-[var(--bg-secondary)] to-[var(--pastel-pink)]/30 dark:from-[var(--bg-primary)] dark:via-[var(--bg-secondary)] dark:to-[var(--pastel-pink)]/10">
      <div className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-xl w-full max-w-md border border-[var(--border)]">
        <div className="flex justify-end mb-4">
          <DarkModeToggle />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--accent)]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Malaika Nest
          </h1>
          <p className="text-[var(--text-muted)] mt-2">Admin Dashboard Login</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm border border-red-100 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-[var(--text-primary)] font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all bg-[var(--bg-secondary)] text-[var(--text-primary)]"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-[var(--text-primary)] font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all bg-[var(--bg-secondary)] text-[var(--text-primary)]"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[var(--accent)] to-[var(--pastel-pink)] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-[var(--accent)] hover:text-[var(--accent-hover)] text-sm transition-colors">
            ← Back to Website
          </Link>
        </div>
      </div>
    </div>
  )
}

