import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  variant?: 'default' | 'small' | 'large' | 'footer'
  linkWrapper?: boolean
  className?: string
}

export default function Logo({ 
  variant = 'default', 
  linkWrapper = true,
  className = '' 
}: LogoProps) {

  const sizes = {
    small:   { icon: 32, textSize: 'text-base',  subSize: 'text-xs' },
    default: { icon: 44, textSize: 'text-xl',    subSize: 'text-xs' },
    large:   { icon: 64, textSize: 'text-3xl',   subSize: 'text-sm' },
    footer:  { icon: 44, textSize: 'text-xl',    subSize: 'text-xs' },
  }

  const s = sizes[variant]

  const logoContent = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon */}
      <div className="shrink-0">
      <Image
          src="/images/logo.png"
          alt="Malaika Nest Logo"
          width={s.icon}
          height={s.icon}
          className="object-contain"
          priority={variant === 'default'}
        />
      </div>

      {/* Text lockup */}
      <div className="flex flex-col leading-tight">
        <span className={`font-bold text-[#C8963E] ${s.textSize} tracking-tight`}>
          Malaika Nest
        </span>
        <span className={`text-[#A0A0B8] ${s.subSize} tracking-wide`}>
          Baby & Maternity
        </span>
      </div>
    </div>
  )

  if (linkWrapper) {
    return (
      <Link 
        href="/" 
        className="hover:opacity-90 transition-opacity duration-200"
        aria-label="Malaika Nest Home"
      >
        {logoContent}
      </Link>
    )
  }

  return logoContent
}

