"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ImagePlus, Loader2, MapPin, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CityPicker } from "@/components/add-trip/city-picker"
import { DateField } from "@/components/add-trip/date-field"
import { createTripId, deriveDestinationLabel, saveTrip } from "@/lib/data"
import { getWorldCountry } from "@/lib/locations"
import { imageFileToDataUrl } from "@/lib/images"
import type { CityInfo, MemoryPhoto, Trip, WouldReturn } from "@/lib/types"

const MAX_PHOTOS = 12
const PLACEHOLDER_COVER = "/placeholder.svg"

interface TripFormProps {
  /** When provided the form edits this trip instead of creating a new one. */
  trip?: Trip
  onDone: (trip?: Trip) => void
  onCancel?: () => void
  onDirtyChange?: (dirty: boolean) => void
}

interface FormState {
  title: string
  cities: CityInfo[]
  startDate: string
  endDate: string
  favoritePlace: string
  highlight: string
  wouldReturn: WouldReturn
  note: string
  photos: MemoryPhoto[]
}

function stateFromTrip(trip?: Trip): FormState {
  return {
    title: trip?.title ?? "",
    cities: trip?.cities ?? [],
    startDate: trip?.startDate ?? "",
    endDate: trip?.endDate ?? "",
    favoritePlace: trip?.favoritePlace ?? "",
    highlight: trip?.highlight ?? "",
    wouldReturn: trip?.wouldReturn ?? "yes",
    note: trip?.note ?? "",
    photos: trip?.photos ?? [],
  }
}

