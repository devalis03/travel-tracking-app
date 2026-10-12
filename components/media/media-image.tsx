"use client"

import { useState } from "react"
import Image, { type ImageProps } from "next/image"
import { cn } from "@/lib/utils"

/**
 * Thin wrapper around `next/image` used for every photo in the app (trip
 * covers, galleries, memories). It is always rendered inside a fixed
 * aspect-ratio / `fill` container by callers, so it never causes layout
 * shift, and it fades in once loaded instead of popping in abruptly.
 *
 * Lazy by default (matches `next/image`'s own default) — pass `priority`
 * for the one or two images that sit above the fold.
 */
export function MediaImage({ className, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <Image
      {...props}
      loading={props.priority ? undefined : "lazy"}
      className={cn("transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0", className)}
      onLoad={(e) => {
        setLoaded(true)
        onLoad?.(e)
      }}
    />
  )
}
