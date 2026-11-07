import Link from "next/link"
import { MapPin, Heart, HelpCircle, XCircle, Clock3 } from "lucide-react"
import type { Trip } from "@/lib/types"
import { formatDateRange, isUpcomingTrip } from "@/lib/data"
import { MediaImage } from "@/components/media/media-image"

const RETURN_ICON = {
  yes: Heart,
  unsure: HelpCircle,
  no: XCircle,
} as const

export function TripCard({ trip }: { trip: Trip }) {
  const ReturnIcon = RETURN_ICON[trip.wouldReturn]
  const upcoming = isUpcomingTrip(trip)
  return (
    <Link
      href={`/trips/${trip.id}`}
      className={`group flex gap-4 rounded-2xl border p-3 transition-colors hover:bg-card ${
        upcoming ? "border-accent/40 bg-accent/5" : "border-border bg-card/60"
      }`}
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
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-serif text-base leading-tight">{trip.destinationLabel}</p>
          {upcoming && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
              <Clock3 className="size-3" /> Upcoming
            </span>
          )}
        </div>
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
