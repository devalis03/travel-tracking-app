import { CONTINENTS, getContinentCounts } from "@/lib/data"

export function ContinentSummary() {
  const counts = getContinentCounts()

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 px-4 pb-1">
      {CONTINENTS.map((continent) => {
        const count = counts[continent.name] ?? 0
        const visited = count > 0
        return (
          <div key={continent.name} className="flex items-baseline gap-1.5 text-sm">
            <span className={visited ? "text-foreground" : "text-muted-foreground"}>{continent.short}</span>
            <span className={visited ? "font-serif text-accent" : "text-muted-foreground/60"}>
              {continent.name === "Antarctica" && count === 0 ? "—" : count}
            </span>
          </div>
        )
      })}
    </div>
  )
}
