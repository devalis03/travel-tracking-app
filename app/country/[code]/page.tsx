"use client"

import { use } from "react"
import { NotFoundState } from "@/components/trips/not-found-state"
import { MapPin, CalendarDays } from "lucide-react"
import { getCountrySummary, formatMonthYear } from "@/lib/data"
import { ScreenHeader } from "@/components/layout/screen-header"
import { TripCard } from "@/components/trips/trip-card"
import { MediaImage } from "@/components/media/media-image"

export default function CountryDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const summary = getCountrySummary(code.toUpperCase())
  if (!summary) return <NotFoundState title="Country" backHref="/trips/list" backLabel="View trips" />

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <ScreenHeader title={summary.meta.name} subtitle={summary.meta.continent} showBack />

      <div className="relative h-44 w-full shrink-0 bg-secondary/40">
        <MediaImage src={summary.trips[0].coverImage || "/placeholder.svg"} alt={summary.meta.name} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
      </div>

      <div className="flex-1 px-4 pb-8 pt-4">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card/50 p-4 text-center">
          <div>
            <p className="font-serif text-2xl text-primary">{summary.visitCount}</p>
            <p className="text-xs text-muted-foreground">{summary.visitCount === 1 ? "Trip" : "Trips"}</p>
          </div>
          <div className="border-x border-border">
            <p className="font-serif text-2xl text-primary">{summary.cities.length}</p>
            <p className="text-xs text-muted-foreground">{summary.cities.length === 1 ? "City" : "Cities"}</p>
          </div>
          <div>
            <p className="font-serif text-2xl text-primary">{new Date(summary.firstVisit).getFullYear()}</p>
            <p className="text-xs text-muted-foreground">First visit</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-accent" />
            <span>{summary.cities.join(", ")}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-accent" />
            <span>Last visited {formatMonthYear(summary.lastVisit)}</span>
          </div>
        </div>

        <h2 className="mt-6 mb-3 font-serif text-lg">Trips to {summary.meta.name}</h2>
        <div className="flex flex-col gap-2">
          {summary.trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </div>
    </div>
  )
}
