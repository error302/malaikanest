import Link from 'next/link'
import { CheckCircle2, Truck } from 'lucide-react'

const zones = [
  { name: 'Mombasa', fee: 'Free', eta: 'Same day or next day' },
  { name: 'Nairobi', fee: 'KES 300', eta: '1-2 business days' },
  { name: 'Upcountry', fee: 'KES 500', eta: '3-5 business days' },
]

const steps = [
  'Order confirmed and payment verified.',
  'Packing and dispatch prepared by our team.',
  'Delivery partner receives and ships.',
  'You receive the package at your provided location.',
]

export default function ShippingPage() {
  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Delivery</p>
          <h1 className="font-display mt-3 text-[48px] text-[var(--text-primary)]">Shipping Information</h1>
          <p className="mx-auto mt-3 max-w-3xl text-[18px] text-[var(--text-secondary)]">
            Transparent delivery timelines and fees across Kenya.
          </p>
        </header>

        <section className="card-soft mb-8 p-6 md:p-8">
          <h2 className="text-[28px] font-semibold text-[var(--text-primary)]">Delivery Zones</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {zones.map((zone) => (
              <article key={zone.name} className="rounded-[12px] border border-default bg-[var(--bg-soft)] p-4">
                <p className="text-[20px] font-semibold text-[var(--text-primary)]">{zone.name}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Delivery Fee: <span className="font-semibold text-[var(--text-primary)]">{zone.fee}</span></p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Estimated Time: {zone.eta}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card-soft mb-8 p-6 md:p-8">
          <h2 className="text-[28px] font-semibold text-[var(--text-primary)]">Delivery Process</h2>
          <ol className="mt-5 space-y-3">
            {steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3 rounded-[12px] border border-default bg-[var(--bg-soft)] p-4">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-sm font-semibold text-[var(--text-primary)]">
                  {index + 1}
                </span>
                <span className="text-[16px] text-[var(--text-secondary)]">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="card-soft p-6 md:p-8">
          <h2 className="text-[28px] font-semibold text-[var(--text-primary)]">Important Notes</h2>
          <ul className="mt-4 space-y-3">
            <li className="flex items-start gap-3 text-[var(--text-secondary)]"><CheckCircle2 size={18} className="mt-0.5" /> Provide accurate delivery address and phone number.</li>
            <li className="flex items-start gap-3 text-[var(--text-secondary)]"><CheckCircle2 size={18} className="mt-0.5" /> Keep your phone available for delivery confirmation calls.</li>
            <li className="flex items-start gap-3 text-[var(--text-secondary)]"><Truck size={18} className="mt-0.5" /> For urgent support, contact us directly and include your order number.</li>
          </ul>

          <div className="mt-6">
            <Link href="/contact" className="btn-primary inline-flex px-7">Contact Delivery Support</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
