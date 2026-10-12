import type { CityInfo, CountryMeta, CountryPreference, Trip, UnvisitedStatus } from "@/lib/types"
import { getWorldCountry } from "@/lib/locations"

/**
 * Single source of truth for mock travel data. Every screen (Map, Country
 * Detail, Trips, Timeline, Memories, Stats, Profile) derives its numbers from
 * `trips` below so figures never drift between screens.
 *
 * A trip never stores its country directly — each city on the trip carries
 * its own `countryCode`, and a trip's country list is always derived from
 * the union of its cities' countries (see `getTripCountryCodes`). This is
 * what lets one trip span multiple countries (e.g. a Spain + Portugal
 * itinerary) without a separate "countries" field to keep in sync.
 */

/**
 * Mock status for countries the user has not visited yet, keyed by the
 * country name as it appears in the world-atlas topology (`geo.properties.name`).
 * Purely illustrative — there is no backend persistence for this yet.
 */
export const UNVISITED_COUNTRY_STATUS: Record<string, UnvisitedStatus> = {
  Thailand: "next-trip",
  France: "interested",
  Greece: "interested",
  "South Korea": "interested",
  Morocco: "interested",
  Germany: "not-interested",
  "Saudi Arabia": "not-interested",
}

export const CONTINENTS: Array<{ name: string; short: string }> = [
  { name: "South America", short: "S. America" },
  { name: "North & Central America", short: "N & C. America" },
  { name: "Europe", short: "Europe" },
  { name: "Africa", short: "Africa" },
  { name: "Asia", short: "Asia" },
  { name: "Oceania", short: "Oceania" },
  { name: "Antarctica", short: "Antarctica" },
]

