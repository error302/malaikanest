import type { Metadata } from 'next';
import { BestSellersClient } from './best-sellers-client';

export const metadata: Metadata = {
  title: 'Best Sellers',
  description: 'Our most-loved products — top-rated by thousands of Kenyan parents.',
};

export default function BestSellersPage() {
  return <BestSellersClient />;
}
