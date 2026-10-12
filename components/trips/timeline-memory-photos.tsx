"use client"

import { useEffect, useMemo, useState, type RefObject } from "react"
import { MediaImage } from "@/components/media/media-image"
import type { Trip } from "@/lib/types"

type SlotId = "left-high" | "left-low" | "right-high" | "right-low" | "bottom-left" | "bottom-right"

// Controlled-random layouts. Each lists every slot in priority order; slots
// that don't fit the current screen are skipped and the first few that remain
// are used, so the arrangement looks casual without ever colliding.
const TEMPLATES: SlotId[][] = [
  ["left-high", "right-low", "bottom-left", "bottom-right", "right-high", "left-low"],
  ["right-high", "left-low", "bottom-right", "bottom-left", "left-high", "right-low"],
  ["left-high", "right-high", "bottom-left", "bottom-right", "left-low", "right-low"],
  ["right-low", "left-high", "bottom-right", "left-low", "right-high", "bottom-left"],
  ["left-low", "right-high", "bottom-left", "right-low", "left-high", "bottom-right"],
]

const ROTATIONS = [-5, 3, -2, 4, -3, 2]
const ASPECT = 1.3
const MIN_WIDTH = 64
const BLEED = 2
const MIN_TEXT_HALF = 96
const NAV_RESERVE = 100
const EXIT_MS = 220
const ENTER_MS = 380

