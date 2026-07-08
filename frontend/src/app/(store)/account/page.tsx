'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { User, Package, Heart, LogOut, MapPin, Settings } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useWishlist } from '@/lib/wishlistContext';
import { showToast } from '@/lib/toast';

export default function AccountPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div className="container-shell py-20 text-center" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>;
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    showToast('Signed out', 'info');
    router.push('/');
  };

  const cards = [
    { href: '/account/orders', Icon: Package, title: 'My Orders', desc: 'Track and review your purchases' },
    { href: '/wishlist', Icon: Heart, title: 'Wishlist', desc: `${wishlistCount} saved item${wishlistCount === 1 ? '' : 's'}` },
    { href: '#addresses', Icon: MapPin, title: 'Addresses', desc: 'Manage shipping addresses' },
    { href: '#settings', Icon: Settings, title: 'Settings', desc: 'Update your preferences' },
  ];

  return (
    <div className="container-shell py-6 sm:py-10 max-w-4xl">
      <div className="flex items-center gap-4 mb-8 p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-gold-soft)' }}>
          <User size={24} style={{ color: 'var(--brand-brown-dark)' }} />
        </div>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            {user.name}
          </h1>
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>{user.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm"
          style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(({ href, Icon, title, desc }) => (
          <Link key={title} href={href} className="p-5 rounded-2xl border transition-all hover:shadow-warm-md" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <Icon size={22} className="mb-3" style={{ color: 'var(--brand-gold)' }} />
            <div className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{title}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
