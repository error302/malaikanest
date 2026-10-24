'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useI18n } from '@/lib/i18n';
import { Home, ShoppingBag, Search, ShoppingCart, User } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Home', nameKey: 'nav.home', href: '/', icon: Home },
  { name: 'Shop', nameKey: 'nav.shop', href: '/categories', icon: ShoppingBag },
  { name: 'Search', nameKey: 'nav.search', href: '/search', icon: Search },
  { name: 'Cart', nameKey: 'nav.cart', href: '/cart', icon: ShoppingCart, showBadge: true },
  { name: 'Account', nameKey: 'nav.account', href: '/account', icon: User },
];

export function MobileBottomNav({ cartCount = 0 }: { cartCount?: number }) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const userInitial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--brand-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/');
          const badgeCount = item.showBadge && item.name === 'Cart' ? cartCount : 0;
          const isAccount = item.name === 'Account';
          const showAvatar = isAccount && isAuthenticated;

          let ariaLabel = t(item.nameKey);
          if (isAccount && user) {
            ariaLabel = t('nav.accountSignedIn', { name: t(item.nameKey), user: user.name || user.email || '?' });
          } else if (item.name === 'Cart' && badgeCount > 0) {
            ariaLabel = t(badgeCount === 1 ? 'nav.cartItem_one' : 'nav.cartItem_other', { name: t(item.nameKey), count: badgeCount });
          }

          return (
            <Link
              key={item.name}
              href={isAccount ? (isAuthenticated ? '/account' : '/login') : item.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 relative transition-all duration-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]"
              style={{ color: active ? 'var(--brand-gold)' : 'var(--brand-text-muted)' }}
              aria-label={ariaLabel}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <span
                  className="absolute top-0 w-8 h-0.5 rounded-full transition-all duration-300"
                  style={{ background: 'var(--brand-gold)' }}
                  aria-hidden
                />
              )}
              <div className="relative">
                {showAvatar ? (
                  <span
                    className="flex items-center justify-center font-semibold text-[12px] rounded-full transition-transform active:scale-95"
                    style={{
                      width: 24,
                      height: 24,
                      background: active ? 'var(--brand-gold)' : 'var(--brand-brown)',
                      color: '#FFFFFF',
                    }}
                  >
                    {userInitial}
                  </span>
                ) : (
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.2 : 1.75}
                    className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}
                  />
                )}
                {badgeCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1 animate-pulse-soft"
                    style={{
                      background: 'var(--brand-terra)',
                      color: '#FFFFFF',
                    }}
                  >
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{t(item.nameKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

