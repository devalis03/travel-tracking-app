"use client"

import { Fragment, useEffect, useSyncExternalStore, type ReactNode } from "react"
import { getTripsVersion, hydrateTripsFromStorage, subscribeTrips } from "@/lib/data"

/**
 * Loads the saved trips once the browser is ready and re-renders the current
 * screen whenever the trip list changes (a trip is added, edited or deleted),
 * so every screen — map, stats, timeline, memories, recap — always reads the
 * live data. The server and the first client render use the demo trips, which
 * keeps hydration consistent.
 */
export function TripsBoundary({ children }: { children: ReactNode }) {
  const version = useSyncExternalStore(subscribeTrips, getTripsVersion, () => 0)

  useEffect(() => {
    hydrateTripsFromStorage()
  }, [])

  return <Fragment key={version}>{children}</Fragment>
}
