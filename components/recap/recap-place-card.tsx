import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { MediaImage } from "@/components/media/media-image"
import type { RecapPlace } from "@/lib/recap"

export function RecapPlaceCard({ place, index }: { place: RecapPlace; index: number }) {
  return (
    <Link
      href={`/trips/${place.tripId}`}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-2.5 transition-colors hover:bg-card"
    >
      <span className="w-5 shrink-0 text-center font-serif text-sm text-muted-foreground">{index + 1}</span>
      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-secondary/40">
        <MediaImage src={place.coverImage || "/placeholder.svg"} alt={place.destinationLabel} fill className="object-cover" sizes="56px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{place.destinationLabel}</p>
        <p className="truncate text-xs text-muted-foreground">{place.countryName}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
