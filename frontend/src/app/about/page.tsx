import Link from 'next/link'
import { CheckCircle2, Leaf, Truck } from 'lucide-react'

const values = [
  {
    title: 'Quality Assured',
    text: 'Every product is selected for safety, comfort, and daily reliability.',
    icon: CheckCircle2,
  },
  {
    title: 'Trusted Sourcing',
    text: 'We prioritize verified suppliers and practical essentials for parents.',
    icon: Leaf,
  },
  {
    title: 'Kenya Delivery',
    text: 'Fast local dispatch with support from order placement to delivery.',
    icon: Truck,
  },
]

export default function AboutPage() {
  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">About</p>
          <h1 className="font-display mt-3 text-[48px] text-[var(--text-primary)]">Malaika Nest</h1>
          <p className="mx-auto mt-3 max-w-3xl text-[18px] text-[var(--text-secondary)]">
            Premium baby and maternity essentials curated for Kenyan families who value comfort, quality, and trust.
          </p>
        </header>

        <section className="card-soft mb-8 p-6 md:p-8">
          <h2 className="text-[28px] font-semibold text-[var(--text-primary)]">Our Story</h2>
          <p className="mt-3 text-[16px] text-[var(--text-secondary)]">
            Malaika Nest was built to make parenting purchases simpler. We focus on practical products that support newborn care,
            feeding, nursery setup, and maternity needs without overwhelming families.
          </p>
          <p className="mt-3 text-[16px] text-[var(--text-secondary)]">
            Every listing you see on the storefront is managed through your admin dashboard, so the catalog always reflects what you
            choose to sell.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {values.map((item) => {
            const Icon = item.icon
            return (
              <article key={item.title} className="card-soft p-6 text-center">
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-secondary)] text-[var(--text-primary)]">
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 text-[22px] font-semibold text-[var(--text-primary)]">{item.title}</h3>
                <p className="mt-2 text-[16px] text-[var(--text-secondary)]">{item.text}</p>
              </article>
            )
          })}
        </section>

        <section className="card-soft mt-8 p-8 text-center">
          <h2 className="text-[28px] font-semibold text-[var(--text-primary)]">Need help choosing products?</h2>
          <p className="mt-2 text-[18px] text-[var(--text-secondary)]">Our support team can guide you before you place an order.</p>
          <Link href="/contact" className="btn-primary mt-6 inline-flex px-7">
            Contact Support
          </Link>
        </section>
      </div>
    </div>
  )
}