export function AddTripForm({ trip, onDone, onCancel, onDirtyChange }: TripFormProps) {
  const router = useRouter()
  const isEditing = Boolean(trip)
  const initial = useRef(JSON.stringify(stateFromTrip(trip)))
  const fileInput = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<FormState>(() => stateFromTrip(trip))
  const [errors, setErrors] = useState<Partial<Record<"cities" | "startDate" | "endDate", string>>>({})
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const dirty = useMemo(() => JSON.stringify(state) !== initial.current, [state])
  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  function patch(update: Partial<FormState>) {
    setState((current) => ({ ...current, ...update }))
  }

  // Editing without touching the cities keeps the trip's existing label (e.g. the
  // seeded "Seville, Lisbon & Porto") instead of regenerating a country summary.
  const citiesUnchanged = trip !== undefined && JSON.stringify(state.cities) === JSON.stringify(trip.cities)
  const destinationLabel = citiesUnchanged ? trip.destinationLabel : deriveDestinationLabel(state.cities)
  const countryNames = Array.from(new Set(state.cities.map((c) => c.countryCode)))
    .map((code) => getWorldCountry(code)?.name)
    .filter((name): name is string => Boolean(name))

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const room = MAX_PHOTOS - state.photos.length
    const selected = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, Math.max(room, 0))
    if (selected.length === 0) {
      toast.error(room <= 0 ? `You can add up to ${MAX_PHOTOS} photos per trip.` : "Please choose image files.")
      return
    }
    setUploading(true)
    try {
      const added = await Promise.all(
        selected.map(async (file) => ({
          id: `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          url: await imageFileToDataUrl(file),
        })),
      )
      setState((current) => ({ ...current, photos: [...current.photos, ...added] }))
    } catch {
      toast.error("One of the photos couldn't be read.")
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: typeof errors = {}
    if (state.cities.length === 0) nextErrors.cities = "Add at least one city."
    if (!state.startDate) nextErrors.startDate = "Choose a start date."
    if (!state.endDate) nextErrors.endDate = "Choose an end date."
    else if (state.startDate && state.endDate < state.startDate) nextErrors.endDate = "End date can't be before the start."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    const keepCover = trip?.coverImage && trip.coverImage !== PLACEHOLDER_COVER
    const saved: Trip = {
      id: trip?.id ?? createTripId(),
      title: state.title.trim() || undefined,
      destinationLabel,
      cities: state.cities,
      startDate: state.startDate,
      endDate: state.endDate,
      favoritePlace: state.favoritePlace.trim() || undefined,
      highlight: state.highlight.trim() || undefined,
      wouldReturn: state.wouldReturn,
      note: state.note.trim() || undefined,
      photos: state.photos,
      coverImage: keepCover ? trip.coverImage : (state.photos[0]?.url ?? PLACEHOLDER_COVER),
    }

    const persisted = saveTrip(saved)
    if (persisted) {
      toast.success(isEditing ? "Trip updated" : "Trip saved", { description: `${destinationLabel} is on your map.` })
    } else {
      toast.warning("Saved for this session only", {
        description: "Browser storage is full, so remove some photos to keep this trip permanently.",
      })
    }
    onDone(saved)
    if (!isEditing) router.push(`/trips/${saved.id}`)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 pt-4">
      <CityPicker
        cities={state.cities}
        onChange={(cities) => {
          patch({ cities })
          if (cities.length > 0) setErrors((e) => ({ ...e, cities: undefined }))
        }}
        error={errors.cities}
      />

      {destinationLabel && (
        <div className="flex items-start gap-2 rounded-2xl border border-border bg-card/50 px-4 py-3 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
          <p className="text-pretty">
            <span className="font-medium">{destinationLabel}</span>
            {countryNames.length > 1 && countryNames.join(" & ") !== destinationLabel && (
              <span className="text-muted-foreground"> · {countryNames.join(" & ")}</span>
            )}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="trip-title">
          Trip name <span className="text-muted-foreground">Optional</span>
        </Label>
        <Input
          id="trip-title"
          value={state.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder={destinationLabel || "e.g. Iberian road trip"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="start-date">Start date</Label>
          <DateField
            id="start-date"
            title="Start date"
            value={state.startDate}
            onChange={(startDate) => {
              const endBeforeStart = Boolean(state.endDate) && state.endDate < startDate
              patch({ startDate, ...(endBeforeStart ? { endDate: "" } : {}) })
              if (endBeforeStart) toast("End date cleared", { description: "It was earlier than the new start date." })
              setErrors((current) => ({ ...current, startDate: undefined }))
            }}
            invalid={Boolean(errors.startDate)}
          />
          {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end-date">End date</Label>
          <DateField
            id="end-date"
            title="End date"
            min={state.startDate || undefined}
            defaultMonth={state.startDate || undefined}
            value={state.endDate}
            onChange={(endDate) => {
              patch({ endDate })
              setErrors((current) => ({ ...current, endDate: undefined }))
            }}
            invalid={Boolean(errors.endDate)}
          />
          {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="favorite-place">
          Favorite place <span className="text-muted-foreground">Optional</span>
        </Label>
        <Input
          id="favorite-place"
          value={state.favoritePlace}
          onChange={(e) => patch({ favoritePlace: e.target.value })}
          placeholder="e.g. Alfama district"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="highlight">
          Trip highlight <span className="text-muted-foreground">Optional</span>
        </Label>
        <Input
          id="highlight"
          value={state.highlight}
          onChange={(e) => patch({ highlight: e.target.value })}
          placeholder="e.g. Sunset over the Tagus River"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Would you return?</Label>
        <RadioGroup
          value={state.wouldReturn}
          onValueChange={(value) => patch({ wouldReturn: value as WouldReturn })}
          className="flex gap-2"
        >
          {[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "unsure", label: "Not sure" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-2.5 text-sm has-[[data-checked]]:border-accent has-[[data-checked]]:bg-accent/10"
            >
              <RadioGroupItem value={option.value} className="sr-only" />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">
          Travel note <span className="text-muted-foreground">Optional</span>
        </Label>
        <Textarea
          id="note"
          value={state.note}
          onChange={(e) => patch({ note: e.target.value })}
          placeholder="A short personal note about the trip."
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          Memories <span className="text-muted-foreground">Optional</span>
        </Label>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label="Upload photos"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading || state.photos.length >= MAX_PHOTOS}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/20 py-6 text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          <span className="text-sm">{uploading ? "Adding photos..." : "Tap to add photos"}</span>
        </button>
        {state.photos.length > 0 && (
          <ul className="grid grid-cols-4 gap-2">
            {state.photos.map((photo) => (
              <li key={photo.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url || "/placeholder.svg"} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => patch({ photos: state.photos.filter((p) => p.id !== photo.id) })}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-2 flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="lg" className="flex-1" disabled={saving || uploading}>
          {isEditing ? "Save changes" : "Save trip"}
        </Button>
      </div>
    </form>
  )
}
