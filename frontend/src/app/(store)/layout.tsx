import type { Metadata } from 'next';
import { Navbar } from '@/components/malaika/navbar';
import { Footer } from '@/components/malaika/footer';
import { MobileBottomNav } from '@/components/malaika/mobile-bottom-nav';
import { StoreShell } from '@/components/malaika/store-shell';
import { AnnouncementBar } from '@/components/malaika/announcement-bar';
import { getSiteSettings } from '@/lib/settings';
import { SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Shop Premium Baby & Kids Products',
  description: 'Browse the Malaika Nest collection of premium baby clothing, essentials, nursery, toys and gifts — handcrafted in Kenya with love.',
  alternates: { canonical: `${SITE_URL}/` },
};

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { branding } = await getSiteSettings();

  return (
    <StoreShell
      branding={branding}
      navbar={<Navbar />}
      mobileNav={<MobileBottomNav />}
    >
      {children}
      <Footer branding={branding} />
    </StoreShell>
  );
}
