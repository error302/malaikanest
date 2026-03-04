"use client"
import React from 'react'

interface SkeletonCardProps {
  variant?: 'product' | 'text' | 'card'
}

export default function SkeletonCard({ variant = 'product' }: SkeletonCardProps) {
  if (variant === 'text') {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-card rounded skeleton w-3/4"></div>
        <div className="h-4 bg-card rounded skeleton w-1/2"></div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className="bg-card rounded-card p-5 border border-border">
        <div className="h-4 bg-card rounded skeleton w-1/2 mb-4"></div>
        <div className="h-20 bg-card rounded skeleton"></div>
      </div>
    )
  }

  // Product variant (default)
  return (
    <div className="bg-card rounded-card p-4 border border-border">
      <div className="aspect-square bg-card-hover rounded-2xl skeleton mb-4"></div>
      <div className="h-4 bg-card-hover rounded skeleton w-3/4 mb-2"></div>
      <div className="h-3 bg-card-hover rounded skeleton w-1/2 mb-3"></div>
      <div className="h-8 bg-card-hover rounded-button skeleton"></div>
    </div>
  )
}

