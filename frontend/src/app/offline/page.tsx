import Link from "next/link";
import { RetryButton } from "./retry-button";

export const metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="mx-auto max-w-md text-center">
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "var(--brand-gold)", opacity: 0.12 }}
          aria-hidden="true"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--brand-gold)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M8.35 2.69A10.98 10.98 0 0112 2c5.52 0 10 4.48 10 10 0 1.29-.25 2.52-.7 3.65M19.08 19.08A9.96 9.96 0 0112 22C6.48 22 2 17.52 2 12c0-2.4.85-4.6 2.26-6.32M9.9 4.24A9.97 9.97 0 0112 4M5 13a7 7 0 00.34 2.17M9.88 9.88a3 3 0 014.24 4.24" />
          </svg>
        </div>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          You&apos;re offline
        </h1>
        <p className="mb-8 text-sm leading-relaxed" style={{ color: "var(--muted-foreground, var(--foreground))", opacity: 0.75 }}>
          It looks like your internet connection dropped. Check your data or Wi-Fi,
          then try again — your cart is saved and waiting for you.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <RetryButton />
          <Link
            href="/"
            className="min-h-[44px] w-full rounded-full border px-6 py-2 text-sm font-semibold leading-[calc(1.25rem+0px)] transition-colors sm:w-auto"
            style={{ borderColor: "var(--border, var(--accent))", color: "var(--foreground)" }}
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
