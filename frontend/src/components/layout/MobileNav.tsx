'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Baby, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/lib/cartContext';

const MOBILE_NAV_ITEMS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Shop', href: '/categories', icon: ShoppingBag },
  { name: 'Age', href: '/categories', icon: Baby },
  { name: 'Cart', href: '/cart', icon: ShoppingCart, showBadge: true },
  { name: 'Account', href: '/account', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const itemCount = items.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E8E0D5] lg:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full relative ${
                isActive ? 'text-[#8B6914]' : 'text-[#8A7060]'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.showBadge && itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#8B6914] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-[#8B6914]' : 'text-[#8A7060]'}`}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#8B6914] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
