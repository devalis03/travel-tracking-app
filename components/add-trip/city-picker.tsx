"use client"

import { useMemo, useState } from "react"
import { MapPin, Plus, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cityKey, createManualCity, getWorldCountry, searchCities, searchCountries, toCityInfo } from "@/lib/locations"
import type { CityInfo } from "@/lib/types"

interface CityPickerProps {
  cities: CityInfo[]
  onChange: (cities: CityInfo[]) => void
  error?: string
}

/**
 * Search-first destination picker. Cities come from the location service
 * (`lib/locations.ts`) with their country and coordinates attached; anything
 * the dataset doesn't know can be added manually by choosing its country.
 */
export function CityPicker({ cities, onChange, error }: CityPickerProps) {
  const [query, setQuery] = useState("")
  const [manualName, setManualName] = useState<string | null>(null)
  const [countryQuery, setCountryQuery] = useState("")

  const results = useMemo(() => searchCities(query), [query])
  const countryResults = useMemo(() => searchCountries(countryQuery, 6), [countryQuery])
  const trimmed = query.trim()

  function addCity(city: CityInfo) {
    if (!cities.some((existing) => cityKey(existing) === cityKey(city))) onChange([...cities, city])
    setQuery("")
    setManualName(null)
    setCountryQuery("")
  }

  function removeCity(key: string) {
    onChange(cities.filter((city) => cityKey(city) !== key))
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="city-search">Cities visited</Label>

      {cities.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Selected cities">
          {cities.map((city) => {
            const key = cityKey(city)
            return (
              <li
                key={key}
                className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 py-1 pl-3 pr-1.5 text-sm"
              >
                <span>{city.name}</span>
                <span className="text-xs text-muted-foreground">{getWorldCountry(city.countryCode)?.name}</span>
                <button
                  type="button"
                  onClick={() => removeCity(key)}
                  aria-label={`Remove ${city.name}`}
                  className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {manualName === null ? (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="city-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={cities.length === 0 ? "Search a city, e.g. Lisbon" : "Add another city"}
              autoComplete="off"
              className="pl-9"
              aria-invalid={Boolean(error)}
            />
          </div>

          {trimmed && (
            <ul className="overflow-hidden rounded-2xl border border-border bg-card/60">
              {results.map(({ city, country }) => (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => addCity(toCityInfo(city))}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-secondary/50"
                  >
                    <MapPin className="size-4 shrink-0 text-accent" />
                    <span className="text-sm font-medium">{city.name}</span>
                    <span className="text-xs text-muted-foreground">{country.name}</span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => setManualName(trimmed)}
                  className="flex w-full items-center gap-2.5 border-t border-border px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                >
                  <Plus className="size-4 shrink-0" />
                  <span>
                    {results.length === 0 ? "No match." : "Not listed?"} Add &ldquo;{trimmed}&rdquo; manually
                  </span>
                </button>
              </li>
            </ul>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-secondary/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm">
              Which country is <span className="font-medium">{manualName}</span> in?
            </p>
            <button
              type="button"
              onClick={() => {
                setManualName(null)
                setCountryQuery("")
              }}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Back
            </button>
          </div>
          <Input
            value={countryQuery}
            onChange={(e) => setCountryQuery(e.target.value)}
            placeholder="Search countries"
            autoComplete="off"
            aria-label="Search countries"
          />
          <ul className="overflow-hidden rounded-xl border border-border bg-card/60">
            {countryResults.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  onClick={() => addCity(createManualCity(manualName, country))}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-secondary/50"
                >
                  <span>{country.name}</span>
                  <span className="text-xs text-muted-foreground">{country.continent}</span>
                </button>
              </li>
            ))}
            {countryResults.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">No countries found</li>}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
