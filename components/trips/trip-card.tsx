import Link from "next/link"
import { MapPin, Heart, HelpCircle, XCircle } from "lucide-react"
import type { Trip } from "@/lib/types"
import { formatDateRange } from "@/lib/data"
import { MediaImage } from "@/components/media/media-image"

const RETURN_ICON = {
  yes: Heart,
  unsure: HelpCircle,
  no: XCircle,
} as const

export function TripCard({ trip }: { trip: Trip }) {
  const ReturnIcon = RETURN_ICON[trip.wouldReturn]
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group flex gap-4 rounded-2xl border border-border bg-card/60 p-3 transition-colors hover:bg-card"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-secondary/40">
        <MediaImage
          src={trip.coverImage || "/placeholder.svg"}
          alt={trip.destinationLabel}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="80px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="truncate font-serif text-base leading-tight">{trip.destinationLabel}</p>
        <p className="text-xs text-muted-foreground">{formatDateRange(trip.startDate, trip.endDate)}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          <span className="truncate">{trip.cities.map((c) => c.name).join(", ")}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center pr-1">
        <ReturnIcon
          className={
            trip.wouldReturn === "yes"
              ? "size-4 text-accent"
              : trip.wouldReturn === "unsure"
                ? "size-4 text-muted-foreground"
                : "size-4 text-destructive"
          }
        />
      </div>
    </Link>
  )
}
