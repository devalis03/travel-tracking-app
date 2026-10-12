"use client"

import Link from "next/link"
import { ArrowRight, Heart, HeartCrack, MapPin, X } from "lucide-react"
import { getCountryPreference, getCountrySummary, formatMonthYear } from "@/lib/data"
import { Button } from "@/components/ui/button"

export function CountryInfoCard({ code, onClose }: { code: string; onClose: () => void }) {
  const summary = getCountrySummary(code)
  if (!summary) return null
  const preference = getCountryPreference(code)

  return (
    <div className="pointer-events-auto absolute inset-x-4 bottom-4 z-20 animate-in fade-in slide-in-from-bottom-4 duration-300 sm:inset-x-auto sm:left-1/2 sm:w-96 sm:-translate-x-1/2">
      <div className="relative rounded-3xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <p className="text-xs font-medium uppercase tracking-wide text-accent">{summary.meta.continent}</p>
        <h3 className="mt-1 font-serif text-2xl">{summary.meta.name}</h3>
        <p className="mt-2 text-sm font-medium text-foreground">
          {summary.visitCount} {summary.visitCount === 1 ? "trip" : "trips"}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          {summary.cities.join(" · ")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Last visit {formatMonthYear(summary.lastVisit)}</p>
        {preference && (
          <div
            className={
              preference === "want-to-return"
                ? "mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent"
                : "mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted-foreground/15 px-3 py-1 text-xs font-medium text-muted-foreground"
            }
          >
            {preference === "want-to-return" ? <Heart className="size-3.5" /> : <HeartCrack className="size-3.5" />}
            {preference === "want-to-return" ? "Want to return" : "Wouldn't return"}
          </div>
        )}
        <Button
          render={<Link href={`/country/${code}`} />}
          nativeButton={false}
          className="mt-4 w-full rounded-xl"
        >
          View country
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