function hash01(input: string, salt: number) {
  let h = 2166136261 ^ salt
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

interface SafeBox {
  width: number
  height: number
  ribbonTop: number
  ribbonBottom: number
  textHalf: number
}

interface Placed {
  key: string
  url: string
  alt: string
  cx: number
  cy: number
  width: number
  rotation: number
  delay: number
}

function resolveSlot(slot: SlotId, box: SafeBox, seed: string) {
  const { width: W, height: H } = box
  const maxWidth = W < 480 ? 112 : 144
  const jitterX = (hash01(seed + slot, 1) - 0.5) * 8
  const jitterY = (hash01(seed + slot, 2) - 0.5) * 8

  if (slot === "bottom-left" || slot === "bottom-right") {
    const top = box.ribbonBottom + 10
    const bottom = H - NAV_RESERVE
    const bandHeight = bottom - top
    const width = Math.min(maxWidth, bandHeight / ASPECT, W * 0.38)
    if (width < MIN_WIDTH) return null
    const cx = (slot === "bottom-left" ? W * 0.26 : W * 0.74) + jitterX
    return { cx, cy: top + bandHeight / 2 + jitterY, width }
  }

  // Side columns sit above the ribbon, outside the text column, so they never
  // reach the month label, trip text, "View trip" link or the timeline track.
  const columnTop = 8
  const columnBottom = box.ribbonTop - 12
  const columnHeight = columnBottom - columnTop
  const edge = W / 2 - box.textHalf - 10
  const width = Math.min(maxWidth, edge + BLEED, columnHeight / (ASPECT * 1.7))
  if (width < MIN_WIDTH) return null
  const height = width * ASPECT
  const leftCx = (edge - BLEED) / 2
  const isLeft = slot.startsWith("left")
  const high = slot.endsWith("high")
  const cy = columnTop + height / 2 + (columnHeight - height) * (high ? 0.04 : 0.96)
  return { cx: (isLeft ? leftCx : W - leftCx) + jitterX, cy: cy + jitterY, width }
}

function useSafeBox(
  rootRef: RefObject<HTMLElement | null>,
  tripBlockRef: RefObject<HTMLElement | null>,
  ribbonRef: RefObject<HTMLElement | null>,
  tripId: string | null,
) {
  const [box, setBox] = useState<SafeBox | null>(null)

  useEffect(() => {
    const root = rootRef.current
    const ribbon = ribbonRef.current
    if (!root || !ribbon) return

    const measure = () => {
      const rootRect = root.getBoundingClientRect()
      const ribbonRect = ribbon.getBoundingClientRect()
      let widest = 0
      tripBlockRef.current?.querySelectorAll<HTMLElement>("[data-trip-entry]").forEach((entry) => {
        widest = Math.max(widest, entry.getBoundingClientRect().width)
      })
      const next: SafeBox = {
        width: Math.round(rootRect.width),
        height: Math.round(rootRect.height),
        ribbonTop: Math.round(ribbonRect.top - rootRect.top),
        ribbonBottom: Math.round(ribbonRect.bottom - rootRect.top),
        textHalf: Math.max(MIN_TEXT_HALF, Math.round(widest / 2)),
      }
      setBox((prev) =>
        prev &&
        prev.width === next.width &&
        prev.height === next.height &&
        prev.ribbonTop === next.ribbonTop &&
        prev.ribbonBottom === next.ribbonBottom &&
        prev.textHalf === next.textHalf
          ? prev
          : next,
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    observer.observe(ribbon)
    return () => observer.disconnect()
  }, [rootRef, tripBlockRef, ribbonRef, tripId])

  return box
}

interface TimelineMemoryPhotosProps {
  /** The trip that is currently active on the Timeline, or null. */
  trip: Trip | null
  rootRef: RefObject<HTMLElement | null>
  tripBlockRef: RefObject<HTMLElement | null>
  ribbonRef: RefObject<HTMLElement | null>
}

/**
 * A few large memory photos scattered around the Timeline while a trip is
 * active. Only the active trip's small sample is ever mounted, it fades out
 * before the next trip's photos fade in, and the whole layer ignores pointer
 * events so dragging the Timeline always wins.
 */
export function TimelineMemoryPhotos({ trip, rootRef, tripBlockRef, ribbonRef }: TimelineMemoryPhotosProps) {
  const tripId = trip?.id ?? null
  const box = useSafeBox(rootRef, tripBlockRef, ribbonRef, tripId)

  const [shown, setShown] = useState<{ trip: Trip; layout: number } | null>(null)
  const [visible, setVisible] = useState(false)
  const shownId = shown?.trip.id ?? null

  useEffect(() => {
    if (tripId === shownId) {
      if (!trip) return
      const frame = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(frame)
    }
    setVisible(false)
    const timer = setTimeout(
      () => setShown(trip ? { trip, layout: Math.floor(Math.random() * TEMPLATES.length) } : null),
      shown ? EXIT_MS : 0,
    )
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, shownId])

  const placed = useMemo<Placed[]>(() => {
    if (!shown || !box) return []
    const { trip: active, layout } = shown
    const photos = active.photos.filter((photo) => photo.url)
    if (photos.length === 0) return []

    const target = box.width < 480 ? 3 + Math.floor(hash01(active.id, 7) * 2) : 5 + Math.floor(hash01(active.id, 7) * 2)
    const slots = TEMPLATES[layout]
      .map((slot) => ({ slot, rect: resolveSlot(slot, box, active.id) }))
      .filter((entry): entry is { slot: SlotId; rect: NonNullable<ReturnType<typeof resolveSlot>> } => entry.rect !== null)
      .slice(0, Math.min(target, photos.length))

    return slots.map(({ slot, rect }, index) => {
      const photo = photos[Math.floor(((index + 0.5) * photos.length) / slots.length)]
      return {
        key: `${active.id}-${photo.id}-${slot}`,
        url: photo.url,
        alt: `Memory from ${active.destinationLabel}`,
        cx: rect.cx,
        cy: rect.cy,
        width: rect.width,
        rotation: ROTATIONS[(index + Math.floor(hash01(active.id, 9) * ROTATIONS.length)) % ROTATIONS.length],
        delay: index * 60,
      }
    })
  }, [shown, box])

  if (placed.length === 0) return null

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {placed.map((photo) => (
        <figure
          key={photo.key}
          className="absolute m-0 rounded-md bg-card p-1 pb-3 shadow-xl ring-1 ring-border"
          style={{
            left: photo.cx - photo.width / 2,
            top: photo.cy - (photo.width * ASPECT) / 2,
            width: photo.width,
            opacity: visible ? 1 : 0,
            transform: `rotate(${photo.rotation}deg) scale(${visible ? 1 : 0.9})`,
            transition: visible
              ? `opacity ${ENTER_MS}ms ease-out ${photo.delay}ms, transform ${ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${photo.delay}ms`
              : `opacity ${EXIT_MS}ms ease-in, transform ${EXIT_MS}ms ease-in`,
          }}
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[4px] bg-secondary">
            <MediaImage src={photo.url} alt={photo.alt} fill sizes="144px" className="object-cover" />
          </div>
        </figure>
      ))}
    </div>
  )
}
