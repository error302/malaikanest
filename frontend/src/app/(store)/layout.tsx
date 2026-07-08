import type { Metadata } from 'next';
import { Navbar } from '@/components/malaika/navbar';
import { Footer } from '@/components/malaika/footer';
import { MobileBottomNav } from '@/components/malaika/mobile-bottom-nav';
import { StoreShell } from '@/components/malaika/store-shell';
import { AnnouncementBar } from '@/components/malaika/announcement-bar';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse the Malaika Nest collection of premium baby clothing, essentials, nursery, toys and gifts.',
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreShell
      announcement={<AnnouncementBar />}
      navbar={<Navbar />}
      mobileNav={<MobileBottomNav />}
    >
      {children}
      <Footer />
    </StoreShell>
  );
}