const SEED_TRIPS: Trip[] = [
  {
    id: "madrid-2026",
    destinationLabel: "Madrid, Spain",
    cities: [
      { name: "Madrid", lat: 40.4168, lon: -3.7038, countryCode: "ES" },
      { name: "Toledo", lat: 39.8628, lon: -4.0273, countryCode: "ES" },
    ],
    startDate: "2026-05-12",
    endDate: "2026-05-21",
    favoritePlace: "Retiro Park",
    highlight: "Sunset at Templo de Debod",
    wouldReturn: "yes",
    note: "Slower trip than Barcelona — long lunches, longer walks. Toledo as a day trip was the right call.",
    photos: [
      { id: "madrid-1", url: "/trips/madrid-1.png", caption: "Templo de Debod at golden hour" },
      { id: "madrid-2", url: "/trips/madrid-2.png", caption: "Retiro Park in the afternoon light" },
    ],
    coverImage: "/trips/madrid-1.png",
  },
  {
    id: "tokyo-kyoto-2025",
    destinationLabel: "Tokyo & Kyoto, Japan",
    cities: [
      { name: "Tokyo", lat: 35.6762, lon: 139.6503, countryCode: "JP" },
      { name: "Kyoto", lat: 35.0116, lon: 135.7681, countryCode: "JP" },
    ],
    startDate: "2025-10-04",
    endDate: "2025-10-16",
    favoritePlace: "Fushimi Inari Shrine",
    highlight: "Lantern-lit streets of Gion at night",
    wouldReturn: "yes",
    note: "Kyoto felt like a different pace entirely from Tokyo. Would build in more time there next time.",
    photos: [
      { id: "japan-1", url: "/trips/japan-1.png", caption: "Fushimi Inari torii gates" },
      { id: "japan-2", url: "/trips/japan-2.png", caption: "Tokyo skyline at dusk" },
    ],
    coverImage: "/trips/japan-1.png",
  },
  {
    id: "barcelona-2025",
    destinationLabel: "Barcelona, Spain",
    cities: [{ name: "Barcelona", lat: 41.3874, lon: 2.1686, countryCode: "ES" }],
    startDate: "2025-06-03",
    endDate: "2025-06-10",
    favoritePlace: "Park Güell",
    highlight: "Sagrada Familia at sunset",
    wouldReturn: "yes",
    note: "First trip to Spain. Gaudí's work everywhere completely changed how I look at buildings.",
    photos: [
      { id: "barcelona-1", url: "/trips/barcelona-1.png", caption: "Sagrada Familia at golden hour" },
      { id: "barcelona-2", url: "/trips/barcelona-2.png", caption: "Mosaic bench at Park Güell" },
    ],
    coverImage: "/trips/barcelona-1.png",
  },
  {
    id: "seville-lisbon-porto-2025",
    destinationLabel: "Seville, Lisbon & Porto",
    cities: [
      { name: "Seville", lat: 37.3891, lon: -5.9845, countryCode: "ES" },
      { name: "Lisbon", lat: 38.7223, lon: -9.1393, countryCode: "PT" },
      { name: "Porto", lat: 41.1579, lon: -8.6291, countryCode: "PT" },
    ],
    startDate: "2025-03-02",
    endDate: "2025-03-12",
    favoritePlace: "Alfama district, Lisbon",
    highlight: "Crossing into Portugal by train and watching the landscape change",
    wouldReturn: "yes",
    note: "First trip that crossed a border mid-itinerary. Seville's heat gave way to the Atlantic breeze in Lisbon almost overnight.",
    photos: [
      { id: "iberia-1", url: "/trips/madrid-1.png", caption: "Alfama district rooftops" },
      { id: "iberia-2", url: "/trips/barcelona-2.png", caption: "Porto's riverside at dusk" },
    ],
    coverImage: "/trips/madrid-1.png",
  },
  {
    id: "rome-florence-2024",
    destinationLabel: "Rome & Florence, Italy",
    cities: [
      { name: "Rome", lat: 41.9028, lon: 12.4964, countryCode: "IT" },
      { name: "Florence", lat: 43.7696, lon: 11.2558, countryCode: "IT" },
    ],
    startDate: "2024-04-08",
    endDate: "2024-04-19",
    favoritePlace: "Piazzale Michelangelo",
    highlight: "Watching sunset over the Colosseum",
    wouldReturn: "yes",
    note: "Two very different cities in one trip. Florence felt smaller and easier to fall in love with.",
    photos: [
      { id: "italy-1", url: "/trips/italy-1.png", caption: "The Colosseum at sunset" },
      { id: "italy-2", url: "/trips/italy-2.png", caption: "Florence skyline from Piazzale Michelangelo" },
    ],
    coverImage: "/trips/italy-1.png",
  },
  {
    id: "rio-2024",
    destinationLabel: "Rio de Janeiro, Brazil",
    cities: [{ name: "Rio de Janeiro", lat: -22.9068, lon: -43.1729, countryCode: "BR" }],
    startDate: "2024-01-11",
    endDate: "2024-01-20",
    favoritePlace: "Copacabana Beach",
    highlight: "Sunrise at Christ the Redeemer",
    wouldReturn: "unsure",
    note: "Loved the energy of the city, but the heat in January was a lot to handle.",
    photos: [
      { id: "brazil-1", url: "/trips/brazil-1.png", caption: "Christ the Redeemer at golden hour" },
      { id: "brazil-2", url: "/trips/brazil-2.png", caption: "Copacabana Beach" },
    ],
    coverImage: "/trips/brazil-1.png",
  },
  {
    id: "buenos-aires-2023",
    destinationLabel: "Buenos Aires, Argentina",
    cities: [
      { name: "Buenos Aires", lat: -34.6037, lon: -58.3816, countryCode: "AR" },
      { name: "Mendoza", lat: -32.8908, lon: -68.8272, countryCode: "AR" },
    ],
    startDate: "2023-11-15",
    endDate: "2023-11-20",
    favoritePlace: "Caminito, La Boca",
    highlight: "Wine tasting in Mendoza vineyards",
    wouldReturn: "yes",
    note: "Home turf. Brought a friend along to Mendoza for the first time — worth every peso.",
    photos: [
      { id: "argentina-1", url: "/trips/argentina-1.png", caption: "Caminito, La Boca" },
      { id: "argentina-2", url: "/trips/argentina-2.png", caption: "Mendoza vineyards at golden hour" },
    ],
    coverImage: "/trips/argentina-1.png",
  },
]

