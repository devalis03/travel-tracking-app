import { MediaImage } from "@/components/media/media-image"

export function RecapHero({
  year,
  heroImage,
  tripsCount,
  countryCount,
}: {
  year: number
  heroImage: string
  tripsCount: number
  countryCount: number
}) {
  return (
    <div className="relative flex h-[60vh] min-h-72 w-full shrink-0 flex-col justify-end overflow-hidden bg-secondary/40">
      <MediaImage src={heroImage || "/placeholder.svg"} alt={`${year} in travel`} fill className="object-cover" priority />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/10" />
      <div className="relative px-6 pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Your year in travel</p>
        <h1 className="mt-1 font-serif text-6xl leading-none text-balance">{year}</h1>
        <p className="mt-3 text-sm text-foreground/85">
          {tripsCount} {tripsCount === 1 ? "trip" : "trips"} · {countryCount} {countryCount === 1 ? "country" : "countries"}
        </p>
      </div>
    </div>
  )
}
