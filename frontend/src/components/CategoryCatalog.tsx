"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Filter, Search } from "lucide-react"

import ProductCard from "@/components/ProductCard"
import api from "../lib/api"
import { shouldUseUnoptimizedImage } from "../lib/media"
import {
  AGE_FILTERS,
  AGE_GROUP_FILTERS,
  buildCategoryHref,
  CategoryNode,
  flattenCategoryTree,
  GENDER_FILTERS,
  orderRootCategories,
  SIZE_FILTERS,
} from "../lib/catalog"

const getFallbackCategories = (): CategoryNode[] => [
  {
    id: 100,
    name: "Clothing",
    slug: "clothing",
    full_slug: "clothing",
    description: "Apparel for babies, toddlers, and kids up to 12 years old.",
    children: [
      { id: 101, name: "Baby", slug: "baby", full_slug: "clothing/baby", description: "Clothing for newborns and babies from 0 to 2 years.", children: [] },
      { id: 102, name: "Toddler", slug: "toddler", full_slug: "clothing/toddler", description: "Clothing for toddlers from 2 to 5 years.", children: [] },
      { id: 103, name: "Kids (6-12)", slug: "kids", full_slug: "clothing/kids", description: "Clothing for ages 6 to 12.", children: [] },
    ],
  },
  {
    id: 200,
    name: "Baby Essentials",
    slug: "baby-essentials",
    full_slug: "baby-essentials",
    description: "Daily baby care essentials for feeding, diapering, bath time, and health.",
    children: [
      { id: 201, name: "Feeding", slug: "feeding", full_slug: "baby-essentials/feeding", description: "", children: [] },
      { id: 202, name: "Diapering", slug: "diapering", full_slug: "baby-essentials/diapering", description: "", children: [] },
      { id: 203, name: "Bath & Baby Care", slug: "bath-baby-care", full_slug: "baby-essentials/bath-baby-care", description: "", children: [] },
      { id: 204, name: "Baby Health", slug: "baby-health", full_slug: "baby-essentials/baby-health", description: "", children: [] },
    ],
  },
  {
    id: 300,
    name: "Nursery",
    slug: "nursery",
    full_slug: "nursery",
    description: "Furniture, bedding, and decor for a cozy nursery setup.",
    children: [
      { id: 301, name: "Cribs", slug: "cribs", full_slug: "nursery/cribs", description: "", children: [] },
      { id: 302, name: "Mattresses", slug: "mattresses", full_slug: "nursery/mattresses", description: "", children: [] },
      { id: 303, name: "Bedding", slug: "bedding", full_slug: "nursery/bedding", description: "", children: [] },
    ],
  },
  {
    id: 400,
    name: "Toys & Learning",
    slug: "toys",
    full_slug: "toys",
    description: "Playtime and learning essentials for every growth stage.",
    children: [
      { id: 401, name: "Soft Toys", slug: "soft-toys", full_slug: "toys/soft-toys", description: "", children: [] },
      { id: 402, name: "Educational Toys", slug: "educational", full_slug: "toys/educational", description: "", children: [] },
      { id: 403, name: "Teething Toys", slug: "teething-toys", full_slug: "toys/teething-toys", description: "", children: [] },
    ],
  },
  {
    id: 500,
    name: "Travel & Safety",
    slug: "travel",
    full_slug: "travel",
    description: "On-the-go gear and safety essentials for every outing.",
    children: [
      { id: 501, name: "Strollers", slug: "strollers", full_slug: "travel/strollers", description: "", children: [] },
      { id: 502, name: "Car Seats", slug: "car-seats", full_slug: "travel/car-seats", description: "", children: [] },
      { id: 503, name: "Baby Carriers", slug: "baby-carriers", full_slug: "travel/baby-carriers", description: "", children: [] },
    ],
  },
  {
    id: 600,
    name: "Gifts",
    slug: "gifts",
    full_slug: "gifts",
    description: "Thoughtful gift collections for newborns, showers, and celebrations.",
    children: [
      { id: 601, name: "Baby Gift Sets", slug: "baby-gift-sets", full_slug: "gifts/baby-gift-sets", description: "", children: [] },
      { id: 602, name: "Baby Shower Gifts", slug: "baby-shower-gifts", full_slug: "gifts/baby-shower-gifts", description: "", children: [] },
      { id: 603, name: "Newborn Starter Kits", slug: "newborn-starter-kits", full_slug: "gifts/newborn-starter-kits", description: "", children: [] },
    ],
  },
]

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
  { label: "Newest First", value: "-created_at" },
  { label: "Price: Low to High", value: "price" },
  { label: "Price: High to Low", value: "-price" },
  { label: "Most Popular", value: "-popularity" },
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

