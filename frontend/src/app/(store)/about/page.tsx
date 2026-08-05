import type { Metadata } from 'next';
import { Heart, Baby, Truck, Shield, Leaf } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Malaika Nest — Baby Shop in Mombasa, Kenya',
  description: "Malaika Nest is Mombasa's premium baby store handcrafting organic clothing and curating quality essentials for ages 0–12. Learn our story, mission and why 5,000+ Kenyan families trust us.",
  alternates: { canonical: 'https://malaikanest.com/about' },
  openGraph: {
    title: 'About Malaika Nest — Mombasa Baby Shop',
    description: "Malaika Nest is Mombasa's premium baby store. Handcrafted organic baby clothing & essentials made with love in Kenya.",
    url: 'https://malaikanest.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="container-shell py-10 sm:py-16 max-w-3xl">
      <div className="text-center mb-10">
        <span className="section-label justify-center mb-3">Our story</span>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold mt-3 mb-4" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Made with love in Kenya
        </h1>
        <p className="text-base leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>
          Malaika Nest was born from a simple belief: every child deserves the softest, safest, most beautiful beginnings. From our home in Mombasa, we handcraft organic cotton clothing and curate premium essentials for little ones aged 0–12 years — delivered with care across Kenya.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {[
          { Icon: Leaf, title: 'Organic & Safe', desc: 'OEKO-TEX certified organic cotton, gentle on delicate skin.' },
          { Icon: Heart, title: 'Handcrafted', desc: 'Every piece is made by hand in our Mombasa workshop.' },
          { Icon: Truck, title: 'Countrywide Delivery', desc: 'Same-day in Mombasa, 1–3 days across Kenya.' },
          { Icon: Shield, title: 'Parent Approved', desc: 'Trusted by 5,000+ Kenyan families since 2024.' },
        ].map(({ Icon, title, desc }) => (
          <div key={title} className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <Icon size={24} className="mb-3" style={{ color: 'var(--brand-gold)' }} />
            <h3 className="font-semibold mb-1" style={{ color: 'var(--brand-text)' }}>{title}</h3>
            <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>{desc}</p>
          </div>
        ))}
      </div>

      <section className="prose prose-sm max-w-none">
        <h2 className="font-serif text-2xl font-semibold mb-3" style={{ color: 'var(--brand-text)' }}>Our Promise</h2>
        <p className="leading-relaxed mb-4" style={{ color: 'var(--brand-text-secondary)' }}>
          When you shop with Malaika Nest, you&apos;re choosing more than clothing. You&apos;re choosing a community of makers, parents and dreamers who believe that the little things matter most. Every stitch, every fabric, every package is an act of care — because your little one deserves nothing less.
        </p>
        <h2 className="font-serif text-2xl font-semibold mb-3 mt-8" style={{ color: 'var(--brand-text)' }}>Sustainability</h2>
        <p className="leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>
          We use plastic-free packaging, source organic cotton from certified farms, and partner with local artisans to reduce our carbon footprint. Our workshop runs on renewable energy and we donate a portion of every sale to maternal health initiatives in coastal Kenya.
        </p>
      </section>
    </div>
  );
}
