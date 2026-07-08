import Link from 'next/link';
import { Home, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--brand-cream)' }}>
      <div className="text-center max-w-md">
        {/* Logo mark */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-gold-soft)' }}>
          <Sparkles size={28} style={{ color: 'var(--brand-gold)' }} />
        </div>

        <h1 className="font-serif font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(2.5rem, 8vw, 4rem)', lineHeight: 1 }}>
          404
        </h1>
        <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          This page went on an adventure
        </h2>
        <p className="text-sm mb-7" style={{ color: 'var(--brand-text-secondary)' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back to the little ones!
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
            <Home size={16} /> Back to Home
          </Link>
          <Link href="/categories" className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
            <ShoppingBag size={16} /> Browse Products <ArrowRight size={14} />
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-8 pt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs" style={{ borderTop: '1px solid var(--brand-border)' }}>
          <Link href="/thrifted" className="hover:underline" style={{ color: 'var(--brand-text-muted)' }}>Mtumba</Link>
          <Link href="/best-sellers" className="hover:underline" style={{ color: 'var(--brand-text-muted)' }}>Best Sellers</Link>
          <Link href="/find-us" className="hover:underline" style={{ color: 'var(--brand-text-muted)' }}>Find Us</Link>
          <Link href="/faq" className="hover:underline" style={{ color: 'var(--brand-text-muted)' }}>FAQ</Link>
          <Link href="/contact" className="hover:underline" style={{ color: 'var(--brand-text-muted)' }}>Contact</Link>
        </div>
      </div>
    </div>
  );
}
