import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Logo({ className = 'h-12' }: { className?: string }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Image src="/logo.png" alt="Malaika Nest" width={60} height={60} className={`${className} object-contain`} />
      <div className="flex flex-col">
        <span className="text-xl font-bold text-amber-700 leading-none">Malaika Nest</span>
        <span className="text-xs text-gray-500">Baby & Maternity</span>
      </div>
    </Link>
  )
}
