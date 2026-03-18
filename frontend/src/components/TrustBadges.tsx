import { CheckCircle2, Leaf, ShieldCheck, Truck } from 'lucide-react'

const badges = [
  {
    title: 'Safe Materials',
    subtitle: 'Tested quality essentials',
    icon: Leaf,
  },
  {
    title: 'Fast Delivery',
    subtitle: 'Across Kenya',
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
    <section className="px-4">
      <div className="container-shell p-0">
        <div className="rounded-[18px] border border-default bg-[#d7d7d7] px-5 py-5 md:px-8 md:py-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {badges.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/70 ring-1 ring-black/5">
                    <Icon size={20} className="text-[var(--text-primary)]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[var(--text-primary)]">{item.title}</p>
                    <p className="text-[13px] text-[var(--text-secondary)]">{item.subtitle}</p>
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
