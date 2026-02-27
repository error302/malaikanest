"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import api from '../lib/api'

interface Banner {
  id: number
  title?: string
  image: string
  link?: string
}

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([])

  useEffect(() => {
    let mounted = true
    api.get('/api/products/banners/')
      .then(res => {
        if (mounted) setBanners(res.data || [])
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  if (!banners.length) return null

  const b = banners[0]
  return (
    <div className="w-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {b.link ? (
          <a href={b.link} aria-label={b.title || 'Banner'}>
            <Image src={b.image} alt={b.title || 'Banner'} width={1200} height={400} className="w-full h-auto rounded-lg" />
          </a>
        ) : (
          <Image src={b.image} alt={b.title || 'Banner'} width={1200} height={400} className="w-full h-auto rounded-lg" />
        )}
      </div>
    </div>
  )
}
