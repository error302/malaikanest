
"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import api from '../lib/api'

interface LogoProps {
  compact?: boolean
  className?: string
}

export default function Logo({ compact = false, className = '' }: LogoProps) {
  const size = compact ? 34 : 40

  const [siteName, setSiteName] = useState('Malaika Nest')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const key = 'malaika_public_settings_v1'
    const ttlMs = 5 * 60 * 1000

    try {
      const cached = localStorage.getItem(key)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.ts && Date.now() - parsed.ts < ttlMs) {
          if (parsed.site_name) setSiteName(parsed.site_name)
          if (parsed.logo_url) setLogoUrl(parsed.logo_url)
        }
      }
    } catch {
      // ignore cache parse errors
    }

    api
      .get('/api/core/settings/public/')
      .then((res) => {
        const nextName = res.data?.site_name || 'Malaika Nest'
        const nextLogo = res.data?.logo_url || null
        setSiteName(nextName)
        setLogoUrl(nextLogo)
        try {
          localStorage.setItem(key, JSON.stringify({ ts: Date.now(), site_name: nextName, logo_url: nextLogo }))
        } catch {
          // ignore quota issues
        }
      })
      .catch(() => {
        // keep defaults
      })
  }, [])

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src={logoUrl || "/images/logo.png"}
        alt={siteName}
        width={size}
        height={size}
        className="rounded-md object-contain"
        priority={!compact}
      />
      <div className="min-w-0 leading-tight">
        <p className="font-display whitespace-nowrap text-[18px] font-semibold text-[var(--text-primary)] md:text-[20px]">{siteName}</p>
        <p className="whitespace-nowrap tracking-[0.22em] text-[9px] uppercase text-[var(--text-secondary)]">Baby & Maternity</p>
      </div>
    </div>
  )

  return (
    <Link href="/" aria-label={`${siteName} Home`} className="inline-flex items-center">
      {content}
    </Link>
  )
}
