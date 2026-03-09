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
        width={compact ? 34 : 40}
        height={compact ? 34 : 40}
        className="rounded-md object-contain"
        priority={!compact}
      />
      <div className="min-w-0 leading-tight">
        <p className="font-display whitespace-nowrap text-[20px] font-semibold text-[var(--text-primary)] md:text-[22px]">Malaika Nest</p>
        <p className="whitespace-nowrap tracking-[0.24em] text-[10px] uppercase text-[var(--text-secondary)]">Baby & Maternity</p>
      </div>
    </div>
  )

  return (
    <Link href="/" aria-label="Malaika Nest Home" className="inline-flex items-center">
      {content}
    </Link>
  )
}
