"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import api from '../lib/api'

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
  const content = (
    <Image src={banner.image} alt={banner.title || 'Banner'} width={1200} height={400} className="w-full h-auto rounded-lg" />
  )

  return (
    <div className="w-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {banner.button_link ? (
          <a href={banner.button_link} aria-label={banner.title || 'Banner'}>
            {content}
          </a>
        ) : content}
      </div>
    </div>
  )
}
