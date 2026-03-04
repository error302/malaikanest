"use client"
import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'purple'
  className?: string
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-card text-muted',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    error: 'bg-red-500/20 text-red-500',
    purple: 'bg-accent/20 text-accent',
  }

  return (
    <span 
      className={`
        inline-flex items-center px-3 py-1 rounded-tag text-xs font-medium
        ${variants[variant]} ${className}
      `}
    >
      {children}
    </span>
  )
}

