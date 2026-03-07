"use client"

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ background: 'var(--bg-primary)' }}>
        <div className="pb-20 pt-10">
          <div className="container-shell">
            <div className="card-soft mx-auto max-w-xl p-8 text-center">
              <h2 className="font-display text-[36px] text-[var(--text-primary)]">Something went wrong</h2>
              <p className="mt-3 text-[16px] text-[var(--text-secondary)]">{error.message || 'An unexpected error occurred.'}</p>
              <button onClick={reset} className="btn-primary mt-6 inline-flex px-7">
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
