"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

export function BackButton({ fallbackHref = "/", href }: { fallbackHref?: string; href?: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => {
        // When a specific origin is known (e.g. this page was opened from a
        // particular Timeline date), navigate there directly instead of
        // router.back() — this is deterministic regardless of how much
        // history state has accumulated.
        if (href) router.push(href)
        else if (window.history.length > 1) router.back()
        else router.push(fallbackHref)
      }}
      aria-label="Go back"
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary/50 text-foreground transition-colors hover:bg-secondary"
    >
      <ChevronLeft className="size-5" />
    </button>
  )
}
