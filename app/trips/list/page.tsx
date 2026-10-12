"use client"

import { getAllTripsSorted } from "@/lib/data"
import { ScreenHeader } from "@/components/layout/screen-header"
import { ContinentSummary } from "@/components/trips/continent-summary"
import { TripCard } from "@/components/trips/trip-card"

export default function TripsListPage() {
  const allTrips = getAllTripsSorted()

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <ScreenHeader title="Trips" subtitle="Recent to oldest" />

      <div className="pt-4">
        <ContinentSummary />
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 py-4 pb-28">
        {allTrips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </div>
  )
}
