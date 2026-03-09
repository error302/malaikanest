import { notFound } from 'next/navigation'

import CategoryCatalog from '../../components/CategoryCatalog'

const RESERVED_SEGMENTS = new Set([
  'admin',
  'account',
  'about',
  'blog',
  'bundle',
  'cart',
  'categories',
  'checkout',
  'contact',
  'dashboard',
  'faq',
  'forgot-password',
  'login',
  'privacy-policy',
  'products',
  'register',
  'reset-password',
  'returns',
  'shipping',
  'terms-of-service',
  'verify-email',
])

export default async function CategoryPathPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params
  const joined = resolvedParams.slug.join('/')
  if (!joined || RESERVED_SEGMENTS.has(resolvedParams.slug[0])) {
    notFound()
  }

  return <CategoryCatalog initialCategoryPath={joined} />
}
