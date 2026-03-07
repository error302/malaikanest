'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  slug: string
  price: string
  discount_price: string | null
  images: { id: number; image: string }[]
}

interface AIRecommendationsProps {
  productId?: number
  title?: string
}

export default function AIRecommendations({ productId, title = 'You May Also Like' }: AIRecommendationsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const url = productId 
          ? `/api/ai/recommendations/?product_id=${productId}`
          : `/api/ai/recommendations/`
        
        const res = await api.get(url)
        setProducts(res.data.recommendations || [])
      } catch (error) {
        console.error('Failed to fetch recommendations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [productId])

  if (loading) {
    return (
      <div className="py-8">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-2"></div>
              <div className="bg-gray-200 h-4 w-3/4 rounded mb-1"></div>
              <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div className="py-8">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        {title}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.slice(0, 4).map((product) => (
          <Link 
            key={product.id} 
            href={`/products/${product.slug}`}
            className="group"
          >
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="aspect-square relative bg-gray-100">
                {product.images?.[0]?.image ? (
                  <Image width={600} height={600} 
                    src={product.images[0].image} 
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-medium text-sm text-gray-800 line-clamp-2 group-hover:text-amber-600 transition-colors">
                  {product.name}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                  {product.discount_price ? (
                    <>
                      <span className="text-amber-600 font-bold">KSh {product.discount_price}</span>
                      <span className="text-gray-400 line-through text-sm">KSh {product.price}</span>
                    </>
                  ) : (
                    <span className="text-amber-600 font-bold">KSh {product.price}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
