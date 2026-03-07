export default function Loading() {
  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <div className="card-soft mx-auto max-w-md p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--text-primary)]" />
          <p className="text-[16px] text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    </div>
  )
}
