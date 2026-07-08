import type { Metadata } from 'next';
import { Truck, Clock, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping Information',
  description: 'Delivery options, fees and timelines for Malaika Nest orders across Kenya.',
};

const REGIONS = [
  { region: 'Mombasa', timeline: 'Same day (order before 11am)', fee: 'FREE' },
  { region: 'Nairobi', timeline: '1–2 business days', fee: 'KES 300' },
  { region: 'Upcountry', timeline: '2–3 business days', fee: 'KES 500' },
];

export default function ShippingPage() {
  return (
    <div className="container-shell py-10 sm:py-16 max-w-3xl">
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Shipping Information
        </h1>
        <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
          Fast, reliable delivery across Kenya.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {[
          { Icon: Truck, title: 'Free over KES 3,000', desc: 'On all orders countrywide' },
          { Icon: Clock, title: 'Same-day in Mombasa', desc: 'Order before 11am' },
          { Icon: MapPin, title: 'Track every order', desc: 'SMS + email updates' },
        ].map(({ Icon, title, desc }) => (
          <div key={title} className="p-5 rounded-2xl border text-center" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <Icon size={24} className="mx-auto mb-2" style={{ color: 'var(--brand-gold)' }} />
            <div className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{title}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>{desc}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--brand-warm)' }}>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Region</th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Timeline</th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Fee</th>
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

      <div className="mt-8 prose prose-sm">
        <h2 className="font-serif text-xl font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Order Processing</h2>
        <p className="leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>
          Orders are processed within 24 hours of payment confirmation (excluding weekends and public holidays). You&apos;ll receive an order confirmation email immediately, followed by a shipping notification with your tracking number once your parcel leaves our Mombasa workshop.
        </p>
      </div>
    </div>
  );
}
