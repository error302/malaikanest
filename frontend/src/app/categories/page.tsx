"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Filter, Search } from 'lucide-react'

import api from '../../lib/api'
import ProductCard from '../../components/ProductCard'

interface Category {
  id: number
  name: string
  slug: string
  image: string | null
}

interface Product {
  id: number
  name: string
  slug: string
  price: string
  image: string | null
  category?: { name: string }
  stock?: number
  images?: string[]
}

const priceRanges = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under KES 1,000', min: '0', max: '1000' },
  { label: 'KES 1,000 - 3,000', min: '1000', max: '3000' },
  { label: 'KES 3,000 - 5,000', min: '3000', max: '5000' },
  { label: 'KES 5,000 - 10,000', min: '5000', max: '10000' },
  { label: 'Over KES 10,000', min: '10000', max: '' },
]

const sortOptions = [
  { label: 'Newest First', value: '-created_at' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Name: A-Z', value: 'name' },
  { label: 'Name: Z-A', value: '-name' },
]

export default function CategoriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '-created_at')
  const [priceRange, setPriceRange] = useState('All Prices')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    api
      .get('/api/products/categories/')
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (search) params.set('search', search)
    if (sortBy && sortBy !== '-created_at') params.set('sort', sortBy)
    router.replace(params.toString() ? `/categories?${params.toString()}` : '/categories')
  }, [category, search, sortBy, router])

  useEffect(() => {
    const params: Record<string, string> = {
      page: String(page),
      page_size: '12',
    }

    if (category) params.category = category
    if (search.trim()) params.search = search.trim()
    if (sortBy) params.ordering = sortBy

    const selectedRange = priceRanges.find((range) => range.label === priceRange)
    if (selectedRange?.min) params.price_min = selectedRange.min
    if (selectedRange?.max) params.price_max = selectedRange.max

    setLoadingProducts(true)
    api
      .get('/api/products/products/', { params })
      .then((res) => {
        const data = res.data
        const rows = Array.isArray(data) ? data : data.results || []
        setProducts(rows)
        setTotalPages(data?.count ? Math.max(1, Math.ceil(data.count / 12)) : 1)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [category, search, sortBy, priceRange, page])

  const activeFilterCount = useMemo(() => [category, search.trim(), priceRange !== 'All Prices' ? priceRange : '', sortBy !== '-created_at' ? sortBy : ''].filter(Boolean).length, [category, search, priceRange, sortBy])

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, idx) => idx + 1)
    let start = Math.max(1, page - 2)
    let end = Math.min(totalPages, start + 4)
    if (end - start < 4) start = Math.max(1, end - 4)
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx)
  }, [page, totalPages])

  const clearFilters = () => {
    setCategory('')
    setSearch('')
    setSortBy('-created_at')
    setPriceRange('All Prices')
    setPage(1)
  }

  const onSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
  }

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Catalog</p>
          <h1 className="font-display mt-2 text-[48px] text-[var(--text-primary)]">Shop Collection</h1>
          <p className="mt-3 text-[18px] text-[var(--text-secondary)]">Explore premium baby and maternity products curated for comfort, safety, and everyday ease.</p>
        </div>

        <form onSubmit={onSearchSubmit} className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-soft pl-10"
              placeholder="Search products"
            />
          </div>
          <button type="submit" className="btn-primary px-6">Search</button>
        </form>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="btn-secondary inline-flex items-center gap-2 px-4"
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && <span className="rounded-full bg-[var(--text-primary)] px-2 py-0.5 text-xs text-white">{activeFilterCount}</span>}
          </button>

          {activeFilterCount > 0 && (
            <button type="button" className="btn-secondary px-4" onClick={clearFilters}>
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <section className="mb-8 rounded-[12px] border border-default bg-surface p-4 md:p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Category
                <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} className="input-soft mt-2">
                  <option value="">All Categories</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.slug}>{item.name}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-[var(--text-primary)]">
                Price Range
                <select value={priceRange} onChange={(e) => { setPriceRange(e.target.value); setPage(1) }} className="input-soft mt-2">
                  {priceRanges.map((range) => (
                    <option key={range.label} value={range.label}>{range.label}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-[var(--text-primary)]">
                Sort By
                <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1) }} className="input-soft mt-2">
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        )}

        {!category && (
          <section className="mb-12">
            <h2 className="mb-5 text-[28px] font-semibold text-[var(--text-primary)]">Browse Categories</h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
              {loadingCategories &&
                Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse rounded-[12px] border border-default bg-surface p-3">
                    <div className="aspect-square rounded-[12px] bg-[var(--bg-soft)]" />
                    <div className="mx-auto mt-3 h-4 w-3/4 rounded bg-[var(--bg-soft)]" />
                  </div>
                ))}

              {!loadingCategories &&
                categories.slice(0, 12).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setCategory(item.slug); setPage(1) }}
                    className="group rounded-[12px] border border-default bg-surface p-3 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-[12px] bg-[var(--bg-soft)]">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-primary)]">
                          <span className="font-display text-5xl text-[var(--text-primary)]">{item.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">{item.name}</p>
                  </button>
                ))}
            </div>
          </section>
        )}

        {loadingProducts ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="animate-pulse rounded-[12px] border border-default bg-surface p-4">
                <div className="aspect-square rounded-[12px] bg-[var(--bg-soft)]" />
                <div className="mt-4 h-4 w-2/3 rounded bg-[var(--bg-soft)]" />
                <div className="mt-2 h-4 w-1/2 rounded bg-[var(--bg-soft)]" />
                <div className="mt-4 h-10 rounded bg-[var(--bg-soft)]" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <section className="rounded-[12px] border border-default bg-surface p-12 text-center">
            <h3 className="text-[28px] font-semibold text-[var(--text-primary)]">No products found</h3>
            <p className="mt-2 text-[18px] text-[var(--text-secondary)]">Try adjusting filters or search terms.</p>
            <button type="button" onClick={clearFilters} className="btn-primary mt-6 px-6">Reset Filters</button>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  className="btn-secondary px-4"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>

                {pageNumbers.map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={page === pageNum ? 'btn-primary w-11 px-0' : 'btn-secondary w-11 px-0'}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  className="btn-secondary px-4"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
