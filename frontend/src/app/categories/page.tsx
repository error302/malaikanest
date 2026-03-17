import CategoryCatalog from '../../components/CategoryCatalog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Shop Baby & Kids Products | Malaika Nest',
  description: 'Browse our collection of premium baby, toddler, and kids products. Free delivery across Kenya. M-Pesa accepted.',
}

export default function CategoriesPage() {
  return <CategoryCatalog />
}
