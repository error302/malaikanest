import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  compact?: boolean
  className?: string
}

export default function Logo({ compact = false, className = '' }: LogoProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/images/logo.png"
        alt="Malaika Nest"
        width={compact ? 38 : 46}
        height={compact ? 38 : 46}
        className="rounded-md object-contain"
        priority={!compact}
      />
      <div className="leading-tight">
        <p className="font-display text-[26px] font-semibold text-[var(--text-primary)]">Malaika Nest</p>
        <p className="tracking-[0.28em] text-[11px] uppercase text-[var(--text-secondary)]">Baby & Maternity</p>
      </div>
    </div>
  )

  return (
    <Link href="/" aria-label="Malaika Nest Home" className="inline-flex items-center">
      {content}
    </Link>
  )
}
