"use client"

import { useState } from "react"
import { WorldGlobe } from "@/components/map/world-globe"
import { CountryInfoCard } from "@/components/map/country-info-card"
import { UnvisitedCountryCard } from "@/components/map/unvisited-country-card"
import { TravelSummaryBadge } from "@/components/map/travel-summary-badge"
import { MapLegend } from "@/components/map/map-legend"
import { UNVISITED_COUNTRY_STATUS } from "@/lib/data"
import type { UnvisitedStatus } from "@/lib/types"

export default function MapScreen() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [selectedUnvisited, setSelectedUnvisited] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<Record<string, UnvisitedStatus>>(UNVISITED_COUNTRY_STATUS)

  function handleSelectVisited(code: string) {
    setSelectedUnvisited(null)
    setSelectedCode(code)
  }

  function handleSelectUnvisited(name: string) {
    setSelectedCode(null)
    setSelectedUnvisited(name)
  }

  function handleClear() {
    setSelectedCode(null)
    setSelectedUnvisited(null)
  }

  function handleSetStatus(name: string, status: UnvisitedStatus | null) {
    setStatuses((prev) => {
      const next = { ...prev }
      if (status) next[name] = status
      else delete next[name]
      return next
    })
  }

  const hasSelection = Boolean(selectedCode || selectedUnvisited)

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Title, subtitle, and the lightweight stats row all live in normal
          flow (not absolutely positioned) so they can never overlap one
          another or the globe below. */}
      <div className="shrink-0 px-4 pt-4">
        <p className="font-serif text-lg leading-none">Wayfarer</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Your personal map of the world</p>
        <TravelSummaryBadge />
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 py-3">
        {!hasSelection && (
          <p className="pointer-events-none absolute inset-x-0 top-1 z-10 text-center text-xs text-muted-foreground">
            Drag to explore · Tap any country
          </p>
        )}
        <WorldGlobe
          selectedCode={selectedCode}
          selectedUnvisitedName={selectedUnvisited}
          unvisitedStatuses={statuses}
          onSelectVisited={handleSelectVisited}
          onSelectUnvisited={handleSelectUnvisited}
          onClearSelection={handleClear}
        />
      </div>

      <MapLegend />

      {selectedCode && <CountryInfoCard code={selectedCode} onClose={handleClear} />}
      {selectedUnvisited && (
        <UnvisitedCountryCard
          name={selectedUnvisited}
          status={statuses[selectedUnvisited]}
          onSetStatus={(status) => handleSetStatus(selectedUnvisited, status)}
          onClose={handleClear}
        />
      )}
    </div>
  )
}
