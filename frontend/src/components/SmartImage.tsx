"use client"

import Image, { type ImageProps } from "next/image"
import { useEffect, useMemo, useState } from "react"

import { getImageUrl, shouldUseUnoptimizedImage } from "@/lib/media"

type SmartImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined
  fallbackSrc?: string
}

export default function SmartImage({
  src,
  fallbackSrc = "/placeholder.svg",
  alt,
  ...props
}: SmartImageProps) {
  const normalized = useMemo(() => getImageUrl(src), [src])
  const [currentSrc, setCurrentSrc] = useState(normalized)

  // Keep in sync when src changes
  useEffect(() => {
    setCurrentSrc(normalized)
  }, [normalized])

  return (
    <Image
      {...props}
      src={currentSrc || fallbackSrc}
      alt={alt}
      unoptimized={shouldUseUnoptimizedImage(currentSrc)}
      onError={() => setCurrentSrc(fallbackSrc)}
    />
  )
}
