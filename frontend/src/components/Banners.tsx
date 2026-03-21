"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import api from '../lib/api'
import { getImageUrl, shouldUseUnoptimizedImage } from '../lib/media'

interface Banner {
  id: number
  title?: string
  image: string
  mobile_image?: string | null
  button_link?: string
}

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    let mounted = true
    console.log('Fetching banners...')
    api.get('/api/products/banners/')
      .then((res) => {
        console.log('Banners response:', res.data)
        // Handle standardized API response: { success, data: { count, results }, error }
        const apiData = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        const rows = Array.isArray(apiData) ? apiData : []
        console.log('Banners parsed:', rows.length)
        if (mounted) setBanners(rows)
      })
      .catch((err) => {
        console.error('Banners error:', err)
        if (mounted) setBanners([])
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(max-width: 768px)')

    const updateIsMobile = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches)
    }

    updateIsMobile(mediaQuery)
    mediaQuery.addEventListener('change', updateIsMobile)
    return () => mediaQuery.removeEventListener('change', updateIsMobile)
  }, [])

  if (!banners.length) return null

  const banner = banners[0]
  const imageUrl = getImageUrl(isMobile ? banner.mobile_image ?? banner.image : banner.image)

  const content = (
    <div className="relative w-full h-[200px] sm:h-[280px] md:h-[380px] xl:h-[480px] overflow-hidden rounded-lg">
      <Image
        src={imageUrl}
        alt={banner.title || 'Banner'}
        fill
        className="object-cover object-center"
        unoptimized={shouldUseUnoptimizedImage(imageUrl)}
        priority
      />
    </div>
  )

  return (
    <div className="w-full bg-gray-50">
      <div className="container-shell py-4 md:py-6">
        {banner.button_link ? (
          <a href={banner.button_link} aria-label={banner.title || 'Banner'}>
            {content}
          </a>
        ) : content}
      </div>
    </div>
  )
}

