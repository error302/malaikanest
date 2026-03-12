"use client"
import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export default function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full h-12 bg-[var(--bg-surface)] border border-[var(--border)] rounded-input
            text-[var(--text-primary)] placeholder-[var(--text-muted)]
            focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
            transition-all duration-200
            ${icon ? 'pl-10' : 'pl-4'} pr-4
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

