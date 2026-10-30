import type { LocationCity } from "@/lib/locations"
import type { CountryMeta } from "@/lib/types"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client"

interface CountryRow {
  code: string
  name: string
  continent: CountryMeta["continent"]
  latitude: number
  longitude: number
  atlas_name: string | null
}

interface CityRow {
  id: string
  name: string
  country_code: string
  latitude: number
  longitude: number
  place_id: string | null
}

export interface LocationCatalog {
  countries: CountryMeta[]
  cities: LocationCity[]
}

export async function fetchLocationCatalog(): Promise<LocationCatalog> {
  const supabase = createSupabaseBrowserClient()
  const [countriesResult, citiesResult] = await Promise.all([
    supabase.from("countries").select("code,name,continent,latitude,longitude,atlas_name").order("name"),
    supabase.from("cities").select("id,name,country_code,latitude,longitude,place_id").order("name"),
  ])
  if (countriesResult.error) throw countriesResult.error
  if (citiesResult.error) throw citiesResult.error

  return {
    countries: (countriesResult.data as CountryRow[]).map((country) => ({
      code: country.code,
      name: country.name,
      continent: country.continent,
      lat: country.latitude,
      lon: country.longitude,
    })),
    cities: (citiesResult.data as CityRow[]).map((city) => ({
      id: city.id,
      name: city.name,
      countryCode: city.country_code,
      lat: city.latitude,
      lon: city.longitude,
      ...(city.place_id ? { placeId: city.place_id } : {}),
    })),
  }
}
