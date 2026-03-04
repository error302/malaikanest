"use client"
import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  showArrows?: boolean
  onLeftClick?: () => void
  onRightClick?: () => void
  className?: string
}

export default function SectionHeader({
  title,
  subtitle,
  showArrows = true,
  onLeftClick,
  onRightClick,
  className = ''
}: SectionHeaderProps) {
  return (
    <div className={`flex justify-between items-center mb-8 ${className}`}>
      <div>
        <h2 className="text-3xl font-bold font-display text-white">{title}</h2>
        {subtitle && (
          <p className="text-muted mt-1">{subtitle}</p>
        )}
      </div>
      
      {showArrows && (
        <div className="flex gap-2">
          <button
            onClick={onLeftClick}
            className="w-10 h-10 flex items-center justify-center rounded-button border border-border text-white hover:border-accent hover:text-accent transition-all"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onRightClick}
            className="w-10 h-10 flex items-center justify-center rounded-button bg-accent text-white hover:bg-accent-hover transition-all"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

