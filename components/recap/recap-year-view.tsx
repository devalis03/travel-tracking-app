"use client"

import { Quote, Sparkles } from "lucide-react"
import { NotFoundState } from "@/components/trips/not-found-state"
import { getRecapForYear } from "@/lib/recap"
import { ScreenHeader } from "@/components/layout/screen-header"
import { RecapHero } from "@/components/recap/recap-hero"
import { RecapPlaceCard } from "@/components/recap/recap-place-card"
import { RecapShareButton } from "@/components/recap/recap-share-button"

export function RecapYearView({ year }: { year: number }) {
  const recap = getRecapForYear(year)
  if (!recap) return <NotFoundState title="Recap" backHref="/profile" backLabel="Back to profile" />

  const stats = [
    { label: "Trips", value: recap.tripsCount },
    { label: "Countries", value: recap.countryCodes.length },
    { label: "Cities", value: recap.cityNames.length },
    { label: "Days away", value: recap.totalDays },
  ]

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <ScreenHeader title={`${recap.year} Recap`} showBack backHref="/profile" />

      <RecapHero
        year={recap.year}
        heroImage={recap.heroImage}
        tripsCount={recap.tripsCount}
        countryCount={recap.countryCodes.length}
      />

      <div className="flex flex-col gap-8 px-4 pb-28 pt-6">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card/50 py-5">
              <span className="font-serif text-3xl text-accent">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>

        {recap.newCountryNames.length > 0 && (
          <div className="rounded-2xl border border-accent/25 bg-accent/5 p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent">
              <Sparkles className="size-3.5" /> New this year
            </p>
            <p className="mt-2 font-serif text-lg text-balance">{recap.newCountryNames.join(", ")}</p>
          </div>
        )}

        <div>
          <h2 className="mb-3 font-serif text-lg">Where you went</h2>
          <div className="flex flex-col gap-2">
            {recap.places.map((place, index) => (
              <RecapPlaceCard key={place.tripId} place={place} index={index} />
            ))}
          </div>
        </div>

        {recap.highlights.length > 0 && (
          <div>
            <h2 className="mb-3 font-serif text-lg">Highlights</h2>
            <div className="flex flex-col gap-3">
              {recap.highlights.map((highlight) => (
                <div key={highlight.tripId} className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <Quote className="size-4 text-muted-foreground" />
                  <p className="mt-1.5 font-serif text-base leading-relaxed text-balance">{highlight.text}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{highlight.destinationLabel}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <RecapShareButton year={recap.year} tripsCount={recap.tripsCount} countryCount={recap.countryCodes.length} />
      </div>
    </div>
  )
}