/**
 * The live trip list. The array identity never changes — `saveTrip` and
 * `deleteTrip` mutate it in place and notify subscribers — so every helper
 * below (and any module that imports `trips`) always reads current data.
 * It starts from the seed trips and is replaced by the saved list as soon
 * as the browser storage has been read (see `hydrateTripsFromStorage`).
 */
export const trips: Trip[] = [...SEED_TRIPS]

const TRIPS_STORAGE_KEY = "wayfarer:trips:v1"

let tripsVersion = 0
let tripsHydrated = false
const tripListeners = new Set<() => void>()

function notifyTrips() {
  tripsVersion += 1
  tripListeners.forEach((listener) => listener())
}

function persistTrips(): boolean {
  try {
    window.localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips))
    return true
  } catch {
    // Storage full or unavailable — the change still applies for this session.
    return false
  }
}

function isTrip(value: unknown): value is Trip {
  if (!value || typeof value !== "object") return false
  const trip = value as Partial<Trip>
  return (
    typeof trip.id === "string" &&
    typeof trip.destinationLabel === "string" &&
    Array.isArray(trip.cities) &&
    trip.cities.every(
      (city) =>
        city &&
        typeof city === "object" &&
        typeof city.name === "string" &&
        typeof city.countryCode === "string" &&
        typeof city.lat === "number" &&
        typeof city.lon === "number",
    ) &&
    typeof trip.startDate === "string" &&
    typeof trip.endDate === "string" &&
    (trip.wouldReturn === "yes" || trip.wouldReturn === "no" || trip.wouldReturn === "unsure") &&
    Array.isArray(trip.photos) &&
    trip.photos.every(
      (photo) =>
        photo &&
        typeof photo === "object" &&
        typeof photo.id === "string" &&
        typeof photo.url === "string" &&
        (photo.caption === undefined || typeof photo.caption === "string"),
    ) &&
    typeof trip.coverImage === "string"
  )
}

export function subscribeTrips(listener: () => void): () => void {
  tripListeners.add(listener)
  return () => tripListeners.delete(listener)
}

export function getTripsVersion(): number {
  return tripsVersion
}

export function isTripsHydrated(): boolean {
  return tripsHydrated
}

/** Loads the saved trip list (if any) once on the client. */
export function hydrateTripsFromStorage() {
  if (tripsHydrated) return
  tripsHydrated = true
  try {
    const raw = window.localStorage.getItem(TRIPS_STORAGE_KEY)
    if (raw) {
      const saved: unknown = JSON.parse(raw)
      if (Array.isArray(saved)) {
        const validTrips = saved.filter(isTrip)
        if (saved.length === 0 || validTrips.length > 0) {
          trips.splice(0, trips.length, ...validTrips)
        }
      }
    }
  } catch {
    // Corrupt storage — fall back to the seed trips.
  }
  notifyTrips()
}

