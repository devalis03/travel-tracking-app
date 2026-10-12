export type Continent =
  | "South America"
  | "North & Central America"
  | "Europe"
  | "Africa"
  | "Asia"
  | "Oceania"
  | "Antarctica"

export type WouldReturn = "yes" | "no" | "unsure"

/** Status a user can assign to a country they have not visited yet. */
export type UnvisitedStatus = "next-trip" | "interested" | "not-interested"

/** Derived preference for a country the user has already visited. */
export type CountryPreference = "want-to-return" | "wouldnt-return"

export interface CityInfo {
  name: string
  lat: number
  lon: number
  /** Which country this city belongs to — lets a single trip span borders. */
  countryCode: string
  /** Identifier from the location service (or a places provider). Absent for manually entered cities. */
  placeId?: string
}

export interface CountryMeta {
  code: string
  name: string
  continent: Continent
  /** Centroid used to focus the globe camera */
  lat: number
  lon: number
}

export interface MemoryPhoto {
  id: string
  url: string
  caption?: string
}

export interface Trip {
  id: string
  /** Optional user-chosen name. When empty the derived `destinationLabel` is shown instead. */
  title?: string
  /**
   * Human-readable summary (e.g. "Seville, Lisbon & Porto"). A trip's
   * countries are never stored directly — they're always derived from
   * `cities[].countryCode` so a single trip can span multiple countries
   * without the two ever drifting apart. See `getTripCountryCodes` in
   * `lib/data.ts`.
   */
  destinationLabel: string
  cities: CityInfo[]
  startDate: string
  endDate: string
  favoritePlace?: string
  highlight?: string
  wouldReturn: WouldReturn
  note?: string
  photos: MemoryPhoto[]
  coverImage: string
}
