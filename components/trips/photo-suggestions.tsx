"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Sparkles, Plus, X, ImageOff } from "lucide-react"
import { MediaImage } from "@/components/media/media-image"
import { useSettingsContext } from "@/components/settings/settings-provider"
import { getSuggestedPhotosForTrip } from "@/lib/photo-suggestions"

/**
 * Shows camera-roll shots that match this trip's dates and city locations,
 * so photos don't have to be sorted into memories by hand. Accept/dismiss
 * state lives in this component only — like the rest of the app's mock data,
 * it resets on reload rather than persisting to a backend.
 */
export function PhotoSuggestions({ tripId }: { tripId: string }) {
  const { settings } = useSettingsContext()
  const suggestions = getSuggestedPhotosForTrip(tripId)
  const [resolvedIds, setResolvedIds] = useState<string[]>([])
  const [addedIds, setAddedIds] = useState<string[]>([])

  if (!settings.automaticPhotoSuggestions) return null

  const pending = suggestions.filter((photo) => !resolvedIds.includes(photo.id))
  if (pending.length === 0 && addedIds.length === 0) return null

  function handleAdd(id: string) {
    setAddedIds((prev) => [...prev, id])
    setResolvedIds((prev) => [...prev, id])
    toast.success("Added to memories")
  }

  function handleDismiss(id: string) {
    setResolvedIds((prev) => [...prev, id])
  }

  const addedPhotos = suggestions.filter((photo) => addedIds.includes(photo.id))

  return (
    <div className="mt-6">
      {pending.length > 0 && (
        <>
          <p className="mb-3 flex items-center gap-1.5 font-serif text-lg">
            <Sparkles className="size-4 text-accent" /> Suggested photos
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Found in your camera roll, matching this trip&apos;s dates and location.
          </p>
          <div className="flex flex-col gap-2.5">
            {pending.map((photo) => (
              <div key={photo.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-2.5">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary/40">
                  <MediaImage src={photo.url || "/placeholder.svg"} alt={photo.caption} fill className="object-cover" sizes="64px" />
                </div>
                <p className="flex-1 truncate text-sm text-foreground/90">{photo.caption}</p>
                <button
                  type="button"
                  onClick={() => handleDismiss(photo.id)}
                  aria-label="Dismiss suggestion"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-secondary/60"
                >
                  <X className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdd(photo.id)}
                  aria-label="Add to memories"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-opacity active:opacity-80"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {addedPhotos.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {addedPhotos.map((photo) => (
            <div key={photo.id} className="flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent/5 p-2.5">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-secondary/40">
                <MediaImage src={photo.url || "/placeholder.svg"} alt={photo.caption} fill className="object-cover" sizes="48px" />
              </div>
              <p className="flex-1 truncate text-sm text-foreground/90">{photo.caption}</p>
              <span className="shrink-0 text-xs font-medium text-accent">Added</span>
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && addedIds.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ImageOff className="size-3.5" /> No new photos found for this trip
        </p>
      )}
    </div>
  )
}
