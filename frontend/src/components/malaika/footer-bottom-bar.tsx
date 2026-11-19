import React from 'react';
import Link from 'next/link';

export function FooterBottomBar() {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5"
          style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)', color: '#00A349' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00A349]" />
          M-Pesa Till 3370347
        </span>
        <span
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5"
          style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)', color: '#00A349' }}
        >
          M-Pesa STK Push
        </span>
        <span
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5"
          style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)', color: '#003087' }}
        >
          PayPal
        </span>
        <span
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5"
          style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)', color: '#1A1F71' }}
        >
          Visa / Mastercard
        </span>
        <span
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5"
          style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)', color: 'var(--brand-text-muted)' }}
        >
          256-Bit SSL
        </span>
      </div>

      <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p className="text-[11px]" style={{ color: 'var(--brand-text-muted)' }}>
          &copy; {new Date().getFullYear()} Malaika Nest. Handcrafted with maternal love in Mombasa, Kenya. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <Link
            href="/privacy-policy"
            className="text-[11px] transition-colors hover:text-[var(--brand-gold)]"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="text-[11px] transition-colors hover:text-[var(--brand-gold)]"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            Terms of Service
          </Link>
          <Link
            href="/shipping"
            className="text-[11px] transition-colors hover:text-[var(--brand-gold)]"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            Shipping Policy
          </Link>
          <Link
            href="/returns"
            className="text-[11px] transition-colors hover:text-[var(--brand-gold)]"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            Refund Policy
          </Link>
        </div>
      </div>
    </>
  );
}
