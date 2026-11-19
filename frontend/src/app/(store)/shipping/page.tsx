import type { Metadata } from 'next';
import Link from 'next/link';
import { Truck, Clock, MapPin, AlertCircle, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Information | Malaika Nest',
  description: 'Delivery timelines, regional shipping fees and free delivery on orders above KES 10,000 across Kenya.',
  alternates: { canonical: 'https://malaikanest.com/shipping' },
};

const REGIONS = [
  { region: 'Mombasa (Town & Environs)', timeline: 'Same day (orders before 11am)', fee: 'KES 250 (Free over KES 10k)' },
  { region: 'Nairobi & Greater Metro', timeline: '1–2 business days', fee: 'KES 300 (Free over KES 10k)' },
  { region: 'Upcountry / Rest of Kenya', timeline: '2–3 business days', fee: 'KES 500 (Free over KES 10k)' },
  { region: 'Self-Pickup (Mombasa Workshop)', timeline: 'Ready in 2 hours', fee: 'FREE (Always)' },
];

export default function ShippingPage() {
  return (
    <div className="container-shell py-10 sm:py-16 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-3 tracking-tight" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Shipping &amp; Delivery Information
        </h1>
        <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--brand-text-secondary)' }}>
          Reliable dispatch from our Mombasa workshop to every corner of Kenya.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {[
          { Icon: Truck, title: 'Free Over KES 10,000', desc: 'On qualifying orders countrywide' },
          { Icon: Clock, title: 'Same-Day Dispatch', desc: 'Mombasa orders placed before 11am' },
          { Icon: MapPin, title: 'Track Every Parcel', desc: 'SMS + email status updates' },
        ].map(({ Icon, title, desc }) => (
          <div key={title} className="p-5 rounded-2xl border text-center" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <Icon size={24} className="mx-auto mb-2" style={{ color: 'var(--brand-gold)' }} />
            <div className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{title}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Free shipping policy banner */}
      <div className="p-4 rounded-xl border mb-8 flex items-start gap-3" style={{ background: 'rgba(196,144,74,0.06)', borderColor: 'var(--brand-border)' }}>
        <ShieldCheck size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-gold)' }} />
        <div className="text-xs sm:text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
          <strong style={{ color: 'var(--brand-text)' }}>Free Delivery Threshold:</strong> Delivery is free for orders whose merchandise subtotal is <strong>KES 10,000 or above</strong>. For orders below KES 10,000, regional delivery rates apply as detailed in the rate schedule below.
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden mb-8" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr style={{ background: 'var(--brand-warm)' }}>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Destination Region</th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Estimated Timeline</th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Standard Courier Fee</th>
            </tr>
          </thead>
          <tbody>
            {REGIONS.map((r) => (
              <tr key={r.region} style={{ borderTop: '1px solid var(--brand-border)' }}>
                <td className="p-4 font-medium" style={{ color: 'var(--brand-text)' }}>{r.region}</td>
                <td className="p-4" style={{ color: 'var(--brand-text-secondary)' }}>{r.timeline}</td>
                <td className="p-4 font-semibold" style={{ color: 'var(--brand-gold)' }}>{r.fee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>
            Order Processing &amp; Dispatch
          </h2>
          <p>
            Orders are processed and packaged within 24 hours of payment receipt (excluding Sundays). Once your parcel is handed to the courier service (Fargo, Speedaf, Wells Fargo, or direct rider), you will receive a tracking update via SMS and email.
          </p>
        </div>

        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>
            Recipient Phone Number &amp; Delivery Acceptance
          </h2>
          <p className="mb-2">
            Couriers contact recipients via phone before final drop-off. Customers are responsible for ensuring that the telephone number provided during checkout is active and reachable.
          </p>
          <p className="text-[11px]" style={{ color: 'var(--brand-text-muted)' }}>
            <strong>72-Hour Inspection Window:</strong> Upon receiving your parcel, please inspect all items immediately. In accordance with our <Link href="/returns" className="underline font-semibold" style={{ color: 'var(--brand-gold)' }}>Return Policy</Link>, any sizing exchange or issue must be reported within <strong>72 hours</strong> with all original brand tags firmly attached.
          </p>
        </div>
      </div>
    </div>
  );
}
