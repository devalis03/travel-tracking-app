import { trips, getCountryMeta, getAllTripsSorted, getTripCountryCodes, getTripCountryNames } from "@/lib/data"
import type { Trip } from "@/lib/types"

/**
 * Derives a "year in travel" recap purely from the shared trip data — there
 * is no separate recap dataset to keep in sync. A year only gets a recap if
 * at least one trip started in it, so the list naturally grows as new trips
 * are logged in future years.
 */

const MS_PER_DAY = 86_400_000

export interface RecapPlace {
  tripId: string
  destinationLabel: string
  countryName: string
  coverImage: string
}

export interface RecapData {
  year: number
  trips: Trip[]
  tripsCount: number
  totalDays: number
  countryCodes: string[]
  countryNames: string[]
  newCountryNames: string[]
  cityNames: string[]
  monthsActive: number
  wouldReturnYesCount: number
  heroImage: string
  places: RecapPlace[]
  highlights: Array<{ tripId: string; destinationLabel: string; text: string }>
}

function tripDays(trip: Trip): number {
  const start = new Date(trip.startDate).getTime()
  const end = new Date(trip.endDate).getTime()
  return Math.round((end - start) / MS_PER_DAY) + 1
}

/** Year a country was first ever visited, across all trips regardless of year. */
function firstVisitYearByCountry(): Map<string, number> {
  const firstYear = new Map<string, number>()
  for (const trip of trips) {
    const year = new Date(trip.startDate).getFullYear()
    for (const code of getTripCountryCodes(trip)) {
      const existing = firstYear.get(code)
      if (existing === undefined || year < existing) firstYear.set(code, year)
    }
  }
  return firstYear
}

/** Every year that has at least one trip, most recent first. */
export function getRecapYears(): number[] {
  const years = new Set(trips.map((t) => new Date(t.startDate).getFullYear()))
  return [...years].sort((a, b) => b - a)
}

export function getRecapForYear(year: number): RecapData | undefined {
  const yearTrips = trips
    .filter((t) => new Date(t.startDate).getFullYear() === year)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  if (yearTrips.length === 0) return undefined

  const firstVisitYears = firstVisitYearByCountry()

  const countryCodes = Array.from(new Set(yearTrips.flatMap((t) => getTripCountryCodes(t))))
  const countryNames = countryCodes.map((code) => getCountryMeta(code)?.name ?? code)
  const newCountryNames = countryCodes
    .filter((code) => firstVisitYears.get(code) === year)
    .map((code) => getCountryMeta(code)?.name ?? code)

  const cityNames = Array.from(new Set(yearTrips.flatMap((t) => t.cities.map((c) => c.name))))
  const monthsActive = new Set(yearTrips.map((t) => new Date(t.startDate).getMonth())).size
  const totalDays = yearTrips.reduce((sum, t) => sum + tripDays(t), 0)
  const wouldReturnYesCount = yearTrips.filter((t) => t.wouldReturn === "yes").length

  const places: RecapPlace[] = yearTrips.map((t) => ({
    tripId: t.id,
    destinationLabel: t.destinationLabel,
    countryName: getTripCountryNames(t).join(" & "),
    coverImage: t.coverImage,
  }))

  const highlights = yearTrips
    .filter((t) => t.highlight)
    .map((t) => ({ tripId: t.id, destinationLabel: t.destinationLabel, text: t.highlight as string }))

  // Prefer the trip with the most photos for the hero image — it's the
  // most visually representative moment of the year.
  const heroTrip = [...yearTrips].sort((a, b) => b.photos.length - a.photos.length)[0]

  return {
    year,
    trips: yearTrips,
    tripsCount: yearTrips.length,
    totalDays,
    countryCodes,
    countryNames,
    newCountryNames,
    cityNames,
    monthsActive,
    wouldReturnYesCount,
    heroImage: heroTrip.coverImage,
    places,
    highlights,
  }
}

/** Used on the Profile screen to render the recap list without loading full recap detail for every year. */
export function getRecapSummaries(): Array<{ year: number; tripsCount: number; countryCount: number; heroImage: string }> {
  return getRecapYears()
    .map((year) => getRecapForYear(year))
    .filter((recap): recap is RecapData => recap !== undefined)
    .map((recap) => ({
      year: recap.year,
      tripsCount: recap.tripsCount,
      countryCount: recap.countryCodes.length,
      heroImage: recap.heroImage,
    }))
}

export function getMostRecentTripOfYear(year: number): Trip | undefined {
  return getAllTripsSorted().find((t) => new Date(t.startDate).getFullYear() === year)
}
