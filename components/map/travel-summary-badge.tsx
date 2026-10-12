import Link from "next/link"
import { getGlobalStats } from "@/lib/data"

/**
 * Lightweight, non-overlapping stats row shown above the globe. Deliberately
 * plain — three inline stat items, no card, no background — so it never
 * competes with the title/subtitle above it or the globe below it.
 */
export function TravelSummaryBadge() {
  const stats = getGlobalStats()

  const items = [
    { value: `${stats.worldPercent}%`, label: "World explored" },
    { value: stats.countries, label: "Countries" },
    { value: stats.cities, label: "Cities" },
  ]

  return (
    <Link href="/stats" className="mt-3 flex items-stretch gap-3 transition-opacity hover:opacity-80">
      {items.map((item, index) => (
        <div key={item.label} className="flex flex-1 items-center gap-3">
          {index > 0 && <span className="h-7 w-px shrink-0 bg-border" aria-hidden />}
          <div className="flex min-w-0 flex-col">
            <span className="font-serif text-lg leading-none text-accent">{item.value}</span>
            <span className="mt-0.5 truncate text-[10px] leading-none text-muted-foreground">{item.label}</span>
          </div>
        </div>
      ))}
    </Link>
  )
}
