'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

import api from '@/lib/api'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Verification token is missing.')
      return
    }

    const verifyEmail = async () => {
      try {
        const res = await api.post('/api/accounts/verify-email/', { token })
        setStatus('success')
        setMessage(res.data?.message || 'Email verified successfully.')
        setTimeout(() => router.push('/login'), 2500)
      } catch (err: any) {
        setStatus('error')
        setMessage(err?.response?.data?.detail || 'Verification failed. Token may be invalid or expired.')
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <div className="card-soft mx-auto max-w-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-[var(--text-primary)]">
                <Loader2 size={26} className="animate-spin" />
              </span>
              <h1 className="font-display mt-4 text-[36px] text-[var(--text-primary)]">Verifying Email</h1>
            </>
          )}

          {status === 'success' && (
            <>
              <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-[var(--text-primary)]">
                <CheckCircle2 size={26} />
              </span>
              <h1 className="font-display mt-4 text-[36px] text-[var(--text-primary)]">Email Verified</h1>
            </>
          )}

          {status === 'error' && (
            <>
              <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600">
                <XCircle size={26} />
              </span>
              <h1 className="font-display mt-4 text-[36px] text-[var(--text-primary)]">Verification Required</h1>
            </>
          )}

          <p className="mt-3 text-[16px] text-[var(--text-secondary)]">{message}</p>

          {!token && email && status === 'error' && (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              We created your account for <strong>{email}</strong>. Open the verification email we sent, then return here to sign in.
            </p>
          )}

          <button onClick={() => router.push('/login')} className="btn-primary mt-7 inline-flex px-7">
            Go to Login
          </button>
        </div>
      </div>
    </div>
  )
}
