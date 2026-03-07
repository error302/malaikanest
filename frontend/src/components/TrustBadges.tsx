import { CheckCircle2, Leaf, ShieldCheck, Truck } from 'lucide-react'

const badges = [
  {
    title: 'Safe Materials',
    subtitle: 'Baby-safe quality standards',
    icon: Leaf,
  },
  {
    title: 'Fast Delivery',
    subtitle: 'Dispatch across Kenya',
    icon: Truck,
  },
  {
    title: 'Parent Approved',
    subtitle: 'Trusted by families',
    icon: CheckCircle2,
  },
  {
    title: 'Secure Checkout',
    subtitle: 'Protected transactions',
    icon: ShieldCheck,
  },
]

export default function TrustBadges() {
  return (
    <section className="py-16">
      <div className="container-shell">
        <div className="rounded-[12px] border border-default bg-surface p-6 md:p-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {badges.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="flex items-start gap-3 rounded-xl border border-default bg-[var(--bg-primary)] p-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-secondary)] text-[var(--text-primary)]">
                    <Icon size={20} />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-[var(--text-primary)]">{item.title}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{item.subtitle}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
