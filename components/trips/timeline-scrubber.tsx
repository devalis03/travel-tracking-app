"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { trips, formatDateRange } from "@/lib/data"
import { TimelineMemoryPhotos } from "@/components/trips/timeline-memory-photos"
import { useSettingsContext } from "@/components/settings/settings-provider"
import type { Trip } from "@/lib/types"

const monthYearFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" })

function monthsSinceEpoch(dateStr: string) {
  const d = new Date(dateStr)
  return d.getFullYear() * 12 + d.getMonth()
}

function dateFromMonthIndex(monthIndex: number) {
  const year = Math.floor(monthIndex / 12)
  const month = monthIndex - year * 12
  return new Date(year, month, 1)
}

function monthIndexToParam(monthIndex: number) {
  const year = Math.floor(monthIndex / 12)
  const month = monthIndex - year * 12
  return `${year}-${String(month + 1).padStart(2, "0")}`
}

// Parses the "YYYY-MM" query param used to preserve the user's Timeline
// position across a trip to Trip Detail and back.
function parseMonthParam(param: string | undefined) {
  if (!param) return null
  const match = /^(\d{4})-(\d{1,2})$/.exec(param)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  if (!Number.isFinite(year) || month < 0 || month > 11) return null
  return year * 12 + month
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

// The ribbon is drawn in real pixels inside a native horizontally-scrolling
// container. Leading/trailing spacers half a viewport wide let the very
// first and last months reach screen-center, so scrollLeft maps directly
// (1:1) onto the ribbon's own x-coordinate at the fixed center "playhead" —
// no manual pointer math is needed, the browser's native scroll/momentum
// drives everything.
const PX_PER_MONTH = 40
const WAVELENGTH_PX = PX_PER_MONTH * 5
const TRACK_H = 96
const CENTER_Y = TRACK_H / 2

function waveY(xPx: number, amplitude: number, phase: number) {
  return CENTER_Y + amplitude * Math.sin((xPx / WAVELENGTH_PX) * Math.PI * 2 + phase)
}

function wavePath(trackWidth: number, amplitude: number, phase: number) {
  const step = 8
  const samples = Math.max(2, Math.ceil(trackWidth / step))
  let d = ""
  for (let i = 0; i <= samples; i++) {
    const x = Math.min(trackWidth, i * step)
    const y = waveY(x, amplitude, phase)
    d += i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : ` L${x.toFixed(1)},${y.toFixed(1)}`
  }
  return d
}

const CORE_AMPLITUDE = 13
const CORE_PHASE = 0.5

interface TripWindow {
  trip: Trip
  startMonth: number
  endMonth: number
}

/**
 * Horizontal time scrubber for the Timeline screen. The wave ribbon lives
 * inside a full-width native scroll container (touch/trackpad/mouse-wheel
 * scrolling all just work); a marker fixed at screen-center marks whichever
 * month is currently centered as the user scrolls. Trips are never all
 * mounted at once: only the trip windows whose range contains the current
 * center month are rendered, so the user discovers each one as they scroll.
 */
export function TimelineScrubber({ initialDateParam }: { initialDateParam?: string }) {
  const domain = useMemo(() => {
    const now = new Date()
    const nowMonth = now.getFullYear() * 12 + now.getMonth()
    const windows: TripWindow[] = trips.map((trip) => ({
      trip,
      startMonth: monthsSinceEpoch(trip.startDate),
      endMonth: monthsSinceEpoch(trip.endDate),
    }))
    const oldestMonth = windows.reduce((min, w) => Math.min(min, w.startMonth), nowMonth)
    const minMonth = oldestMonth - 2
    const maxMonth = nowMonth + 2
    return { nowMonth, windows, minMonth, maxMonth, span: Math.max(1, maxMonth - minMonth) }
  }, [])

  const trackWidth = domain.span * PX_PER_MONTH
  const monthToX = (month: number) => (month - domain.minMonth) * PX_PER_MONTH

  // Opening Timeline normally (e.g. from the Trips nav) starts at today. But
  // arriving back from a Trip Detail page that was opened from Timeline
  // carries a `?date=YYYY-MM` param, which restores the exact month the user
  // was viewing instead of resetting to today.
  const initialMonth = useMemo(() => {
    const parsed = parseMonthParam(initialDateParam)
    if (parsed === null) return domain.nowMonth
    return Math.min(domain.maxMonth, Math.max(domain.minMonth, parsed))
  }, [initialDateParam, domain])

  const tealPath = useMemo(() => wavePath(trackWidth, 17, 0), [trackWidth])
  const amberPath = useMemo(() => wavePath(trackWidth, 11, 1.1), [trackWidth])
  const corePath = useMemo(() => wavePath(trackWidth, CORE_AMPLITUDE, CORE_PHASE), [trackWidth])
  const glintDashLength = trackWidth + 240

  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [offsetPx, setOffsetPx] = useState(() => monthToX(initialMonth))
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef({ active: false, startX: 0, startOffset: 0, pointerId: -1 })

  // Measure the visible width so the ribbon can be centered under the fixed
  // playhead via a transform (translateX), independent of native scrolling.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setViewportWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const clampOffset = (value: number) => Math.min(trackWidth, Math.max(0, value))

  // Keep the URL's `date` param in sync with the centered month (debounced so
  // dragging doesn't spam history/router updates) so that a native browser
  // back gesture also restores the position the user was viewing, and a
  // fresh page load from a shared/back-navigated URL resumes there.
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncUrl = (month: number) => {
    router.replace(`/trips/timeline?date=${monthIndexToParam(month)}`, { scroll: false })
  }

  // Pointer-driven drag panning: unifies mouse, trackpad, and touch through
  // one code path (rather than relying on the browser's native horizontal
  // scroll, which can feel unreliable at this container's short height) and
  // tracks the finger/cursor 1:1 for a direct, fluent drag across the whole
  // ribbon.
  const handlePointerDown = (e: React.PointerEvent) => {
    const el = containerRef.current
    if (!el) return
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      // Ignore: some synthetic/edge-case pointer events aren't capturable,
      // but the drag still works fine via the move/up handlers below.
    }
    dragState.current = { active: true, startX: e.clientX, startOffset: offsetPx, pointerId: e.pointerId }
    setIsDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.active) return
    const dx = e.clientX - dragState.current.startX
    setOffsetPx(clampOffset(dragState.current.startOffset - dx))
  }

  const endDrag = (e: React.PointerEvent) => {
    if (!dragState.current.active) return
    dragState.current.active = false
    setIsDragging(false)
    if (containerRef.current?.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId)
    }
    // Flush immediately once the drag settles, rather than waiting on the
    // debounce below, so the URL is already correct if the user taps
    // "View trip" right away.
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncUrl(activeMonthRef.current)
  }

  // Let a mouse wheel or trackpad (vertical or horizontal) pan the ribbon too.
  const handleWheel = (e: React.WheelEvent) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (delta === 0) return
    e.preventDefault()
    setOffsetPx((prev) => clampOffset(prev + delta))
  }

  const fraction = clamp01(offsetPx / trackWidth)
  const activeMonth = Math.round(domain.minMonth + fraction * domain.span)
  const activeDate = dateFromMonthIndex(activeMonth)
  const isToday = activeMonth === domain.nowMonth
  const monthLabel = monthYearFormatter.format(activeDate)
  const dateParam = monthIndexToParam(activeMonth)

  const activeMonthRef = useRef(activeMonth)
  activeMonthRef.current = activeMonth

  // Debounced so continuous dragging/scrolling doesn't spam router.replace;
  // this keeps the URL in sync for a native browser back gesture too.
  useEffect(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => syncUrl(activeMonth), 200)
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMonth])

  const activeTrips = useMemo(
    () => domain.windows.filter((w) => activeMonth >= w.startMonth && activeMonth <= w.endMonth).map((w) => w.trip),
    [domain.windows, activeMonth],
  )

  const playheadY = waveY(offsetPx, CORE_AMPLITUDE, CORE_PHASE)

  const { settings } = useSettingsContext()
  const animated = settings.timelineAnimations && !settings.reduceMotion

  // Memory photos follow the same condition as the trip text and "View trip"
  // link: they only exist while a trip is active, and only for one trip.
  const photoTrip = activeTrips.find((t) => t.photos.length > 0) ?? null
  const rootRef = useRef<HTMLDivElement>(null)
  const tripBlockRef = useRef<HTMLDivElement>(null)
  const ribbonRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={rootRef} className="relative flex flex-1 flex-col items-center justify-center gap-6 pb-24 pt-2">
      <TimelineMemoryPhotos trip={photoTrip} rootRef={rootRef} tripBlockRef={tripBlockRef} ribbonRef={ribbonRef} />
      <div key={`label-${activeMonth}`} className="px-6 text-center animate-in fade-in duration-200">
        <p className="font-serif text-2xl leading-tight text-balance">{monthLabel}</p>
        {isToday && <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-accent">Today</p>}
      </div>

      <div ref={tripBlockRef} className="flex min-h-[132px] w-full max-w-xs flex-col items-center justify-center gap-3 px-6">
        {activeTrips.length > 0 ? (
          activeTrips.map((trip) => (
            <div key={trip.id} data-trip-entry className="flex flex-col items-center gap-1 text-center animate-in fade-in duration-300">
              <p className="font-serif text-base leading-tight text-balance">{trip.destinationLabel}</p>
              <p className="text-xs text-muted-foreground">{formatDateRange(trip.startDate, trip.endDate)}</p>
              {trip.cities.length > 0 && (
                <p className="text-xs text-muted-foreground">{trip.cities.map((c) => c.name).join(" · ")}</p>
              )}
              <Link
                href={`/trips/${trip.id}?from=timeline&date=${dateParam}`}
                className="text-xs font-medium text-accent transition-opacity hover:opacity-80"
              >
                View trip
              </Link>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No trip during this time</p>
        )}
      </div>

      <div ref={ribbonRef} className="flex w-full flex-col items-center gap-3">
        <div
          ref={containerRef}
          className={`relative h-24 w-full touch-none select-none overflow-hidden ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            // Fade the ribbon out at both screen edges so it visually implies
            // a continuous track running beyond the viewport, rather than a
            // finite graphic with a hard start and end.
            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
          role="group"
          aria-label={`Timeline, currently showing ${monthLabel}. Drag left or right to explore.`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onWheel={handleWheel}
        >
          {viewportWidth > 0 && (
            <div
              className="absolute top-0 left-0"
              style={{
                width: trackWidth,
                height: TRACK_H,
                transform: `translateX(${viewportWidth / 2 - offsetPx}px)`,
              }}
            >
              <svg width={trackWidth} height={TRACK_H} className="absolute left-0 top-0" style={{ overflow: "visible" }}>
                    {/* Two softly blurred flowing strands, gently pulsing, evoke a
                        luminous ribbon rather than a flat drawn line. */}
                    <path
                      d={tealPath}
                      fill="none"
                      stroke="oklch(0.62 0.09 195)"
                      strokeWidth={9}
                      strokeLinecap="round"
                      style={{
                        filter: "blur(7px)",
                        opacity: 0.32,
                        animation: animated ? "timeline-pulse 5s ease-in-out infinite" : undefined,
                      }}
                    />
                    <path
                      d={amberPath}
                      fill="none"
                      stroke="oklch(0.8 0.15 68)"
                      strokeWidth={7}
                      strokeLinecap="round"
                      style={{
                        filter: "blur(5px)",
                        opacity: 0.28,
                        animation: animated ? "timeline-pulse 5s ease-in-out infinite" : undefined,
                        animationDelay: "1.4s",
                      }}
                    />
                    {/* Bright core the playhead rides along */}
                    <path
                      d={corePath}
                      fill="none"
                      stroke="oklch(0.96 0.012 88)"
                      strokeWidth={1.4}
                      strokeLinecap="round"
                      opacity={0.55}
                    />
                    {/* Slow traveling glint: a short bright dash animates continuously
                        along the core path, giving the line a living flowing-energy
                        feel instead of sitting static. */}
                    {animated && (
                      <>
                        <path
                          d={corePath}
                          fill="none"
                          stroke="oklch(0.96 0.012 88)"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          opacity={0.9}
                          strokeDasharray="3 34"
                          style={{ filter: "drop-shadow(0 0 4px oklch(0.96 0.012 88 / 0.8))" }}
                        >
                          <animate attributeName="stroke-dashoffset" from="0" to={-glintDashLength} dur="9s" repeatCount="indefinite" />
                        </path>
                        <path
                          d={amberPath}
                          fill="none"
                          stroke="oklch(0.8 0.15 68)"
                          strokeWidth={2}
                          strokeLinecap="round"
                          opacity={0.7}
                          strokeDasharray="2 60"
                          style={{ filter: "drop-shadow(0 0 4px oklch(0.8 0.15 68 / 0.7))" }}
                        >
                          <animate attributeName="stroke-dashoffset" from="0" to={-glintDashLength} dur="14s" repeatCount="indefinite" />
                        </path>
                      </>
                    )}

                    {/* Today marker rides on the track */}
                    <g
                      style={{
                        transform: `translate(${monthToX(domain.nowMonth)}px, ${waveY(monthToX(domain.nowMonth), CORE_AMPLITUDE, CORE_PHASE)}px)`,
                      }}
                    >
                      <line x1={0} y1={-8} x2={0} y2={8} stroke="oklch(0.62 0.09 195)" strokeWidth={1.5} strokeLinecap="round" opacity={0.75} />
                    </g>

                    {/* Small markers for every trip window, so the ribbon reads as a
                        continuous record of travel rather than empty track. */}
                    {domain.windows.map((w) => {
                      const x = monthToX(w.startMonth)
                      const y = waveY(x, CORE_AMPLITUDE, CORE_PHASE)
                      const isActive = activeTrips.some((t) => t.id === w.trip.id)
                      return (
                        <circle
                          key={w.trip.id}
                          cx={x}
                          cy={y}
                          r={isActive ? 3.4 : 2.2}
                          fill={isActive ? "oklch(0.8 0.15 68)" : "oklch(0.96 0.012 88)"}
                          opacity={isActive ? 1 : 0.5}
                          style={isActive ? { filter: "drop-shadow(0 0 5px oklch(0.8 0.15 68 / 0.7))" } : undefined}
                        />
                      )
                    })}
                  </svg>
              </div>
            )}

          {/* Fixed playhead: stays put at screen-center while the ribbon
              scrolls underneath it, marking the currently centered point in time. */}
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-full -translate-x-1/2" aria-hidden>
            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ top: playheadY }}>
              <div
                className="size-4 rounded-full bg-accent/25"
                style={{ filter: "blur(3px)", animation: animated ? "timeline-pulse 2.4s ease-in-out infinite" : undefined }}
              />
              <div
                className="absolute inset-0 m-auto size-2.5 rounded-full bg-accent"
                style={{ filter: "drop-shadow(0 0 6px oklch(0.8 0.15 68 / 0.7))" }}
              />
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">Drag to explore your travel history</p>
      </div>
    </div>
  )
}
