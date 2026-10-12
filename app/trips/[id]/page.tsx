"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Heart, HelpCircle, XCircle, MapPin, Sparkles, ArrowRight, Pencil, Trash2 } from "lucide-react"
import {
  deleteTrip,
  getTripById,
  getTripTitle,
  getTripsByCountry,
  getCountryMeta,
  getTripCountryCodes,
  getTripCountryNames,
  formatDateRange,
  formatMonthYear,
} from "@/lib/data"
import { ScreenHeader } from "@/components/layout/screen-header"
import { MediaImage } from "@/components/media/media-image"
import { PhotoSuggestions } from "@/components/trips/photo-suggestions"
import { NotFoundState } from "@/components/trips/not-found-state"
import { TripFormSheet } from "@/components/add-trip/trip-form-sheet"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const RETURN_COPY = {
  yes: { label: "Yes, in a heartbeat", icon: Heart, tone: "text-accent" },
  unsure: { label: "Not sure yet", icon: HelpCircle, tone: "text-muted-foreground" },
  no: { label: "Probably not", icon: XCircle, tone: "text-destructive" },
} as const

export default function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string; date?: string }>
}) {
  const { id } = use(params)
  const { from, date } = use(searchParams)
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const trip = getTripById(id)
  if (!trip) return <NotFoundState title="Trip" backHref="/trips/list" backLabel="View trips" />

  const tripCountryCodes = getTripCountryCodes(trip)
  const meta = getCountryMeta(tripCountryCodes[0])
  const countrySubtitle = getTripCountryNames(trip).join(" & ") || meta?.name
  const otherTrips = tripCountryCodes
    .flatMap((code) => getTripsByCountry(code))
    .filter((t, i, arr) => t.id !== trip.id && arr.findIndex((o) => o.id === t.id) === i)
  const returnInfo = RETURN_COPY[trip.wouldReturn]
  const ReturnIcon = returnInfo.icon

  // Opened from Timeline at a specific point in time: Back should return to
  // that exact month rather than resetting Timeline to today.
  const backHref = from === "timeline" && date ? `/trips/timeline?date=${date}` : undefined

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <ScreenHeader title={getTripTitle(trip)} subtitle={countrySubtitle} showBack backHref={backHref} />

      <div className="relative h-52 w-full shrink-0 bg-secondary/40">
        <MediaImage src={trip.coverImage || "/placeholder.svg"} alt={trip.destinationLabel} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/5 to-transparent" />
      </div>

      <div className="flex-1 px-4 pb-10 pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{formatDateRange(trip.startDate, trip.endDate)}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" /> Edit
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Delete trip" onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-sm">
          <MapPin className="size-4 text-accent" />
          <span>{trip.cities.map((c) => c.name).join(", ")}</span>
        </div>

        <div className={"mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card/50 px-4 py-3 " + returnInfo.tone}>
          <ReturnIcon className="size-4" />
          <span className="text-sm font-medium">Would return: {returnInfo.label}</span>
        </div>

        {(trip.favoritePlace || trip.highlight) && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {trip.favoritePlace && (
              <div className="rounded-2xl border border-border bg-card/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Favorite place</p>
                <p className="mt-1 font-serif text-lg">{trip.favoritePlace}</p>
              </div>
            )}
            {trip.highlight && (
              <div className="rounded-2xl border border-border bg-card/40 p-4">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="size-3.5" /> Highlight
                </p>
                <p className="mt-1 font-serif text-lg">{trip.highlight}</p>
              </div>
            )}
          </div>
        )}

        {trip.note && (
          <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Travel note</p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{trip.note}</p>
          </div>
        )}

        {trip.photos.length > 0 && (
          <div className="mt-6">
            <Link href={`/memories?trip=${trip.id}`} className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg">Memories</h2>
              <span className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                View all <ArrowRight className="size-3" />
              </span>
            </Link>
            <div className="grid grid-cols-2 gap-2">
              {trip.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary/40">
                  <MediaImage
                    src={photo.url || "/placeholder.svg"}
                    alt={photo.caption ?? trip.destinationLabel}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <PhotoSuggestions tripId={trip.id} />

        {otherTrips.length > 0 && meta && (
          <div className="mt-6 rounded-2xl border border-accent/25 bg-accent/5 p-4">
            <p className="text-sm font-medium">You&apos;ve been to {meta.name} before</p>
            <div className="mt-3 flex flex-col gap-2">
              {otherTrips.map((other) => (
                <Link
                  key={other.id}
                  href={`/trips/${other.id}`}
                  className="flex items-center justify-between rounded-xl bg-card/60 px-3 py-2.5 transition-colors hover:bg-card"
                >
                  <div>
                    <p className="text-sm font-medium">{other.cities.map((c) => c.name).join(", ")}</p>
                    <p className="text-xs text-muted-foreground">{formatMonthYear(other.startDate)}</p>
                  </div>
                  <ArrowRight className="size-4 text-accent" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <TripFormSheet open={editing} onOpenChange={setEditing} trip={trip} />

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
            <AlertDialogDescription>
              {getTripTitle(trip)} and its memories will be removed from your map, stats and recap.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep trip</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                router.replace("/trips/list")
                deleteTrip(trip.id)
                toast.success("Trip deleted")
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
