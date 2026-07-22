'use client';

import { useEffect, useState } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setError(new Error(event.message, { cause: event.error }));
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  if (error) {
    return (
      <div className="p-6 rounded-2xl border text-center" style={{ borderColor: 'var(--brand-border)', background: 'var(--card)' }}>
        <p className="font-semibold mb-2" style={{ color: 'var(--brand-terra)' }}>Something went wrong</p>
        <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
          {error.message}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}