export function createTripId(): string {
  return `trip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** Adds a new trip or replaces the one with the same id. Returns whether it was written to storage. */
export function saveTrip(trip: Trip): boolean {
  const index = trips.findIndex((t) => t.id === trip.id)
  if (index === -1) trips.push(trip)
  else trips[index] = trip
  const persisted = persistTrips()
  notifyTrips()
  return persisted
}

export function deleteTrip(id: string) {
  const index = trips.findIndex((t) => t.id === id)
  if (index === -1) return
  trips.splice(index, 1)
  persistTrips()
  notifyTrips()
}

/** Restores the original demo trips and clears the saved list. */
export function resetTrips() {
  trips.splice(0, trips.length, ...SEED_TRIPS)
  try {
    window.localStorage.removeItem(TRIPS_STORAGE_KEY)
  } catch {
    // ignore
  }
  notifyTrips()
}

/** Removes all locally stored trips and clears the in-memory list. */
export function clearTrips() {
  trips.splice(0, trips.length)
  try {
    window.localStorage.removeItem(TRIPS_STORAGE_KEY)
  } catch {
    // ignore
  }
  notifyTrips()
}

const WORLD_COUNTRY_COUNT = 195

export function getCountryMeta(code: string): CountryMeta | undefined {
  return getWorldCountry(code)
}

/** Countries that appear on at least one trip, in the order they were first visited. */
export function getVisitedCountries(): CountryMeta[] {
  return getVisitedCountryCodes()
    .map((code) => getWorldCountry(code))
    .filter((country): country is CountryMeta => Boolean(country))
}

/** What to show as a trip's name: the user's title if set, otherwise the derived destination. */
export function getTripTitle(trip: Trip): string {
  return trip.title?.trim() || trip.destinationLabel
}

/** Every country a trip touches, in first-seen order, deduplicated. */
export function getTripCountryCodes(trip: Trip): string[] {
  return Array.from(new Set(trip.cities.map((c) => c.countryCode)))
}

export function getTripCountryNames(trip: Trip): string[] {
  return getTripCountryCodes(trip)
    .map((code) => getCountryMeta(code)?.name)
    .filter((name): name is string => Boolean(name))
}

/** Whether a trip visited more than one country. */
export function isMultiCountryTrip(trip: Trip): boolean {
  return getTripCountryCodes(trip).length > 1
}

/**
 * Builds a human-readable destination label straight from a trip's cities —
 * used by the Add Trip flow so the destination summary is always derived
 * from what was actually entered rather than typed separately.
 */
export function deriveDestinationLabel(cities: CityInfo[]): string {
  if (cities.length === 0) return ""
  const countryCodes = Array.from(new Set(cities.map((c) => c.countryCode)))
  const joinList = (items: string[]) =>
    items.length <= 1
      ? items.join("")
      : items.length === 2
        ? items.join(" & ")
        : `${items.slice(0, -1).join(", ")} & ${items[items.length - 1]}`

  if (countryCodes.length === 1) {
    const countryName = getCountryMeta(countryCodes[0])?.name ?? ""
    const cityNames = Array.from(new Set(cities.map((c) => c.name)))
    return countryName ? `${joinList(cityNames)}, ${countryName}` : joinList(cityNames)
  }

  // Multi-country trips summarize by country rather than listing every city,
  // since a full city-and-country list gets unwieldy fast (e.g. "Seville,
  // Spain, Lisbon, Portugal & Porto, Portugal").
  const countryNames = countryCodes.map((code) => getCountryMeta(code)?.name).filter((n): n is string => Boolean(n))
  return joinList(countryNames)
}

export function getTripsByCountry(code: string): Trip[] {
  return trips
    .filter((t) => getTripCountryCodes(t).includes(code))
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
}

export function getCitiesByCountry(code: string): Array<{ name: string; lat: number; lon: number }> {
  const seen = new Map<string, { name: string; lat: number; lon: number }>()
  for (const t of getTripsByCountry(code)) {
    for (const city of t.cities) {
      if (city.countryCode === code && !seen.has(city.name)) seen.set(city.name, city)
    }
  }
  return Array.from(seen.values())
}

export function getTripById(id: string): Trip | undefined {
  return trips.find((t) => t.id === id)
}

export function getAllTripsSorted(): Trip[] {
  return [...trips].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
}

export interface CountrySummary {
  meta: CountryMeta
  trips: Trip[]
  visitCount: number
  cities: string[]
  firstVisit: string
  lastVisit: string
}

export function getCountrySummary(code: string): CountrySummary | undefined {
  const meta = getCountryMeta(code)
  if (!meta) return undefined
  const countryTrips = getTripsByCountry(code)
  if (countryTrips.length === 0) return undefined
  const cities = Array.from(
    new Set(countryTrips.flatMap((t) => t.cities.filter((c) => c.countryCode === code).map((c) => c.name))),
  )
  const sortedByDate = [...countryTrips].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  return {
    meta,
    trips: countryTrips,
    visitCount: countryTrips.length,
    cities,
    firstVisit: sortedByDate[0].startDate,
    lastVisit: sortedByDate[sortedByDate.length - 1].startDate,
  }
}

/** A country-level travel preference, derived from the most recent trip's "would return" answer. */
export function getCountryPreference(code: string): CountryPreference | undefined {
  const countryTrips = getTripsByCountry(code)
  if (countryTrips.length === 0) return undefined
  const latest = countryTrips[0]
  if (latest.wouldReturn === "yes") return "want-to-return"
  if (latest.wouldReturn === "no") return "wouldnt-return"
  return undefined
}

export function getVisitedCountryCodes(): string[] {
  return Array.from(new Set(trips.flatMap((t) => getTripCountryCodes(t))))
}

export function getContinentCounts(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const c of CONTINENTS) counts[c.name] = 0
  for (const code of getVisitedCountryCodes()) {
    const meta = getCountryMeta(code)
    if (!meta) continue
    const countryTrips = getTripsByCountry(code)
    counts[meta.continent] = (counts[meta.continent] ?? 0) + countryTrips.length
  }
  return counts
}

export interface GlobalStats {
  countries: number
  cities: number
  tripsCount: number
  worldPercent: number
  continentsVisited: number
  continentsTotal: number
  mostVisitedCountry: { name: string; count: number }
  mostTraveledYear: string
  latestDestination: string
}

export function getGlobalStats(): GlobalStats {
  const visitedCodes = getVisitedCountryCodes()
  const uniqueCities = new Set(trips.flatMap((t) => t.cities.map((c) => c.name)))
  const continentSet = new Set(visitedCodes.map((code) => getCountryMeta(code)?.continent).filter(Boolean))

  // A multi-country trip counts toward the visit tally of every country it
  // touched, so "most visited" reflects how often you were actually there.
  const visitCountByCountry = new Map<string, number>()
  for (const t of trips) {
    for (const code of getTripCountryCodes(t)) {
      visitCountByCountry.set(code, (visitCountByCountry.get(code) ?? 0) + 1)
    }
  }
  let mostVisitedCode = visitedCodes[0]
  for (const [code, count] of visitCountByCountry) {
    if (count > (visitCountByCountry.get(mostVisitedCode) ?? 0)) mostVisitedCode = code
  }

  const yearCounts = new Map<string, number>()
  for (const t of trips) {
    const year = t.startDate.slice(0, 4)
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1)
  }
  let mostTraveledYear = ""
  let maxYearCount = 0
  for (const [year, count] of [...yearCounts.entries()].sort((a, b) => Number(b[0]) - Number(a[0]))) {
    if (count > maxYearCount) {
      maxYearCount = count
      mostTraveledYear = year
    }
  }

  const latest = getAllTripsSorted()[0]

  return {
    countries: visitedCodes.length,
    cities: uniqueCities.size,
    tripsCount: trips.length,
    worldPercent: Math.round((visitedCodes.length / WORLD_COUNTRY_COUNT) * 1000) / 10,
    continentsVisited: continentSet.size,
    continentsTotal: CONTINENTS.length,
    mostVisitedCountry: {
      name: getCountryMeta(mostVisitedCode)?.name ?? "",
      count: visitCountByCountry.get(mostVisitedCode) ?? 0,
    },
    mostTraveledYear,
    latestDestination: latest?.destinationLabel ?? "",
  }
}

export function getAllMemories(): Array<{ tripId: string; photoId: string; url: string; caption?: string; countryName: string; date: string }> {
  return trips.flatMap((t) =>
    t.photos.map((p) => ({
      tripId: t.id,
      photoId: p.id,
      url: p.url,
      caption: p.caption,
      countryName: getTripCountryNames(t).join(" & "),
      date: t.startDate,
    })),
  )
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "long" })
  if (sameMonth) {
    return `${monthFmt.format(s)} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
  }
  const startFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
  const endFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
  return `${startFmt.format(s)} – ${endFmt.format(e)}`
}

export function formatMonthYear(date: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(date))
}
