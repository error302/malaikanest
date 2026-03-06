"use client"
import React, { useEffect, useRef, useState, ReactNode } from 'react'

interface StaggeredGridProps {
  children: ReactNode
  className?: string
  itemClassName?: string
}

export default function StaggeredGrid({ children, className = '', itemClassName = '' }: StaggeredGridProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const childArray = React.Children.toArray(children)

  return (
    <div ref={ref} className={className}>
      {childArray.map((child, index) => (
        <div
          key={index}
          className={itemClassName}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: `all 0.4s ease-out ${index * 0.08}s`
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
