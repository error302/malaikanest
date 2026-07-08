'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Image,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Palette,
  Type,
  MessageSquareQuote,
  Sparkles,
  FileText,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useState } from 'react';

const NAV = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', Icon: Package },
  { href: '/admin/thrifted', label: 'Mtumba / Thrifted', Icon: Sparkles },
  { href: '/admin/orders', label: 'Orders', Icon: ShoppingCart },
  { href: '/admin/abandoned-carts', label: 'Abandoned Carts', Icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', Icon: Users },
  { href: '/admin/categories', label: 'Categories', Icon: FolderTree },
  { href: '/admin/blog', label: 'Blog', Icon: FileText },
  { href: '/admin/banners', label: 'Banners', Icon: Image },
  { href: '/admin/branding', label: 'Branding', Icon: Palette },
  { href: '/admin/content', label: 'Content', Icon: Type },
  { href: '/admin/testimonials', label: 'Testimonials', Icon: MessageSquareQuote },
  { href: '/admin/invoices', label: 'Invoices', Icon: FileText },
  { href: '/admin/reports', label: 'Reports', Icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', Icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/admin/login');
      } else if (!isAdmin) {
        router.push('/');
      }
    }
  }, [user, isAdmin, isLoading, router]);

  // Don't render admin chrome on the login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-bg)', color: 'var(--brand-text-muted)' }}>
        Loading admin…
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--brand-bg)' }}>
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r" style={{ background: 'var(--brand-brown-dark)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="p-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand-gold)' }}>
            <span className="font-serif font-bold text-white text-sm">M</span>
          </div>
          <div>
            <div className="font-serif text-sm font-semibold text-white">Malaika Nest</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Admin Panel</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'font-semibold' : ''}`}
                style={{
                  background: active ? 'rgba(139,105,20,0.2)' : 'transparent',
                  color: active ? '#E8D5B5' : 'rgba(255,255,255,0.7)',
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-white truncate">{user.email}</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Administrator</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[200]" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setSidebarOpen(false)}>
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col" style={{ background: 'var(--brand-brown-dark)' }} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand-gold)' }}>
                  <span className="font-serif font-bold text-white text-sm">M</span>
                </div>
                <div className="font-serif text-sm font-semibold text-white">Admin Panel</div>
              </div>
              <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                <X size={20} className="text-white" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5" onClick={() => setSidebarOpen(false)}>
              {NAV.map(({ href, label, Icon }) => {
                const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
                return (
                  <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm" style={{ background: active ? 'rgba(139,105,20,0.2)' : 'transparent', color: active ? '#E8D5B5' : 'rgba(255,255,255,0.7)' }}>
                    <Icon size={16} /> {label}
                  </Link>
                );
              })}
            </nav>
            <button type="button" onClick={handleLogout} className="m-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <LogOut size={16} /> Sign out
            </button>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center px-4 sm:px-6 gap-3" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg" aria-label="Open sidebar">
            <Menu size={18} style={{ color: 'var(--brand-brown)' }} />
          </button>
          <div className="text-sm font-medium" style={{ color: 'var(--brand-text-muted)' }}>Admin</div>
          <div className="ml-auto text-xs" style={{ color: 'var(--brand-text-muted)' }}>
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
