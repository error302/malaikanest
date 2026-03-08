"use client"

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ background: '#f8fafc', margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1e293b', margin: '0 0 1rem' }}>Something went wrong</h2>
            <p style={{ color: '#64748b', margin: '0 0 2rem', lineHeight: 1.5 }}>
              We encountered a critical error. Our team has been notified.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#8B4513', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', fontSize: '16px' }}
            >
              Refresh Page
            </button>
            <p style={{ marginTop: '1.5rem', fontSize: '14px', color: '#94a3b8' }}>
              If the problem persists, please try clearing your cache or checking your connection.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
