'use client';

import Link from 'next/link';
import { Home, ShoppingBag, Baby, ShoppingCart, User } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Home', href: '#home', icon: Home },
  { name: 'Shop', href: '#shop', icon: ShoppingBag },
  { name: 'Age', href: '#shop-by-age', icon: Baby },
  { name: 'Cart', href: '#cart', icon: ShoppingCart, showBadge: true },
  { name: 'Account', href: '#account', icon: User },
];

export function MobileBottomNav({ cartCount = 0 }: { cartCount?: number }) {
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    // Smooth-scroll to anchor
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--brand-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="flex flex-col items-center justify-center gap-1 flex-1 relative transition-colors"
              style={{ color: 'var(--brand-text-muted)' }}
              aria-label={item.name}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={1.75} />
                {item.showBadge && cartCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1"
                    style={{
                      background: 'var(--brand-gold)',
                      color: '#FFFFFF',
                    }}
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
