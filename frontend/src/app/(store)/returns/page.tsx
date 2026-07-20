import type { Metadata } from 'next';
import { RotateCcw, CheckCircle, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Returns & Refunds',
  description: 'Our 7-day return policy and refund process at Malaika Nest.',
};

export default function ReturnsPage() {
  return (
    <div className="container-shell py-10 sm:py-16 max-w-3xl">
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Returns & Refunds
        </h1>
        <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
          Shop with confidence — your satisfaction is our priority.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <CheckCircle size={24} className="mb-3" style={{ color: 'var(--brand-green-light)' }} />
          <h3 className="font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Returnable items</h3>
          <ul className="text-sm space-y-1" style={{ color: 'var(--brand-text-secondary)' }}>
            <li>• Unused items in original packaging</li>
            <li>• Within 7 days of delivery</li>
            <li>• With original receipt or order number</li>
            <li>• Standard (non-custom) products</li>
          </ul>
        </div>
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <XCircle size={24} className="mb-3" style={{ color: 'var(--brand-terra)' }} />
          <h3 className="font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Non-returnable</h3>
          <ul className="text-sm space-y-1" style={{ color: 'var(--brand-text-secondary)' }}>
            <li>• Custom-made or personalised items</li>
            <li>• Worn or washed clothing</li>
            <li>• Opened feeding bottles or teething toys</li>
            <li>• Gift cards</li>
          </ul>
        </div>
      </div>

      <div className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <RotateCcw size={22} className="mb-3" style={{ color: 'var(--brand-gold)' }} />
        <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)' }}>How to return an item</h2>
        <ol className="space-y-2 text-sm list-decimal list-inside" style={{ color: 'var(--brand-text-secondary)' }}>
          <li>Email hello@malaikanest.com with your order number and the item you wish to return.</li>
          <li>We&apos;ll send you a return authorization and the return address within 24 hours.</li>
          <li>Pack the item securely in its original packaging with all tags attached.</li>
          <li>Ship the parcel — return shipping is the customer&apos;s responsibility unless the item was damaged or incorrect.</li>
          <li>Once we receive and inspect the item, your refund is processed within 5–7 business days to the original payment method.</li>
        </ol>
      </div>
    </div>
  );
}
