import { getTripById } from "@/lib/data"

/**
 * Simulates a phone's camera roll: photos with location + timestamp metadata
 * that haven't been sorted into a trip's memories yet. Automatic photo
 * suggestions matches each shot to a trip by proximity to one of its cities
 * and by date falling inside the trip's date range — the same signals a
 * real photo-organizing feature would use.
 */
export interface CameraRollPhoto {
  id: string
  url: string
  takenAt: string
  lat: number
  lon: number
  caption: string
}

const CAMERA_ROLL: CameraRollPhoto[] = [
  {
    id: "roll-madrid-1",
    url: "/camera-roll/madrid-extra.png",
    takenAt: "2026-05-15",
    lat: 40.4200,
    lon: -3.7038,
    caption: "Gran Vía at midday",
  },
  {
    id: "roll-tokyo-1",
    url: "/camera-roll/tokyo-extra.png",
    takenAt: "2025-10-08",
    lat: 35.6805,
    lon: 139.7673,
    caption: "Backstreet vending machines",
  },
  {
    id: "roll-barcelona-1",
    url: "/camera-roll/barcelona-extra.png",
    takenAt: "2025-06-05",
    lat: 41.3809,
    lon: 2.1735,
    caption: "La Rambla in the afternoon",
  },
  {
    id: "roll-buenos-aires-1",
    url: "/camera-roll/buenos-aires-extra.png",
    takenAt: "2023-11-17",
    lat: -34.5875,
    lon: -58.3974,
    caption: "Café terrace in Recoleta",
  },
]

const MATCH_RADIUS_DEGREES = 0.5

function isWithinDateRange(date: string, start: string, end: string): boolean {
  const d = new Date(date).getTime()
  return d >= new Date(start).getTime() && d <= new Date(end).getTime()
}

function isNearAnyCity(photo: CameraRollPhoto, cities: Array<{ lat: number; lon: number }>): boolean {
  return cities.some(
    (city) => Math.abs(city.lat - photo.lat) < MATCH_RADIUS_DEGREES && Math.abs(city.lon - photo.lon) < MATCH_RADIUS_DEGREES,
  )
}

/** Camera-roll shots whose location and timestamp match the given trip, and aren't already saved as memories. */
export function getSuggestedPhotosForTrip(tripId: string): CameraRollPhoto[] {
  const trip = getTripById(tripId)
  if (!trip) return []

  const savedUrls = new Set(trip.photos.map((p) => p.url))

  return CAMERA_ROLL.filter(
    (photo) =>
      !savedUrls.has(photo.url) &&
      isWithinDateRange(photo.takenAt, trip.startDate, trip.endDate) &&
      isNearAnyCity(photo, trip.cities),
  )
}
