'use client';

const BADGES = [
  { label: 'Made in Kenya' },
  { label: 'Organic Cotton' },
  { label: 'OEKO-TEX Standard' },
  { label: 'Hypoallergenic' },
];

export function ProductTrustBadges() {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6"
      style={{ borderTop: '1px solid var(--brand-border)' }}
    >
      {BADGES.map((b) => (
        <div
          key={b.label}
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'var(--brand-green-soft, #E8F0EB)' }}
        >
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold flex-shrink-0"
            style={{ background: 'var(--brand-success, #4A7C59)', color: '#FFFFFF' }}
            aria-hidden
          >
            ✓
          </span>
          <span className="text-[12px] font-medium leading-tight" style={{ color: 'var(--brand-text)' }}>
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}
