"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // In production, you would send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error)
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-12">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <svg 
                className="mx-auto h-16 w-16 text-[var(--status-error)]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Something went wrong
            </h1>
            
            <p className="text-[var(--text-secondary)] mb-6">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-[var(--bg-surface)] border border-[var(--status-error)]/30 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-medium text-[var(--status-error)] mb-1">Error:</p>
                <p className="text-xs text-[var(--text-secondary)] font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-[var(--accent)] text-[var(--text-inverse)] font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
              >
                Refresh Page
              </button>
              
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.href = '/'
                }}
                className="w-full px-6 py-3 bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Helper hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      console.error('Component error:', error)
    }
  }, [error])

  const resetError = () => setError(null)

  return { error, setError, resetError }
}
