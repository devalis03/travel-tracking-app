import Link from "next/link"
import { getRecapSummaries } from "@/lib/recap"
import { MediaImage } from "@/components/media/media-image"

export function RecapsPreview() {
  const recaps = getRecapSummaries()
  if (recaps.length === 0) return null

  return (
    <div className="mt-6 w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-lg">Your recaps</h2>
      </div>
      <div className="-mx-6 flex gap-3 overflow-x-auto px-6 no-scrollbar">
        {recaps.map((recap) => (
          <Link
            key={recap.year}
            href={`/recap/${recap.year}`}
            className="group relative flex h-40 w-28 shrink-0 flex-col justify-end overflow-hidden rounded-2xl bg-secondary/40"
          >
            <MediaImage
              src={recap.heroImage || "/placeholder.svg"}
              alt={`${recap.year} recap`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="112px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
            <div className="relative p-2.5">
              <p className="font-serif text-xl leading-none">{recap.year}</p>
              <p className="text-[11px] text-foreground/80">
                {recap.tripsCount} {recap.tripsCount === 1 ? "trip" : "trips"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
