export interface CategoryNode {
  id: number
  name: string
  slug: string
  full_slug: string
  description?: string
  image?: string | null
  group?: string
  level?: number
  product_count?: number
  parent?: number | null
  is_top_level?: boolean
  children?: CategoryNode[]
  breadcrumb?: Array<{ name: string; slug: string; full_slug: string }>
}

export const ROOT_CATEGORY_ORDER = [
  'clothing',
  'baby-essentials',
  'nursery',
  'toys',
  'travel',
  'gifts',
] as const

export const AGE_FILTERS = [
  { label: '0-3 months', value: '0-3 months' },
  { label: '3-6 months', value: '3-6 months' },
  { label: '6-12 months', value: '6-12 months' },
  { label: '1-2 years', value: '1-2 years' },
  { label: '2-3 years', value: '2-3 years' },
  { label: '3-5 years', value: '3-5 years' },
  { label: '6-8 years', value: '6-8 years' },
  { label: '9-12 years', value: '9-12 years' },
]

export const SIZE_FILTERS = [
  'newborn',
  '0-3m',
  '3-6m',
  '6-12m',
  '1y',
  '2y',
  '3y',
  '4y',
  '5y',
  '6y',
  '7y',
  '8y',
  '9y',
  '10y',
  '11y',
  '12y',
]

export const GENDER_FILTERS = [
  { label: 'All genders', value: '' },
  { label: 'Boys', value: 'boy' },
  { label: 'Girls', value: 'girl' },
  { label: 'Unisex', value: 'unisex' },
]

export const AGE_GROUP_FILTERS = [
  { label: 'All age groups', value: '' },
  { label: 'Baby (0-2)', value: 'baby' },
  { label: 'Toddler (2-5)', value: 'toddler' },
  { label: 'Kids (6-12)', value: 'kids' },
]

export function orderRootCategories(categories: CategoryNode[]) {
  const order = new Map(ROOT_CATEGORY_ORDER.map((slug, index) => [slug, index]))
  const ordered = [...categories]
    .filter((category) => order.has(category.slug as (typeof ROOT_CATEGORY_ORDER)[number]))
    .sort((a, b) => (order.get(a.slug as (typeof ROOT_CATEGORY_ORDER)[number]) ?? 999) - (order.get(b.slug as (typeof ROOT_CATEGORY_ORDER)[number]) ?? 999))

  if (ordered.length > 0) return ordered

  // Fallback: if the backend slugs don't match our preferred ordering,
  // still show something reasonable (top-level categories, alphabetical).
  const topLevel = [...categories].filter((category) => {
    if (typeof category.is_top_level === "boolean") return category.is_top_level
    if (typeof category.level === "number") return category.level === 0
    if ("parent" in category) return (category.parent ?? null) === null
    return true
  })

  const source = topLevel.length > 0 ? topLevel : [...categories]
  return source.sort((a, b) => a.name.localeCompare(b.name))
}

export function flattenCategoryTree(nodes: CategoryNode[], depth = 0): Array<CategoryNode & { depth: number }> {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...(node.children ? flattenCategoryTree(node.children, depth + 1) : []),
  ])
}

export function buildCategoryHref(category?: Pick<CategoryNode, 'full_slug'> | null) {
  if (!category?.full_slug) return '/categories'
  return `/${category.full_slug}`
}
