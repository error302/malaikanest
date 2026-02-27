import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Logo({ className = 'h-8' }: { className?: string }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Image src="/logo.svg" alt="Malaika" width={128} height={32} className={className} />
    </Link>
  )
}
