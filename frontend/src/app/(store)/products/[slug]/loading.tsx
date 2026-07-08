export default function Loading() {
  return (
    <div className="container-shell py-6 sm:py-10">
      <div className="mb-5 flex items-center gap-1.5">
        <div className="h-3 w-16 rounded" style={{ background: 'var(--brand-warm)' }} />
        <div className="h-3 w-3" style={{ background: 'var(--brand-warm)' }} />
        <div className="h-3 w-20 rounded" style={{ background: 'var(--brand-warm)' }} />
        <div className="h-3 w-3" style={{ background: 'var(--brand-warm)' }} />
        <div className="h-3 w-32 rounded" style={{ background: 'var(--brand-warm)' }} />
      </div>
      <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
        <div className="aspect-square rounded-2xl animate-pulse" style={{ background: 'var(--brand-warm)' }} />
        <div className="space-y-4">
          <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'var(--brand-warm)' }} />
          <div className="h-10 w-3/4 rounded animate-pulse" style={{ background: 'var(--brand-warm)' }} />
          <div className="h-4 w-32 rounded animate-pulse" style={{ background: 'var(--brand-warm)' }} />
          <div className="h-8 w-28 rounded animate-pulse" style={{ background: 'var(--brand-warm)' }} />
          <div className="space-y-2 mt-4">
            <div className="h-3 w-full rounded animate-pulse" style={{ background: 'var(--brand-warm)' }} />
            <div className="h-3 w-5/6 rounded animate-pulse" style={{ background: 'var(--brand-warm)' }} />
            <div className="h-3 w-4/6 rounded animate-pulse" style={{ background: 'var(--brand-warm)' }} />
          </div>
          <div className="h-12 w-full rounded-full animate-pulse mt-6" style={{ background: 'var(--brand-warm)' }} />
        </div>
      </div>
    </div>
  );
}
