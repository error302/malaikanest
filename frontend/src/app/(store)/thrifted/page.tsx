import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-config';
import { ThriftedPageClient } from './thrifted-client';

export const metadata: Metadata = {
  title: 'Thrifted Baby & Kids Clothes in Kenya | Malaika Nest',
  description: 'Gently-used, curated baby and kids clothing at a fraction of the price. Quality thrifted items — verified by Malaika Nest and delivered across Kenya with M-Pesa.',
  alternates: { canonical: `${SITE_URL}/thrifted` },
  openGraph: {
    title: 'Thrifted Baby & Kids Clothes | Malaika Nest',
    description: 'Gently-used premium baby & kids clothing at affordable prices. One-of-a-kind items, delivered across Kenya.',
    url: `${SITE_URL}/thrifted`,
  },
};

export default function ThriftedPage() {
  return <ThriftedPageClient />;
}
