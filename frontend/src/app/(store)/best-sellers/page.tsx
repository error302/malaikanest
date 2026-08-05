import type { Metadata } from 'next';
import { BestSellersClient } from './best-sellers-client';

export const metadata: Metadata = {
  title: 'Best Selling Baby Products in Kenya | Malaika Nest',
  description: 'Discover the most-loved baby products trusted by Kenyan parents. Top-rated organic baby clothing, feeding essentials & gifts — delivered across Kenya with M-Pesa.',
  alternates: { canonical: 'https://malaikanest.com/best-sellers' },
  openGraph: {
    title: 'Best Selling Baby Products in Kenya | Malaika Nest',
    description: 'Top-rated organic baby clothing, feeding essentials & gifts trusted by 5,000+ Kenyan families.',
    url: 'https://malaikanest.com/best-sellers',
  },
};

export default function BestSellersPage() {
  return <BestSellersClient />;
}
