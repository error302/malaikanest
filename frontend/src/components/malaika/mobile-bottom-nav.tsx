'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { Home, ShoppingBag, Search, ShoppingCart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Shop', href: '/categories', icon: ShoppingBag },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Cart', href: '/cart', icon: ShoppingCart, showBadge: true },
  { name: 'Account', href: '/account', icon: User },
];

const tabVariants = {
  initial: {
    gap: 0,
    paddingLeft: '0.625rem',
    paddingRight: '0.625rem',
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? '0.5rem' : 0,
    paddingLeft: isSelected ? '0.875rem' : '0.625rem',
    paddingRight: isSelected ? '0.875rem' : '0.625rem',
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: 'auto', opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const springTransition: Transition = {
  type: 'spring',
  bounce: 0.15,
  duration: 0.45,
};

export function MobileBottomNav({ cartCount = 0 }: { cartCount?: number }) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const userInitial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <nav
      className="lg:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.25rem)] max-w-md px-1"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-between gap-1 p-1.5 rounded-full border border-[var(--brand-border,#e5e7eb)] bg-white/95 backdrop-blur-md shadow-lg">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/');
          const badgeCount = item.showBadge && item.name === 'Cart' ? cartCount : 0;
          const isAccount = item.name === 'Account';
          const showAvatar = isAccount && isAuthenticated;
          const destinationHref = isAccount ? (isAuthenticated ? '/account' : '/login') : item.href;

          let ariaLabel = item.name;
          if (isAccount && user) {
            ariaLabel = `${item.name} (signed in as ${user.name || user.email})`;
          } else if (item.name === 'Cart' && badgeCount > 0) {
            ariaLabel = `${item.name} (${badgeCount} item${badgeCount === 1 ? '' : 's'})`;
          }

          return (
            <Link
              key={item.name}
              href={destinationHref}
              aria-label={ariaLabel}
              aria-current={active ? 'page' : undefined}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold,#d97706)] rounded-full"
            >
              <motion.div
                variants={tabVariants}
                initial={false}
                animate="animate"
                custom={active}
                transition={springTransition}
                className={cn(
                  'relative flex items-center justify-center h-11 rounded-full text-xs font-semibold transition-colors duration-200 select-none',
                  active
                    ? 'bg-[var(--brand-warm)] text-[var(--brand-brown-dark)] shadow-sm border border-[var(--brand-border)]'
                    : 'text-[var(--brand-text-muted)] hover:text-[var(--brand-text)] hover:bg-[var(--brand-warm)] active:scale-95'
                )}
              >
                <div className="relative flex items-center justify-center">
                  {showAvatar ? (
                    <span
                      className="flex items-center justify-center font-bold text-[11px] rounded-full text-white shadow-xs"
                      style={{
                        width: 22,
                        height: 22,
                        background: active ? 'var(--brand-gold,#d97706)' : 'var(--brand-brown,#78350f)',
                      }}
                    >
                      {userInitial}
                    </span>
                  ) : (
                    <Icon
                      size={20}
                      className={cn('shrink-0 transition-transform duration-200', active && 'scale-105')}
                    />
                  )}

                  {badgeCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] rounded-full text-[9px] font-bold flex items-center justify-center px-1 text-white shadow-xs"
                      style={{ background: 'var(--brand-terra,#ea580c)' }}
                    >
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {active && (
                    <motion.span
                      variants={spanVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={springTransition}
                      className="overflow-hidden whitespace-nowrap text-[12px] font-medium tracking-tight"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
