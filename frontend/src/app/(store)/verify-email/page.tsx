'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, MailCheck, XCircle } from 'lucide-react'

import api, { handleApiError } from '@/lib/api'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [status, setStatus] = useState<'instructions' | 'loading' | 'success' | 'error'>(
    token ? 'loading' : email ? 'instructions' : 'error'
  )
  const [message, setMessage] = useState(
    token
      ? 'Verifying your email...'
      : email
        ? 'We created your account successfully. Please open your email and tap the verification link to continue.'
        : 'Verification token is missing.'
  )
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) {
      if (email) {
        setStatus('instructions')
        setMessage('We created your account successfully. Please open your email and tap the verification link to continue.')
      } else {
        setStatus('error')
        setMessage('Verification token is missing.')
      }
      return
    }

    const verifyEmail = async () => {
      try {
        const res = await api.post('/api/v1/accounts/verify-email/', { token })
        setStatus('success')
        setMessage(res.data?.message || 'Email verified successfully.')
      } catch (err: unknown) {
        setStatus('error')
        setMessage(handleApiError(err, 'Verification failed. Token may be invalid or expired.'))
      }
    }

    verifyEmail()
  }, [email, token])

  const resendVerification = async () => {
    if (!email || resending) return

    setResending(true)
    try {
      const res = await api.post('/api/v1/accounts/resend-verification/', { email })
      setStatus('instructions')
      setMessage(res.data?.message || 'A new verification link has been sent to your email.')
    } catch (err: unknown) {
      setStatus('error')
      setMessage(handleApiError(err, 'We could not resend the verification email right now.'))
    } finally {
      setResending(false)
    }
  }

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

          {status === 'instructions' && (
            <>
              <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-[var(--text-primary)]">
                <MailCheck size={26} />
              </span>
              <h1 className="font-display mt-4 text-[36px] text-[var(--text-primary)]">Check Your Email</h1>
            </>
          )}

          {status === 'success' && (
            <>
              <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-[var(--text-primary)]">
                <CheckCircle2 size={26} />
              </span>
              <h1 className="font-display mt-4 text-[36px] text-[var(--text-primary)]">Email Verified!</h1>
              <p className="mt-3 text-[16px] text-[var(--text-secondary)]">Your email has been verified successfully.</p>
              <button onClick={() => router.push('/login')} className="btn-primary mt-7 inline-flex px-7">
                Continue to Sign In
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600">
                <XCircle size={26} />
              </span>
              <h1 className="font-display mt-4 text-[36px] text-[var(--text-primary)]">
                {token ? 'Verification Failed' : 'Verification Required'}
              </h1>
            </>
          )}

          <p className="mt-3 text-[16px] text-[var(--text-secondary)]">{message}</p>

          {!!email && status === 'instructions' && (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Verification email sent to <strong>{email}</strong>. Please also check your spam or promotions folder.
            </p>
          )}

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {status === 'instructions' && !!email && (
              <button onClick={resendVerification} className="btn-secondary inline-flex px-7" disabled={resending}>
                {resending ? 'Resending…' : 'Resend Email'}
              </button>
            )}
            {status !== 'success' && (
              <button onClick={() => router.push('/')} className="btn-primary inline-flex px-7">
                Go to Website
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
