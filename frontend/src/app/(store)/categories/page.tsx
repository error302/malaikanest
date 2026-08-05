import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-config';
import { CategoriesPageClient } from './categories-client';

export const metadata: Metadata = {
  title: 'Shop Baby & Kids Clothes in Mombasa | Malaika Nest',
  description: 'Browse all organic baby & kids clothing, toys and nursery essentials at Malaika Nest. Filter by age group, category and price. Free delivery in Mombasa & M-Pesa accepted.',
  alternates: { canonical: `${SITE_URL}/categories` },
  openGraph: {
    title: 'Shop Baby & Kids Clothes in Mombasa | Malaika Nest',
    description: 'Browse organic baby clothing, toys & nursery essentials. Filter by age group, category and price. Free delivery in Mombasa.',
    url: `${SITE_URL}/categories`,
  },
};

export default function CategoriesPage() {
  return <CategoriesPageClient />;
}
