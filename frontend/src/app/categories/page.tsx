"use client"
import React, { useState, useEffect } from 'react'
import api from '../../lib/api'
import ProductCard from '../../components/ProductCard'
import { LoadingGrid } from '../../components/Loading'

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
  category: { name: string }
  stock: number
  images: string[]
}

const ageFilters = [
  { name: 'All Ages', value: '' },
  { name: 'Newborn (0-3 Months)', value: 'newborn' },
  { name: 'Infants (3-12 Months)', value: 'infant' },
  { name: 'Toddlers (1-3 Years)', value: 'toddler' },
  { name: 'Moms & Maternity', value: 'maternity' },
]

const priceRanges = [
  { name: 'All Prices', min: '', max: '' },
  { name: 'Under KSH 1,000', min: '0', max: '1000' },
  { name: 'KSH 1,000 - 3,000', min: '1000', max: '3000' },
  { name: 'KSH 3,000 - 5,000', min: '3000', max: '5000' },
  { name: 'KSH 5,000 - 10,000', min: '5000', max: '10000' },
  { name: 'Over KSH 10,000', min: '10000', max: '' },
]

const sortOptions = [
  { name: 'Newest First', value: '-created_at' },
  { name: 'Price: Low to High', value: 'price' },
  { name: 'Price: High to Low', value: '-price' },
  { name: 'Name: A-Z', value: 'name' },
  { name: 'Name: Z-A', value: '-name' },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedAge, setSelectedAge] = useState('')
  const [selectedPrice, setSelectedPrice] = useState('')
  const [sortBy, setSortBy] = useState('-created_at')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    api.get('/api/products/categories/')
      .then(res => {
        setCategories(res.data)
      })
      .catch(err => console.error('Failed to load categories', err))
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, selectedAge, selectedPrice, sortBy, page])

  const fetchProducts = () => {
    setLoadingProducts(true)
    const params: Record<string, string> = {
      page: page.toString(),
      page_size: '12',
    }
    
    if (selectedCategory) params.category = selectedCategory
    if (sortBy) params.ordering = sortBy
    if (searchQuery) params.search = searchQuery
    
    if (selectedPrice) {
      const range = priceRanges.find(p => p.name === selectedPrice)
      if (range) {
        if (range.min) params.price_min = range.min
        if (range.max) params.price_max = range.max
      }
    }

    api.get('/api/products/products/', { params })
      .then(res => {
        setProducts(res.data.results || res.data)
        const total = res.data.count ? Math.ceil(res.data.count / 12) : 1
        setTotalPages(total)
        setLoading(false)
        setLoadingProducts(false)
      })
      .catch(err => {
        console.error('Failed to load products', err)
        setLoading(false)
        setLoadingProducts(false)
      })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedAge('')
    setSelectedPrice('')
    setSearchQuery('')
    setSortBy('-created_at')
    setPage(1)
  }

  const activeFiltersCount = [selectedCategory, selectedAge, selectedPrice, searchQuery].filter(Boolean).length

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text mb-2">Shop</h1>
        <p className="text-gray-500 mb-6">
          {products.length} products available
        </p>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 border border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-cta hover:bg-cta-hover text-white font-semibold rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-secondary rounded-lg hover:bg-secondary transition-colors whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white whitespace-nowrap"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.name}</option>
            ))}
          </select>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-red-500 hover:text-red-700 transition-colors whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-secondary/30 p-4 rounded-lg mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Age Group</label>
                <select
                  value={selectedAge}
                  onChange={(e) => { setSelectedAge(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white"
                >
                  {ageFilters.map(age => (
                    <option key={age.value} value={age.value}>{age.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Price Range</label>
                <select
                  value={selectedPrice}
                  onChange={(e) => { setSelectedPrice(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white"
                >
                  {priceRanges.map(range => (
                    <option key={range.name} value={range.name}>{range.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {!selectedCategory && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 12).map((category) => (
                <button
                  key={category.id}
                  onClick={() => { setSelectedCategory(category.slug); setPage(1); }}
                  className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 text-center"
                >
                  <div className="aspect-square bg-secondary rounded-lg mb-2 flex items-center justify-center">
                    {category.image ? (
                      <img src={category.image} alt={category.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-3xl">📁</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-text line-clamp-2">{category.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {loadingProducts ? (
          <LoadingGrid count={12} />
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl block mb-4">🔍</span>
            <h3 className="text-xl font-semibold text-text">No products found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
            <button onClick={clearFilters} className="mt-4 text-accent hover:underline">
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg transition-colors ${
                        page === pageNum ? 'bg-accent text-white' : 'border border-secondary hover:bg-secondary'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
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
