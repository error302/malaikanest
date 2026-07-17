'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWishlist } from '@/lib/wishlistContext';
import { Home, ShoppingBag, Baby, Heart, ShoppingCart, User } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Shop', href: '/categories', icon: ShoppingBag },
  { name: 'Age', href: '/categories', icon: Baby },
  { name: 'Wishlist', href: '/wishlist', icon: Heart, showBadge: true },
  { name: 'Cart', href: '/cart', icon: ShoppingCart, showBadge: true },
  { name: 'Account', href: '/account', icon: User },
];

export function MobileBottomNav({ cartCount = 0, wishlistCount = 0 }: { cartCount?: number; wishlistCount?: number }) {
  const pathname = usePathname();

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
          const active = pathname === item.href;
          const badgeCount = item.showBadge
            ? item.name === 'Cart'
              ? cartCount
              : item.name === 'Wishlist'
              ? wishlistCount
              : 0
            : 0;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 relative transition-colors"
              style={{ color: active ? 'var(--brand-gold)' : 'var(--brand-text-muted)' }}
              aria-label={item.name}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2 : 1.75} />
                {badgeCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1"
                    style={{
                      background: 'var(--brand-gold)',
                      color: '#FFFFFF',
                    }}
                  >
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
