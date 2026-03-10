"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import api from '../lib/api'
import { getImageUrl, shouldUseUnoptimizedImage } from '../lib/media'

interface Banner {
  id: number
  title?: string
  image: string
  button_link?: string
}

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([])

  useEffect(() => {
    let mounted = true
    api.get('/api/products/banners/')
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : res.data?.results || []
        if (mounted) setBanners(rows)
      })
      .catch(() => {
        if (mounted) setBanners([])
      })
    return () => {
      mounted = false
    }
  }, [])

  if (!banners.length) return null

  const banner = banners[0]
  const imageUrl = getImageUrl(banner.image)

  const content = (
    <div className="relative w-full h-[200px] sm:h-[280px] md:h-[380px] xl:h-[480px] overflow-hidden rounded-lg">
      <Image
        src={imageUrl}
        alt={banner.title || 'Banner'}
        fill
        className="object-cover object-center"
        unoptimized={shouldUseUnoptimizedImage(banner.image)}
        priority
      />
    </div>
  )

  return (
    <div className="w-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {banner.button_link ? (
          <a href={banner.button_link} aria-label={banner.title || 'Banner'}>
            {content}
          </a>
        ) : content}
      </div>
    </div>
  )
}