export default function CategoryCatalog({ initialCategoryPath = "" }: { initialCategoryPath?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [flatCategories, setFlatCategories] = useState<CategoryNode[]>([])
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [categoryPath, setCategoryPath] = useState(initialCategoryPath || searchParams.get("category_path") || "")
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "-created_at")
  const [priceRange, setPriceRange] = useState(searchParams.get("price") || "All Prices")
  const [brand, setBrand] = useState(searchParams.get("brand") || "")
  const [ratingMin, setRatingMin] = useState(searchParams.get("rating") || "")
  const [gender, setGender] = useState(searchParams.get("gender") || "")
  const [ageGroup, setAgeGroup] = useState(searchParams.get("age_group") || "")
  const [ageRange, setAgeRange] = useState(searchParams.get("age_range") || "")
  const [size, setSize] = useState(searchParams.get("size") || "")
  const [availability, setAvailability] = useState(searchParams.get("availability") || "")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setCategoryPath(initialCategoryPath || searchParams.get("category_path") || searchParams.get("category") || "")
  }, [initialCategoryPath, searchParams])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/api/products/categories/")
        const data = Array.isArray(res.data) ? res.data : res.data?.results || []
        setCategories(data)
      } catch (error) {
        console.error('Failed to load categories:', error)
        setCategories(getFallbackCategories())
      } finally {
        setLoadingCategories(false)
      }
    }

    const fetchFlatCategories = async () => {
      try {
        const res = await api.get("/api/products/categories/?flat=1")
        setFlatCategories(Array.isArray(res.data) ? res.data : [])
      } catch (error) {
        console.error('Failed to load flat categories:', error)
      }
    }

    const fetchBrands = async () => {
      try {
        const res = await api.get("/api/products/brands/")
        setBrands(Array.isArray(res.data) ? res.data : [])
      } catch (error) {
        console.error('Failed to load brands:', error)
      }
    }

    fetchCategories()
    fetchFlatCategories()
    fetchBrands()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (search.trim()) params.set("search", search.trim())
    if (sortBy && sortBy !== "-created_at") params.set("sort", sortBy)
    if (priceRange !== "All Prices") params.set("price", priceRange)
    if (brand) params.set("brand", brand)
    if (ratingMin) params.set("rating", ratingMin)
    if (gender) params.set("gender", gender)
    if (ageGroup) params.set("age_group", ageGroup)
    if (ageRange) params.set("age_range", ageRange)
    if (size) params.set("size", size)
    if (availability) params.set("availability", availability)

    const nextPath = categoryPath ? `/${categoryPath}` : "/categories"
    const nextUrl = params.toString() ? `${nextPath}?${params.toString()}` : nextPath
    if (pathname !== nextPath || searchParams.toString() !== params.toString()) {
      router.replace(nextUrl)
    }
  }, [ageGroup, ageRange, availability, brand, categoryPath, gender, pathname, priceRange, ratingMin, router, search, searchParams, size, sortBy])

  useEffect(() => {
    const params: Record<string, string> = {
      page: String(page),
      page_size: "12",
      ordering: sortBy,
    }

    if (categoryPath) params.category_path = categoryPath
    if (search.trim()) params.search = search.trim()
    if (brand) params.brand = brand
    if (ratingMin) params.rating_min = ratingMin
    if (gender) params.gender = gender
    if (ageGroup) params.age_group = ageGroup
    if (ageRange) params.age_range = ageRange
    if (size) params.size = size
    if (availability) params.availability = availability

    const selectedRange = priceRanges.find((range) => range.label === priceRange)
    if (selectedRange?.min) params.price_min = selectedRange.min
    if (selectedRange?.max) params.price_max = selectedRange.max

    setLoadingProducts(true)
    api
      .get("/api/products/products/", { params })
      .then((res) => {
        const data = res.data
        const rows = Array.isArray(data) ? data : data.results || []
        setProducts(rows)
        setTotalPages(data?.count ? Math.max(1, Math.ceil(data.count / 12)) : 1)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [ageGroup, ageRange, availability, brand, categoryPath, gender, page, priceRange, ratingMin, search, size, sortBy])

  const orderedRoots = useMemo(() => orderRootCategories(categories), [categories])
  const flatCategoryOptions = useMemo(() => flattenCategoryTree(orderedRoots), [orderedRoots])
  const selectedCategory = useMemo(
    () => flatCategories.find((category) => category.full_slug === categoryPath) || flatCategoryOptions.find((category) => category.full_slug === categoryPath),
    [categoryPath, flatCategories, flatCategoryOptions]
  )

  const activeFilterCount = useMemo(
    () => [categoryPath, search.trim(), priceRange !== "All Prices" ? priceRange : "", brand, ratingMin, gender, ageGroup, ageRange, size, availability, sortBy !== "-created_at" ? sortBy : ""].filter(Boolean).length,
    [ageGroup, ageRange, availability, brand, categoryPath, gender, priceRange, ratingMin, search, size, sortBy]
  )

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, idx) => idx + 1)
    let start = Math.max(1, page - 2)
    let end = Math.min(totalPages, start + 4)
    if (end - start < 4) start = Math.max(1, end - 4)
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx)
  }, [page, totalPages])

  const clearFilters = () => {
    setCategoryPath(initialCategoryPath || "")
    setSearch("")
    setSortBy("-created_at")
    setPriceRange("All Prices")
    setBrand("")
    setRatingMin("")
    setGender("")
    setAgeGroup("")
    setAgeRange("")
    setSize("")
    setAvailability("")
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
          <h1 className="font-display mt-2 text-[48px] text-[var(--text-primary)]">
            {selectedCategory ? selectedCategory.name : "Shop Collection"}
          </h1>
          <p className="mt-3 max-w-3xl text-[18px] text-[var(--text-secondary)]">
            {selectedCategory?.description || "Explore premium baby, toddler, and kids products curated for comfort, safety, and everyday ease."}
          </p>
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Category
                <select value={categoryPath} onChange={(e) => { setCategoryPath(e.target.value); setPage(1) }} className="input-soft mt-2">
                  <option value="">All Categories</option>
                  {flatCategoryOptions.map((item) => (
                    <option key={item.id} value={item.full_slug}>{`${"- ".repeat(item.depth)}${item.name}`}</option>
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
                Brand
                <select value={brand} onChange={(e) => { setBrand(e.target.value); setPage(1) }} className="input-soft mt-2">
                  <option value="">All Brands</option>
                  {brands.map((item) => (
                    <option key={item.id} value={item.slug}>{item.name}</option>
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

              <label className="text-sm font-medium text-[var(--text-primary)]">
                Rating
                <select value={ratingMin} onChange={(e) => { setRatingMin(e.target.value); setPage(1) }} className="input-soft mt-2">
                  {ratingOptions.map((option) => (
                    <option key={option.label} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-[var(--text-primary)]">
                Gender
                <select value={gender} onChange={(e) => { setGender(e.target.value); setPage(1) }} className="input-soft mt-2">
                  {GENDER_FILTERS.map((option) => (
                    <option key={option.label} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-[var(--text-primary)]">
                Age Group
                <select value={ageGroup} onChange={(e) => { setAgeGroup(e.target.value); setPage(1) }} className="input-soft mt-2">
                  {AGE_GROUP_FILTERS.map((option) => (
                    <option key={option.label} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-[var(--text-primary)]">
                Age Range
                <select value={ageRange} onChange={(e) => { setAgeRange(e.target.value); setPage(1) }} className="input-soft mt-2">
                  <option value="">All Age Ranges</option>
                  {AGE_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-[var(--text-primary)]">
                Size
                <select value={size} onChange={(e) => { setSize(e.target.value); setPage(1) }} className="input-soft mt-2">
                  <option value="">All Sizes</option>
                  {SIZE_FILTERS.map((option) => (
                    <option key={option} value={option}>{option.toUpperCase()}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-[var(--text-primary)]">
                Availability
                <select value={availability} onChange={(e) => { setAvailability(e.target.value); setPage(1) }} className="input-soft mt-2">
                  {availabilityOptions.map((option) => (
                    <option key={option.label} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        )}

        {!categoryPath && (
          <section className="mb-12">
            <h2 className="mb-5 text-[28px] font-semibold text-[var(--text-primary)]">Browse Main Categories</h2>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {loadingCategories &&
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse rounded-[12px] border border-default bg-surface p-3">
                    <div className="aspect-[4/3] rounded-[12px] bg-[var(--bg-soft)]" />
                    <div className="mx-auto mt-3 h-4 w-3/4 rounded bg-[var(--bg-soft)]" />
                  </div>
                ))}

              {!loadingCategories &&
                orderedRoots.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setCategoryPath(item.full_slug); setPage(1) }}
                    className="group rounded-[12px] border border-default bg-surface p-4 text-left shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[var(--bg-soft)]">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover transition duration-500 group-hover:scale-105" unoptimized={shouldUseUnoptimizedImage(item.image)} />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-primary)]">
                          <span className="font-display text-5xl text-[var(--text-primary)]">{item.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-[22px] font-semibold text-[var(--text-primary)]">{item.name}</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.description}</p>
                  </button>
                ))}
            </div>
          </section>
        )}

        {selectedCategory?.children && selectedCategory.children.length > 0 && (
          <section className="mb-10 rounded-[12px] border border-default bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Subcategories</p>
                <h2 className="mt-2 text-[28px] font-semibold text-[var(--text-primary)]">Explore {selectedCategory.name}</h2>
              </div>
              {selectedCategory.breadcrumb && selectedCategory.breadcrumb.length > 1 && (
                <button type="button" className="btn-secondary px-4" onClick={() => setCategoryPath(selectedCategory.breadcrumb[selectedCategory.breadcrumb.length - 2]?.full_slug || "")}>Back Up</button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {selectedCategory.children.map((child) => (
                <button key={child.id} type="button" onClick={() => { setCategoryPath(child.full_slug); setPage(1) }} className="rounded-full border border-default px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-soft)]">
                  {child.name}
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
                    className={page === pageNum ? "btn-primary w-11 px-0" : "btn-secondary w-11 px-0"}
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



