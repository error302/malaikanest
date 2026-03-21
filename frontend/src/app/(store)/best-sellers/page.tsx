"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"

import ProductCard from "@/components/ProductCard"
import api from "@/lib/api"
import { shouldUseUnoptimizedImage } from "@/lib/media"
import {
  AGE_FILTERS,
  AGE_GROUP_FILTERS,
  GENDER_FILTERS,
  SIZE_FILTERS,
} from "@/lib/catalog"

interface Product {
  id: number
  name: string
  slug: string
  price: string
  image: string | null
  category?: { name: string; full_slug?: string }
  stock?: number
  images?: string[]
}

interface BrandOption {
  id: number
  name: string
  slug: string
}

const priceRanges = [
  { label: "All Prices", min: "", max: "" },
  { label: "Under KES 1,000", min: "0", max: "1000" },
  { label: "KES 1,000 - 3,000", min: "1000", max: "3000" },
  { label: "KES 3,000 - 5,000", min: "3000", max: "5000" },
  { label: "KES 5,000 - 10,000", min: "5000", max: "10000" },
  { label: "Over KES 10,000", min: "10000", max: "" },
]

const sortOptions = [
  { label: "Most Popular", value: "-popularity" },
  { label: "Newest First", value: "-created_at" },
  { label: "Price: Low to High", value: "price" },
  { label: "Price: High to Low", value: "-price" },
  { label: "Top Rated", value: "-avg_rating" },
  { label: "Name: A-Z", value: "name" },
]

const availabilityOptions = [
  { label: "All availability", value: "" },
  { label: "In stock", value: "in_stock" },
  { label: "Out of stock", value: "out_of_stock" },
]

const ratingOptions = [
  { label: "All ratings", value: "" },
  { label: "4 stars & up", value: "4" },
  { label: "3 stars & up", value: "3" },
]

export default function BestSellersPage() {
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(24)

  const [sort, setSort] = useState(searchParams.get("sort") || "-popularity")
  const [priceMin, setPriceMin] = useState(searchParams.get("price_min") || "")
  const [priceMax, setPriceMax] = useState(searchParams.get("price_max") || "")
  const [ratingMin, setRatingMin] = useState(searchParams.get("rating_min") || "")
  const [availability, setAvailability] = useState(searchParams.get("availability") || "")
  const [gender, setGender] = useState(searchParams.get("gender") || "")
  const [ageGroup, setAgeGroup] = useState(searchParams.get("age_group") || "")
  const [brand, setBrand] = useState(searchParams.get("brand") || "")
  const [size, setSize] = useState(searchParams.get("size") || "")
  const [search, setSearch] = useState("")

  useEffect(() => {
    api
      .get("/api/products/brands/")
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : res.data?.results || []
        setBrands(rows)
      })
      .catch(() => setBrands([]))
  }, [])

  useEffect(() => {
    setLoadingProducts(true)
    const params: Record<string, string> = {
      ordering: sort,
      page: String(page),
      page_size: String(pageSize),
    }
    if (priceMin) params.price_min = priceMin
    if (priceMax) params.price_max = priceMax
    if (ratingMin) params.rating_min = ratingMin
    if (availability) params.availability = availability
    if (gender) params.gender = gender
    if (ageGroup) params.age_group = ageGroup
    if (brand) params.brand = brand
    if (size) params.size = size
    if (search) params.search = search

    api
      .get("/api/products/products/", { params })
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : res.data?.results || []
        setProducts(rows)
        const total = res.data?.count || 0
        setTotalPages(Math.ceil(total / pageSize))
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [page, sort, priceMin, priceMax, ratingMin, availability, gender, ageGroup, brand, size, search, pageSize])

  const handleSortChange = (value: string) => {
    setSort(value)
    setPage(1)
  }

  const clearFilters = () => {
    setSort("-popularity")
    setPriceMin("")
    setPriceMax("")
    setRatingMin("")
    setAvailability("")
    setGender("")
    setAgeGroup("")
    setBrand("")
    setSize("")
    setSearch("")
    setPage(1)
  }

  const hasActiveFilters = priceMin || priceMax || ratingMin || availability || gender || ageGroup || brand || size || search

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-[var(--text-primary)]">Best Sellers</h1>
          <p className="mt-2 text-[var(--text-secondary)]">Our most popular products loved by customers</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-[var(--bg-card)] rounded-lg p-4 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[var(--text-primary)]">Filters</h2>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm text-[var(--accent)] hover:underline">
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Sort</label>
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Price</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceMin}
                      onChange={(e) => {
                        setPriceMin(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceMax}
                      onChange={(e) => {
                        setPriceMax(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => {
                      setGender(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  >
                    <option value="">All</option>
                    {GENDER_FILTERS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Age Group</label>
                  <select
                    value={ageGroup}
                    onChange={(e) => {
                      setAgeGroup(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  >
                    <option value="">All</option>
                    {AGE_GROUP_FILTERS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Brand</label>
                  <select
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  >
                    <option value="">All Brands</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.slug}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Availability</label>
                  <select
                    value={availability}
                    onChange={(e) => {
                      setAvailability(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  >
                    {availabilityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Rating</label>
                  <select
                    value={ratingMin}
                    onChange={(e) => {
                      setRatingMin(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  >
                    {ratingOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-[var(--bg-card)] rounded-lg overflow-hidden animate-pulse">
                    <div className="aspect-square bg-[var(--bg-secondary)]" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-[var(--bg-secondary)] rounded w-3/4" />
                      <div className="h-4 bg-[var(--bg-secondary)] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-[var(--bg-card)] rounded-lg p-8 text-center">
                <p className="text-[var(--text-secondary)]">No products found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-[var(--text-secondary)]">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
