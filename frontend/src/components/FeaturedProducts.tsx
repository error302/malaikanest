"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import api from '../lib/api'
import { LoadingGrid } from './Loading'
import { useCart } from '../lib/cartContext'
import { shouldUseUnoptimizedImage } from '../lib/media'

interface Product {
  id: number
  name: string
  slug: string
  price: string
  image: string | null
  stock?: number
  category: { name: string }
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [ageFilter, setAgeFilter] = useState('all')
  const { add } = useCart()

  useEffect(() => {
    let mounted = true
    api.get('/api/products/products/')
      .then(res => {
        if (mounted) {
          const data = res.data
          const rows = Array.isArray(data) ? data : (data?.results ?? [])
          setProducts(rows)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setError(true)
          setLoading(false)
        }
      })
    return () => { mounted = false }
  }, [])

  if (loading) return <LoadingGrid count={4} />

  if (error) return (
    <div className="text-center py-8 text-gray-500">
      Unable to load products. Please try again later.
    </div>
  )

  if (products.length === 0) return (
    <div className="text-center py-8 text-gray-500">
      No products available at the moment.
    </div>
  )

  const filteredProducts = products.filter(p => {
    if (ageFilter === 'all') return true

    // Size recommender logic based on product data heuristics
    const textInfo = (p.name + ' ' + (p.category?.name || '')).toLowerCase()
    if (ageFilter === 'newborn') return textInfo.includes('newborn') || textInfo.includes('0-3') || textInfo.includes('new born')
    if (ageFilter === 'infant') return textInfo.includes('3-6') || textInfo.includes('6-12') || textInfo.includes('months')
    if (ageFilter === 'toddler') return textInfo.includes('year') || textInfo.includes('toddler') || textInfo.includes('12-24')
    if (ageFilter === 'maternity') return textInfo.includes('maternity') || textInfo.includes('mom') || textInfo.includes('nursing')
    return true
  })

  return (
    <div>
      <div className="mb-6 bg-secondary rounded-xl p-4 md:flex items-center justify-between border border-[#EDE6DC]">
        <div>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            Smart Size Recommender
          </h3>
          <p className="text-sm text-gray-600 mt-1">Select the age to find perfect fitting clothes or maternity essentials.</p>
        </div>
        <div className="mt-3 md:mt-0">
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="w-full md:w-auto p-2.5 rounded-lg border-gray-300 shadow-sm focus:border-accent focus:ring-accent text-sm text-gray-700 bg-white"
          >
            <option value="all">Shop All Ages</option>
            <option value="newborn">Newborn (0-3 Months)</option>
            <option value="infant">Infants (3-12 Months)</option>
            <option value="toddler">Toddlers (1-3 Years)</option>
            <option value="maternity">Mothers & Maternity</option>
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          No items match this age group currently. Try another filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {filteredProducts.slice(0, 8).map(p => (
            <div key={p.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                {p.image ? (
                  <Image src={p.image} alt={p.name} fill className="object-cover" unoptimized={shouldUseUnoptimizedImage(p.image)} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">No Image</span>
                  </div>
                )}
              </div>
              <div className="p-3 sm:p-4">
                <p className="text-xs text-pastelPink font-medium uppercase tracking-wide">{p.category?.name || 'Baby'}</p>
                <h3 className="font-semibold text-gray-800 mt-1 line-clamp-2">{p.name}</h3>
                <p className="text-lg font-bold text-gray-800 mt-2">KSH {parseFloat(p.price).toLocaleString()}</p>
                <div className="flex gap-2 w-full mt-3">
                  <button
                    className="flex-1 bg-cta text-white hover:bg-cta-hover font-medium py-2 rounded transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={(p.stock ?? 0) === 0}
                    onClick={() => add({ id: p.id, name: p.name, price: Number(p.price), image: p.image || '', qty: 1, slug: p.slug })}
                  >
                    <ShoppingCart size={16} />
                    {(p.stock ?? 1) > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                  <div className="flex flex-col gap-1 w-auto">
                    <a
                      href={`https://wa.me/254726771321?text=Hello,%20I%20am%20interested%20in%20buying%20${encodeURIComponent(p.name)}.`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center p-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                      title="Order via WhatsApp (0726771321)"
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825 0 6.938 3.112 6.938 6.937 0 3.825-3.113 6.938-6.938 6.938z" />
                      </svg>
                    </a>
                    <a
                      href={`https://wa.me/254701305081?text=Hello,%20I%20am%20interested%20in%20buying%20${encodeURIComponent(p.name)}.`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center p-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                      title="Order via WhatsApp (0701305081)"
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825 0 6.938 3.112 6.938 6.937 0 3.825-3.113 6.938-6.938 6.938z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
