"use client"

import { Share2 } from "lucide-react"
import { toast } from "sonner"

export function RecapShareButton({ year, tripsCount, countryCount }: { year: number; tripsCount: number; countryCount: number }) {
  async function handleShare() {
    const text = `My ${year} in travel: ${tripsCount} trip${tripsCount === 1 ? "" : "s"} across ${countryCount} ${countryCount === 1 ? "country" : "countries"}.`
    const url = typeof window !== "undefined" ? window.location.href : ""

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${year} Recap`, text, url })
      } catch {
        // User cancelled the native share sheet — no error state needed.
      }
      return
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      toast.success("Recap link copied")
    } catch {
      toast.error("Couldn't copy the link")
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
    >
      <Share2 className="size-4" strokeWidth={2} />
      Share your recap
    </button>
  )
}
