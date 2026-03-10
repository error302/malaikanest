import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  compact?: boolean
  className?: string
}

export default function Logo({ compact = false, className = '' }: LogoProps) {
  const size = compact ? 34 : 40

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/images/logo.png"
        alt="Malaika Nest"
        width={size}
        height={size}
        className="rounded-md object-contain"
        priority={!compact}
      />
      <div className="min-w-0 leading-tight">
        <p className="font-display whitespace-nowrap text-[18px] font-semibold text-[var(--text-primary)] md:text-[20px]">Malaika Nest</p>
        <p className="whitespace-nowrap tracking-[0.22em] text-[9px] uppercase text-[var(--text-secondary)]">Baby & Maternity</p>
      </div>
    </div>
  )

  return (
    <Link href="/" aria-label="Malaika Nest Home" className="inline-flex items-center">
      {content}
    </Link>
  )
}
