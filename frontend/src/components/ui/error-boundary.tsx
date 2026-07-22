'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-[var(--brand-border)]">
          <div className="w-12 h-12 rounded-full bg-[var(--brand-warm)] flex items-center justify-center mb-4">
            <AlertTriangle className="text-[var(--brand-terra)]" size={24} />
          </div>
          <h2 className="font-serif text-lg font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>
            Something went wrong
          </h2>
          <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'var(--brand-text-muted)' }}>
            We couldn&apos;t load this section. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all"
            style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
          >
            <RotateCcw size={16} /> Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
