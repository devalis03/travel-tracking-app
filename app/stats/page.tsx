"use client"

import { getGlobalStats } from "@/lib/data"
import { ScreenHeader } from "@/components/layout/screen-header"

export default function StatsPage() {
  const stats = getGlobalStats()

  const mainMetrics = [
    { label: "Countries", value: String(stats.countries) },
    { label: "Cities", value: String(stats.cities) },
    { label: "Trips", value: String(stats.tripsCount) },
    { label: "World explored", value: `${stats.worldPercent}%` },
    { label: "Continents", value: `${stats.continentsVisited} / ${stats.continentsTotal}` },
  ]

  const secondaryMetrics = [
    { label: "Most visited country", value: `${stats.mostVisitedCountry.name} · ${stats.mostVisitedCountry.count} trips` },
    { label: "Most traveled year", value: stats.mostTraveledYear },
    { label: "Latest destination", value: stats.latestDestination },
  ]

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <ScreenHeader title="Stats" subtitle="Your travel footprint so far" />

      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-3">
        {mainMetrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`flex flex-col gap-1 rounded-2xl border border-border bg-card/50 p-5 ${
              index === mainMetrics.length - 1 ? "col-span-2 sm:col-span-3" : ""
            }`}
          >
            <span className="font-serif text-3xl text-accent">{metric.value}</span>
            <span className="text-sm text-muted-foreground">{metric.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 px-4 pb-28">
        {secondaryMetrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between rounded-xl border border-border bg-secondary/25 px-4 py-3"
          >
            <span className="text-sm text-muted-foreground">{metric.label}</span>
            <span className="text-sm font-medium">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
