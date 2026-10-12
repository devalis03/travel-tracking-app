"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Shuffle as ShuffleIcon, X, ArrowRight } from "lucide-react"
import { getAllMemories, getTripById, trips, formatMonthYear } from "@/lib/data"
import { ScreenHeader } from "@/components/layout/screen-header"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { MediaImage } from "@/components/media/media-image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type Memory = ReturnType<typeof getAllMemories>[number]

export default function MemoriesPage() {
  return (
    <Suspense fallback={<div className="h-full" />}>
      <MemoriesPageInner />
    </Suspense>
  )
}

function shuffleArray<T>(input: T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function monthYearLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(date))
}

function MemoriesPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripFilter = searchParams.get("trip")

  const allMemories = useMemo(() => getAllMemories(), [])
  const [mode, setMode] = useState<"latest" | "shuffle">("latest")
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null)

  const filteredTrip = tripFilter ? getTripById(tripFilter) : undefined
  const baseMemories = filteredTrip ? allMemories.filter((m) => m.tripId === tripFilter) : allMemories

  const shuffled = useMemo(() => shuffleArray(baseMemories), [baseMemories, shuffleSeed])

  // Latest mode groups photos by trip — never by month — so each group is a
  // real trip, ordered most-recent-first, with no album/folder container
  // wrapped around it. The label is only a section divider.
  const latestGroups = useMemo(() => {
    const orderedTrips = filteredTrip
      ? [filteredTrip]
      : [...trips].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

    return orderedTrips
      .map((trip) => {
        const items = baseMemories.filter((m) => m.tripId === trip.id)
        if (items.length === 0) return null
        return {
          key: trip.id,
          label: `${trip.destinationLabel} · ${formatMonthYear(trip.startDate)}`,
          items,
        }
      })
      .filter((group): group is { key: string; label: string; items: Memory[] } => group !== null)
  }, [baseMemories, filteredTrip])

  const memories = mode === "latest" ? baseMemories : shuffled

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <ScreenHeader
        title="Memories"
        subtitle={filteredTrip ? filteredTrip.destinationLabel : "Photos and videos from your travels"}
      />

      {filteredTrip && (
        <button
          type="button"
          onClick={() => router.push("/memories")}
          className="mx-4 mt-2 flex items-center gap-1.5 self-start rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3" /> Clear filter
        </button>
      )}

      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
        <ToggleGroup
          value={[mode]}
          onValueChange={(value) => {
            const next = value[0]
            if (next === "latest" || next === "shuffle") setMode(next)
          }}
          className="rounded-full bg-secondary/40 p-1"
        >
          <ToggleGroupItem value="latest" className="rounded-full px-4 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">
            Latest
          </ToggleGroupItem>
          <ToggleGroupItem value="shuffle" className="rounded-full px-4 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">
            Shuffle
          </ToggleGroupItem>
        </ToggleGroup>

        {mode === "shuffle" && (
          <button
            type="button"
            onClick={() => setShuffleSeed((n) => n + 1)}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ShuffleIcon className="size-3.5" /> Reshuffle
          </button>
        )}
      </div>

      {memories.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">No memories here yet.</p>
      ) : mode === "latest" ? (
        <div className="flex flex-col gap-7 px-4 pb-28 pt-1">
          {latestGroups.map((group) => (
            <div key={group.key} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <p className="whitespace-nowrap text-xs font-medium text-muted-foreground">{group.label}</p>
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {group.items.map((memory) => (
                  <MemoryTile key={memory.photoId} memory={memory} onOpen={() => setActiveMemory(memory)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 px-4 pb-28 pt-2">
          {memories.map((memory, index) => (
            <MemoryTile key={`${memory.photoId}-${index}`} memory={memory} onOpen={() => setActiveMemory(memory)} />
          ))}
        </div>
      )}

      <Dialog open={Boolean(activeMemory)} onOpenChange={(open) => !open && setActiveMemory(null)}>
        {activeMemory && (
          <DialogContent className="max-w-sm gap-3 p-0 sm:max-w-md" showCloseButton>
            <DialogTitle className="sr-only">{activeMemory.caption ?? activeMemory.countryName}</DialogTitle>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-secondary/40">
              <MediaImage
                src={activeMemory.url || "/placeholder.svg"}
                alt={activeMemory.caption ?? activeMemory.countryName}
                fill
                className="object-cover"
                sizes="400px"
                priority
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-4 pb-4">
              <div className="min-w-0">
                {activeMemory.caption && <p className="truncate text-sm">{activeMemory.caption}</p>}
                <p className="truncate text-xs text-muted-foreground">
                  {activeMemory.countryName} · {monthYearLabel(activeMemory.date)}
                </p>
              </div>
              <Link
                href={`/trips/${activeMemory.tripId}`}
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-accent transition-opacity hover:opacity-80"
              >
                View trip <ArrowRight className="size-3" />
              </Link>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

function MemoryTile({ memory, onOpen }: { memory: Memory; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open photo from ${memory.caption ?? memory.countryName}`}
      className="group relative aspect-square overflow-hidden rounded-md bg-secondary/40"
    >
      <MediaImage
        src={memory.url || "/placeholder.svg"}
        alt={memory.caption ?? memory.countryName}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
        sizes="(min-width: 768px) 20vw, 33vw"
      />
    </button>
  )
}
