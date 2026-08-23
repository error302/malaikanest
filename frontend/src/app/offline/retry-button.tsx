"use client";

export function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="min-h-[44px] w-full rounded-full px-6 py-2 text-sm font-semibold transition-opacity hover:opacity-90 sm:w-auto"
      style={{ background: "var(--accent)", color: "var(--paper)" }}
    >
      Try again
    </button>
  );
}
