import Link from 'next/link';
import { CheckCircle, Package, Mail } from 'lucide-react';

export default function CheckoutSuccessPage() {
  return (
    <div className="container-shell py-16 sm:py-24 text-center max-w-xl mx-auto">
      <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(45, 90, 66, 0.12)' }}>
        <CheckCircle size={40} style={{ color: 'var(--brand-green-light)' }} />
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
        Order Confirmed!
      </h1>
      <p className="text-sm mb-7" style={{ color: 'var(--brand-text-secondary)' }}>
        Thank you for your order. We&apos;ve received it and will start preparing your items right away. A confirmation email is on its way to your inbox.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
        <div className="p-4 rounded-xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <Package size={18} className="mb-2" style={{ color: 'var(--brand-gold)' }} />
          <div className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>Order Status</div>
          <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>Processing — we&apos;ll ship within 24h</div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <Mail size={18} className="mb-2" style={{ color: 'var(--brand-gold)' }} />
          <div className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>Confirmation</div>
          <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>Receipt sent to your email</div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/categories" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
          Continue Shopping
        </Link>
        <Link href="/account/orders" className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
          View My Orders
        </Link>
      </div>
    </div>
  );
}
