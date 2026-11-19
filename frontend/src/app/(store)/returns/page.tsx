import type { Metadata } from 'next';
import Link from 'next/link';
import { RotateCcw, CheckCircle, XCircle, AlertTriangle, ShieldCheck, Clock, Tag, Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: '72-Hour Return & Exchange Policy | Malaika Nest',
  description: 'Malaika Nest strict 72-hour return and exchange policy. Tag requirements, non-returnable hygiene items, and inspection guidelines.',
  alternates: { canonical: 'https://malaikanest.com/returns' },
};

export default function ReturnsPage() {
  return (
    <div className="container-shell py-10 sm:py-16 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3" style={{ background: 'rgba(196, 112, 74, 0.12)' }}>
          <Clock size={14} style={{ color: 'var(--brand-terra)' }} />
          <span className="text-[11px] uppercase tracking-[0.16em] font-bold" style={{ color: 'var(--brand-terra)' }}>
            Strict 72-Hour Policy
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-3 tracking-tight" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Return &amp; Exchange Policy
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>
          To maintain strict hygiene standards for delicate infants and prevent business losses from wardrobing or transit wear, Malaika Nest enforces an airtight 72-hour return and exchange policy.
        </p>
      </div>

      {/* Critical Core Requirements Alert Box */}
      <div
        className="p-5 sm:p-6 rounded-2xl border mb-10"
        style={{
          background: 'rgba(196, 112, 74, 0.06)',
          borderColor: 'var(--brand-terra)',
        }}
      >
        <div className="flex items-start gap-4">
          <AlertTriangle size={24} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-terra)' }} />
          <div>
            <h2 className="text-base font-bold mb-1.5" style={{ color: 'var(--brand-text)' }}>
              Non-Negotiable Criteria for All Returns &amp; Exchanges:
            </h2>
            <ul className="text-xs sm:text-sm space-y-1.5" style={{ color: 'var(--brand-text-secondary)' }}>
              <li>
                <strong>1. 72-Hour Hard Deadline:</strong> Your return or exchange request must be officially submitted within <strong>72 hours (3 calendar days)</strong> of confirmed delivery or shop pickup. Requests sent after 72 hours are strictly void and ineligible.
              </li>
              <li>
                <strong>2. Original Tag Must Be Attached:</strong> For new clothing, the <strong>original factory and brand tags must remain firmly attached, uncut, and untampered</strong>. If a tag is removed, cut off, re-pinned, taped, or missing, the item is <strong>100% ineligible for return or exchange</strong>.
              </li>
              <li>
                <strong>3. Unworn, Unwashed &amp; Odour-Free:</strong> Garments must not have been worn (even once for a photoshoot or event), washed, altered, or exposed to baby lotions, oils, smoke, food, or perfumes.
              </li>
              <li>
                <strong>4. Customer Pays Return Shipping:</strong> The customer is 100% responsible for all return courier costs and redelivery fees. Malaika Nest does not absorb delivery charges for customer-selected sizes or preferences.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Returnable vs Strictly Non-Returnable Grid */}
      <div className="grid sm:grid-cols-2 gap-5 mb-10">
        {/* Eligible Items */}
        <div className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <CheckCircle size={22} style={{ color: 'var(--brand-green-light)' }} />
            <h3 className="font-semibold text-base" style={{ color: 'var(--brand-text)' }}>Eligible for Exchange / Store Credit</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--brand-text-muted)' }}>
            Must meet all 4 conditions above without exception:
          </p>
          <ul className="text-xs sm:text-sm space-y-2.5" style={{ color: 'var(--brand-text-secondary)' }}>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>New clothing items with <strong>original tags fully attached and undamaged</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Reported and dispatched back within <strong>72 hours</strong> of receipt.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Completely pristine, folded in original plastic/packaging.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Accompanied by original Malaika Nest order receipt or receipt number.</span>
            </li>
          </ul>
        </div>

        {/* Strictly Ineligible Items */}
        <div className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <XCircle size={22} style={{ color: 'var(--brand-terra)' }} />
            <h3 className="font-semibold text-base" style={{ color: 'var(--brand-text)' }}>Strictly Non-Returnable (Final Sale)</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--brand-text-muted)' }}>
            Under no circumstances will the shop accept returns on:
          </p>
          <ul className="text-xs sm:text-sm space-y-2.5" style={{ color: 'var(--brand-text-secondary)' }}>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✕</span>
              <span><strong>Any clothing item with tag cut, detached, or missing.</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✕</span>
              <span><strong>Underwear, vests, socks, and layette intimates</strong> (health &amp; hygiene regulation).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✕</span>
              <span><strong>Feeding bottles, pacifiers, teething toys, breast pump parts, and bath care</strong> (strict baby hygiene).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✕</span>
              <span><strong>All Thrifted / Pre-Loved / Mtumba items</strong> (sold as-is with transparent condition grades).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✕</span>
              <span>Items purchased on clearance, promotional sales, or customized items.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Step by step process & inspection */}
      <div className="p-6 sm:p-8 rounded-2xl border mb-10 space-y-6" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center gap-3">
          <RotateCcw size={22} style={{ color: 'var(--brand-gold)' }} />
          <h2 className="font-serif text-xl sm:text-2xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            Step-by-Step Return &amp; Exchange Process
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-xs sm:text-sm">
          <div className="p-4 rounded-xl border" style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)' }}>
            <div className="font-bold text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--brand-gold)' }}>Step 1: Contact Within 72 Hours</div>
            <p style={{ color: 'var(--brand-text-secondary)' }}>
              WhatsApp <strong>+254 726 771 321</strong> or email <strong>hello@malaikanest.com</strong> with your order receipt number, clear photos showing the attached tag, and reason for exchange.
            </p>
          </div>

          <div className="p-4 rounded-xl border" style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)' }}>
            <div className="font-bold text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--brand-gold)' }}>Step 2: Courier Dispatch</div>
            <p style={{ color: 'var(--brand-text-secondary)' }}>
              Once pre-authorized, pack the item securely and dispatch via a tracked courier (or drop off at Tawakal Toto Shop, Mombasa). <strong>Customer pays 100% of return shipping.</strong>
            </p>
          </div>

          <div className="p-4 rounded-xl border" style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)' }}>
            <div className="font-bold text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--brand-gold)' }}>Step 3: Workshop Inspection</div>
            <p style={{ color: 'var(--brand-text-secondary)' }}>
              Our workshop team inspects the tag, fabric, and condition on arrival. If passed, <strong>Store Credit or replacement item</strong> is issued within 48 hours.
            </p>
          </div>
        </div>

        {/* Failed Inspection Disclaimer */}
        <div className="pt-4 border-t text-xs leading-relaxed" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text-muted)' }}>
          <strong style={{ color: 'var(--brand-text)' }}>Important Notice on Failed Inspections:</strong> If a returned package arrives with missing tags, signs of wear, odour, pet hair, wash marks, or after the 72-hour window, the return will be rejected immediately. In such cases, the item will not be replaced, and the customer must pay the return courier fee if they wish to have the declined merchandise shipped back to them.
        </div>
      </div>

      {/* Exchange & Refund Policy Format */}
      <div className="p-6 rounded-2xl border mb-10" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <h3 className="font-serif text-lg font-semibold mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Refunds &amp; Store Credit Rules
        </h3>
        <p className="text-xs sm:text-sm leading-relaxed mb-3" style={{ color: 'var(--brand-text-secondary)' }}>
          Malaika Nest does not issue cash or mobile money refunds for change of mind, incorrect size choices by the buyer (accurate size charts are provided on every product page), or third-party courier transit delays. Approved returns receive <strong>Malaika Nest Store Credit (valid for 6 months)</strong> or a direct size replacement. Original delivery fees are strictly non-refundable.
        </p>
        <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
          If Malaika Nest made an error (e.g. dispatched the wrong size or wrong item), we will cover courier replacement costs to ensure you receive your correct order promptly.
        </p>
      </div>

      {/* Direct Contact for Support */}
      <div className="text-center pt-4">
        <p className="text-xs mb-3" style={{ color: 'var(--brand-text-muted)' }}>
          Questions about sizing or an order received within the last 72 hours?
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://wa.me/254726771321"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold"
            style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
          >
            Chat with Customer Care on WhatsApp
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-xs font-medium"
            style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
          >
            Email Support
          </Link>
        </div>
      </div>
    </div>
  );
}
