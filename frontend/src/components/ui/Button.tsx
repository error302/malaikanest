"use client"
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outlined' | 'ghost' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-button btn-click cursor-pointer'
  
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover shadow-button',
    outlined: 'bg-transparent border border-border text-white hover:border-accent hover:text-accent',
    ghost: 'bg-transparent text-muted hover:text-white hover:bg-card',
    icon: 'bg-card border border-border text-white hover:bg-accent hover:border-accent',
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

