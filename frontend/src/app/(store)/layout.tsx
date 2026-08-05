import type { Metadata } from 'next';
import { Footer } from '@/components/malaika/footer';
import { SITE_URL } from '@/lib/site-config';
import { StoreShell } from '@/components/malaika/store-shell';
import { getSiteSettings } from '@/lib/settings';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export const metadata: Metadata = {
  title: 'Shop Premium Baby & Kids Products',
  description: 'Browse the Malaika Nest collection of premium baby clothing, essentials, nursery, toys and gifts — handcrafted in Kenya with love.',
  // NOTE: Do NOT set a canonical here — it would apply to every sub-page.
  // Each individual page must set its own canonical via generateMetadata or
  // export const metadata = { alternates: { canonical: '...' } }
};

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { branding } = await getSiteSettings();

  return (
    <StoreShell branding={branding}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
      <Footer branding={branding} />
    </StoreShell>
  );
}
