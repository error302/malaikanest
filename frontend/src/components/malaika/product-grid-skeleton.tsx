import React from 'react';

interface ProductGridSkeletonProps {
  count?: number;
  columnsClassName?: string;
}

export function ProductGridSkeleton({
  count = 9,
  columnsClassName = 'grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5',
}: ProductGridSkeletonProps) {
  return (
    <div className={columnsClassName}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border animate-pulse"
          style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
        >
          <div className="aspect-[4/5]" style={{ background: 'var(--brand-warm)' }} />
          <div className="p-4 space-y-2">
            <div className="h-3 w-3/4" style={{ background: 'var(--brand-warm)' }} />
            <div className="h-3 w-1/2" style={{ background: 'var(--brand-warm)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
