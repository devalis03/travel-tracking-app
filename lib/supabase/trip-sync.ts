import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client"
import type { MemoryPhoto, Trip } from "@/lib/types"

function formatSyncError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object") {
    const details = error as { message?: string; details?: string; hint?: string; code?: string }
    return [details.message, details.details, details.hint, details.code].filter(Boolean).join(" | ") || JSON.stringify(error)
  }
  return String(error)
}

interface RemoteTripRow {
  id: string
  local_id: string | null
  title: string | null
  destination_label: string
  start_date: string
  end_date: string
  favorite_place: string | null
  highlight: string | null
  would_return: Trip["wouldReturn"]
  note: string | null
  trip_cities: Array<{
    position: number
    cities: Array<{
      id: string
      name: string
      country_code: string
      latitude: number
      longitude: number
      place_id: string | null
    }> | null
  }>
  trip_photos: Array<{
    id: string
    storage_path: string
    caption: string | null
    position: number
  }>
}

async function uploadPhoto(userId: string, tripId: string, photo: MemoryPhoto, position: number) {
  const response = await fetch(photo.url)
  if (!response.ok) throw new Error(`Could not read photo ${photo.id}`)
  const blob = await response.blob()
  const extension = blob.type.split("/")[1] || "jpg"
  const storagePath = `${userId}/${tripId}/${position}-${photo.id}.${extension}`
  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase.storage.from("travel-photos").upload(storagePath, blob, {
    contentType: blob.type || "image/jpeg",
    upsert: true,
  })
  if (error) throw error
  return storagePath
}

async function ensureCity(userId: string, city: Trip["cities"][number]) {
  const supabase = createSupabaseBrowserClient()
  const { data: existing, error: lookupError } = await supabase
    .from("cities")
    .select("id")
    .eq("country_code", city.countryCode)
    .ilike("name", city.name)
    .maybeSingle()
  if (lookupError) throw lookupError
  if (existing) return existing.id as string

  const { data, error } = await supabase
    .from("cities")
    .insert({
      name: city.name,
      country_code: city.countryCode,
      latitude: city.lat,
      longitude: city.lon,
      place_id: city.placeId ?? null,
    })
    .select("id")
    .single()
  if (error) throw error
  return data.id as string
}

async function importTrip(userId: string, trip: Trip) {
  const supabase = createSupabaseBrowserClient()
  const { data: existing, error: existingError } = await supabase
    .from("trips")
    .select("id")
    .eq("user_id", userId)
    .eq("local_id", trip.id)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) return

  const { data: inserted, error: tripError } = await supabase
    .from("trips")
    .insert({
      user_id: userId,
      local_id: trip.id,
      title: trip.title ?? null,
      destination_label: trip.destinationLabel,
      start_date: trip.startDate,
      end_date: trip.endDate,
      favorite_place: trip.favoritePlace ?? null,
      highlight: trip.highlight ?? null,
      would_return: trip.wouldReturn,
      note: trip.note ?? null,
    })
    .select("id")
    .single()
  if (tripError) throw tripError

  const cityRows = []
  for (const [position, city] of trip.cities.entries()) {
    cityRows.push({ trip_id: inserted.id, city_id: await ensureCity(userId, city), position })
  }
  if (cityRows.length > 0) {
    const { error } = await supabase.from("trip_cities").insert(cityRows)
    if (error) throw error
  }

  const photoRows = []
  for (const [position, photo] of trip.photos.entries()) {
    photoRows.push({
      trip_id: inserted.id,
      storage_path: await uploadPhoto(userId, inserted.id, photo, position),
      caption: photo.caption ?? null,
      position,
    })
  }
  if (photoRows.length > 0) {
    const { error } = await supabase.from("trip_photos").insert(photoRows)
    if (error) throw error
  }
}

async function readRemoteTrips(userId: string): Promise<Trip[]> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("trips")
    .select(
      "id,local_id,title,destination_label,start_date,end_date,favorite_place,highlight,would_return,note,trip_cities(position,cities(id,name,country_code,latitude,longitude,place_id)),trip_photos(id,storage_path,caption,position)",
    )
    .eq("user_id", userId)
    .order("start_date", { ascending: false })
  if (error) throw error

  const rows = (data ?? []) as RemoteTripRow[]
  return Promise.all(
    rows.map(async (row) => {
      const photos = await Promise.all(
        row.trip_photos
          .sort((a, b) => a.position - b.position)
          .map(async (photo) => {
            const { data: signed, error: signedError } = await supabase.storage
              .from("travel-photos")
              .createSignedUrl(photo.storage_path, 3600)
            if (signedError) throw signedError
            return { id: photo.id, url: signed.signedUrl, ...(photo.caption ? { caption: photo.caption } : {}) }
          }),
      )
      return {
        id: row.local_id ?? row.id,
        title: row.title ?? undefined,
        destinationLabel: row.destination_label,
        cities: row.trip_cities
          .sort((a, b) => a.position - b.position)
          .flatMap(({ cities }) => {
            const city = cities?.[0]
            return city
              ? [{
                  name: city.name,
                  lat: city.latitude,
                  lon: city.longitude,
                  countryCode: city.country_code,
                  ...(city.place_id ? { placeId: city.place_id } : {}),
                }]
              : []
          }),
        startDate: row.start_date,
        endDate: row.end_date,
        favoritePlace: row.favorite_place ?? undefined,
        highlight: row.highlight ?? undefined,
        wouldReturn: row.would_return,
        note: row.note ?? undefined,
        photos,
        coverImage: photos[0]?.url ?? "/placeholder.svg",
      }
    }),
  )
}

export async function syncTripsWithSupabase(localTrips: Trip[]): Promise<Trip[] | null> {
  try {
    const supabase = createSupabaseBrowserClient()
    const { data: userResult, error: userError } = await supabase.auth.getUser()
    if (userError || !userResult.user) {
      if (userError && userError.name !== "AuthSessionMissingError") {
        console.error("Could not identify the user while syncing trips.", userError)
      }
      return null
    }

    if (localTrips.length > 0) {
      for (const trip of localTrips) await importTrip(userResult.user.id, trip)
    }

    return readRemoteTrips(userResult.user.id)
  } catch (error) {
    throw new Error(`Trip sync failed: ${formatSyncError(error)}`)
  }
}
