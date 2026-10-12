"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"
import type { GeoJsonObject } from "geojson"
import { Minus, Plus } from "lucide-react"
import worldTopology from "world-atlas/countries-110m.json"
import { getCitiesByCountry, getCountryMeta, getVisitedCountries } from "@/lib/data"
import { getAtlasName } from "@/lib/locations"
import { MAP_COLORS } from "@/lib/map-colors"
import type { UnvisitedStatus } from "@/lib/types"

const SIZE = 800
const BASE_SCALE = 372
const MIN_ZOOM = 0.85
const MAX_ZOOM = 2.1

type Rotation = [number, number, number]

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

/** Whether a lon/lat point sits on the visible (front) hemisphere given the current rotation. */
function isFrontFacing(lon: number, lat: number, rotation: Rotation) {
  const lambda = toRad(lon + rotation[0])
  const phi = toRad(lat)
  const rotPhi = toRad(rotation[1])
  const cosC = Math.sin(rotPhi) * Math.sin(phi) + Math.cos(rotPhi) * Math.cos(phi) * Math.cos(lambda)
  return cosC > -0.05
}

function shortestDelta(from: number, to: number) {
  let d = (to - from) % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

interface WorldGlobeProps {
  selectedCode: string | null
  selectedUnvisitedName: string | null
  unvisitedStatuses: Record<string, UnvisitedStatus>
  onSelectVisited: (code: string) => void
  onSelectUnvisited: (name: string) => void
  onClearSelection: () => void
}

export function WorldGlobe({
  selectedCode,
  selectedUnvisitedName,
  unvisitedStatuses,
  onSelectVisited,
  onSelectUnvisited,
  onClearSelection,
}: WorldGlobeProps) {
  const [rotation, setRotation] = useState<Rotation>([58, -18, 0])
  const [zoom, setZoom] = useState(1)
  const dragState = useRef<{ x: number; y: number; dragging: boolean; moved: boolean }>({
    x: 0,
    y: 0,
    dragging: false,
    moved: false,
  })
  // Tracks every finger currently on the globe (by pointerId) so we can tell
  // a one-finger rotate from a two-finger pinch. Pinch distance is measured
  // between the two active pointers each move to derive a zoom delta —
  // spreading fingers apart zooms in, pinching together zooms out, mirroring
  // familiar mobile map gestures.
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStartDist = useRef<number | null>(null)
  const pinchStartZoom = useRef(1)
  const [hoveredName, setHoveredName] = useState<string | null>(null)
  const autoRotateRef = useRef(true)
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animatingFocus = useRef(false)
  const rafRef = useRef<number | null>(null)

  const visitedCountries = useMemo(() => getVisitedCountries(), [])
  // Map polygons are matched by the atlas dataset's country name, which can
  // differ from the display name (e.g. "United States of America").
  const visitedByAtlasName = useMemo(
    () => new Map(visitedCountries.map((c) => [getAtlasName(c.code) ?? c.name, c] as const)),
    [visitedCountries],
  )
  const selectedCountryCities = useMemo(
    () => (selectedCode ? getCitiesByCountry(selectedCode) : []),
    [selectedCode],
  )

  // Ambient auto-rotation. Re-rendering the globe recomputes the projected
  // path for every country, which is expensive — throttle to ~12fps instead
  // of the raw rAF rate (~60fps) so ambient rotation can't starve the main
  // thread and cause dropped clicks elsewhere on the page.
  useEffect(() => {
    let last = performance.now()
    let accumulated = 0
    const FRAME_INTERVAL = 80
    const tick = (t: number) => {
      const dt = t - last
      last = t
      if (autoRotateRef.current && !animatingFocus.current) {
        accumulated += dt
        if (accumulated >= FRAME_INTERVAL) {
          setRotation((r) => [r[0] + accumulated * 0.006, r[1], r[2]])
          accumulated = 0
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Animate to the focused country when selection changes externally
  useEffect(() => {
    if (!selectedCode) return
    const meta = getCountryMeta(selectedCode)
    if (!meta) return
    autoRotateRef.current = false
    animatingFocus.current = true
    const targetLambda = -meta.lon
    const targetPhi = -meta.lat * 0.55
    const start = performance.now()
    const duration = 700
    const from = rotation
    const dLambda = shortestDelta(from[0], targetLambda)
    const dPhi = targetPhi - from[1]

    const step = (t: number) => {
      const progress = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setRotation([from[0] + dLambda * eased, from[1] + dPhi * eased, 0])
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        animatingFocus.current = false
      }
    }
    requestAnimationFrame(step)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs only on selection change
  }, [selectedCode])

  const pauseAutoRotate = useCallback(() => {
    autoRotateRef.current = false
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current)
  }, [])

  const scheduleResume = useCallback(() => {
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current)
    resumeTimeout.current = setTimeout(() => {
      autoRotateRef.current = true
    }, 3200)
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (activePointers.current.size === 1) {
      dragState.current = { x: e.clientX, y: e.clientY, dragging: true, moved: false }
    } else {
      // A second finger just landed — stop rotating and let the next
      // pointermove establish the pinch baseline distance.
      dragState.current.dragging = false
      pinchStartDist.current = null
    }
    pauseAutoRotate()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const active = activePointers.current
    if (active.has(e.pointerId)) {
      active.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    if (active.size === 2) {
      // Two fingers down: pinch-to-zoom takes over and one-finger rotation
      // is suppressed for the rest of this gesture, so a drag in progress
      // can't accidentally keep rotating once a second finger lands.
      dragState.current.dragging = false
      const [a, b] = Array.from(active.values())
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinchStartDist.current === null) {
        pinchStartDist.current = dist
        pinchStartZoom.current = zoom
      } else {
        const scale = dist / pinchStartDist.current
        setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchStartZoom.current * scale)))
      }
      dragState.current.moved = true
      return
    }

    if (!dragState.current.dragging) return
    const dx = e.clientX - dragState.current.x
    const dy = e.clientY - dragState.current.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragState.current.moved = true
    dragState.current.x = e.clientX
    dragState.current.y = e.clientY
    setRotation((r) => {
      const nextPhi = Math.max(-80, Math.min(80, r[1] - dy * 0.35))
      return [r[0] + dx * 0.35, nextPhi, 0]
    })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId)
    if (activePointers.current.size < 2) {
      pinchStartDist.current = null
    }
    // One finger remains after a pinch: treat it as the start of a fresh
    // rotate rather than resuming the pre-pinch drag origin.
    if (activePointers.current.size === 1) {
      const [remaining] = Array.from(activePointers.current.values())
      dragState.current = { x: remaining.x, y: remaining.y, dragging: true, moved: true }
      return
    }
    dragState.current.dragging = false
    scheduleResume()
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    pauseAutoRotate()
    scheduleResume()
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - e.deltaY * 0.0012)))
  }

  const adjustZoom = (delta: number) => {
    pauseAutoRotate()
    scheduleResume()
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 100) / 100)))
  }

  return (
    <div className="relative flex w-full max-w-[min(92vw,32rem)] items-center justify-center">
      {/* Subtle starfield behind the globe for depth. Static to avoid extra repaint cost. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-16 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, oklch(0.9 0 0 / 0.5) 0.6px, transparent 1.2px), radial-gradient(circle at 80% 15%, oklch(0.9 0 0 / 0.4) 0.6px, transparent 1.2px), radial-gradient(circle at 60% 75%, oklch(0.9 0 0 / 0.45) 0.6px, transparent 1.2px), radial-gradient(circle at 25% 85%, oklch(0.9 0 0 / 0.35) 0.6px, transparent 1.2px), radial-gradient(circle at 90% 60%, oklch(0.9 0 0 / 0.4) 0.6px, transparent 1.2px)",
          backgroundSize: "160px 160px",
        }}
      />

      <div
        className="relative aspect-square w-full touch-none select-none"
        style={{ filter: "drop-shadow(0 0 70px oklch(0.62 0.09 195 / 0.22))" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <ComposableMap
          projection="geoOrthographic"
          projectionConfig={{ scale: BASE_SCALE * zoom, rotate: rotation }}
          width={SIZE}
          height={SIZE}
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <radialGradient id="globe-sphere" cx="38%" cy="32%" r="75%">
              <stop offset="0%" stopColor="oklch(0.28 0.055 210)" />
              <stop offset="55%" stopColor="oklch(0.19 0.035 220)" />
              <stop offset="100%" stopColor="oklch(0.1 0.022 230)" />
            </radialGradient>
            <radialGradient id="globe-atmosphere" cx="50%" cy="50%" r="50%">
              <stop offset="82%" stopColor="oklch(0.62 0.09 195)" stopOpacity="0" />
              <stop offset="97%" stopColor="oklch(0.62 0.09 195)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="oklch(0.62 0.09 195)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={BASE_SCALE * zoom * 1.03} fill="url(#globe-atmosphere)" />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={BASE_SCALE * zoom} fill="url(#globe-sphere)" />
          <Geographies geography={worldTopology as unknown as GeoJsonObject}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = (geo.properties as { name?: string })?.name ?? ""
                const visited = visitedByAtlasName.has(name)
                const unvisitedStatus = !visited ? unvisitedStatuses[name] : undefined
                const isSelected =
                  (visited && visitedByAtlasName.get(name)?.code === selectedCode) ||
                  (!visited && name === selectedUnvisitedName)
                const isHovered = hoveredName === name

                // Visited countries keep a strong fill. Every unvisited status
                // (next trip / interested / not interested) intentionally keeps
                // the same base terrain fill and differentiates purely through
                // the border, so a full country fill stays reserved for "visited".
                let fill: string
                let stroke: string
                let strokeWidth: number
                let strokeDasharray: string | undefined
                let glow = "none"

                if (visited) {
                  fill = isHovered ? MAP_COLORS.visitedFillHover : MAP_COLORS.visitedFill
                  stroke = MAP_COLORS.visitedStroke
                  strokeWidth = 0.5
                } else if (unvisitedStatus === "next-trip") {
                  fill = isHovered ? MAP_COLORS.baseFillHover : MAP_COLORS.baseFill
                  stroke = MAP_COLORS.nextTripStroke
                  strokeWidth = 1.6
                  glow = `drop-shadow(0 0 2.5px ${MAP_COLORS.nextTripGlow})`
                } else if (unvisitedStatus === "interested") {
                  fill = isHovered ? MAP_COLORS.baseFillHover : MAP_COLORS.baseFill
                  stroke = MAP_COLORS.interestedStroke
                  strokeWidth = 1.2
                } else if (unvisitedStatus === "not-interested") {
                  // Deliberately the boldest border of any status — brighter,
                  // thicker, dashed, and glowing — so it reads instantly at
                  // default zoom without the user needing to zoom in.
                  fill = isHovered ? MAP_COLORS.baseFillHover : MAP_COLORS.baseFill
                  stroke = MAP_COLORS.notInterestedStroke
                  strokeWidth = 2.4
                  strokeDasharray = "3,2.2"
                  glow = `drop-shadow(0 0 3.5px ${MAP_COLORS.notInterestedGlow})`
                } else {
                  fill = isHovered ? MAP_COLORS.baseFillHover : MAP_COLORS.baseFill
                  stroke = MAP_COLORS.baseStroke
                  strokeWidth = 0.5
                }

                // Selecting a status country briefly emphasizes it further —
                // brighter stroke, a touch of glow, and a one-time pulse. Keying
                // on selection remounts the path so the pulse animation restarts
                // each time, but only ever plays once per selection.
                const isEmphasized = isSelected && !visited && Boolean(unvisitedStatus)

                return (
                  <Geography
                    key={isEmphasized ? `${geo.rsmKey}-selected` : geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      if (dragState.current.moved) return
                      if (!name) return
                      if (visited) {
                        const code = visitedByAtlasName.get(name)?.code
                        if (code) onSelectVisited(code)
                      } else {
                        onSelectUnvisited(name)
                      }
                    }}
                    onMouseEnter={() => setHoveredName(name)}
                    onMouseLeave={() => setHoveredName((prev) => (prev === name ? null : prev))}
                    style={{
                      fill,
                      stroke,
                      strokeWidth: isSelected ? strokeWidth + (visited ? 0.6 : 0.7) : strokeWidth,
                      strokeDasharray,
                      outline: "none",
                      cursor: name ? "pointer" : "default",
                      transition: "fill 200ms, stroke-width 200ms",
                      filter: isSelected && visited ? "brightness(1.25)" : glow,
                      animation: isEmphasized ? "map-country-pulse 800ms ease-out" : undefined,
                    }}
                  />
                )
              })
            }
          </Geographies>

          {visitedCountries.map((c) => {
            if (!isFrontFacing(c.lon, c.lat, rotation)) return null
            const active = c.code === selectedCode

            // When this country is selected, reveal its individual visited cities.
            if (active) {
              return selectedCountryCities.map((city) => {
                if (!isFrontFacing(city.lon, city.lat, rotation)) return null
                return (
                  <Marker key={`${c.code}-${city.name}`} coordinates={[city.lon, city.lat]}>
                    <circle r={5} fill="oklch(0.78 0.14 68)" stroke="oklch(0.16 0.028 236)" strokeWidth={1.5} />
                    <circle r={11} fill="none" stroke="oklch(0.78 0.14 68)" strokeWidth={1} opacity={0.5} />
                    <text
                      y={-14}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={500}
                      fill="oklch(0.96 0.01 90)"
                      style={{ paintOrder: "stroke", stroke: "oklch(0.1 0.02 230)", strokeWidth: 3 }}
                    >
                      {city.name}
                    </text>
                  </Marker>
                )
              })
            }

            // Default: a single subtle aggregate dot per visited country.
            return (
              <Marker key={c.code} coordinates={[c.lon, c.lat]}>
                <circle r={3.2} fill="oklch(0.78 0.14 68)" stroke="oklch(0.16 0.028 236)" strokeWidth={1.2} opacity={0.85} />
              </Marker>
            )
          })}
        </ComposableMap>
      </div>

      <div className="pointer-events-auto absolute bottom-0 right-0 flex flex-col overflow-hidden rounded-full border border-border bg-card/90 shadow-lg backdrop-blur-md">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => adjustZoom(0.18)}
          className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="size-4" />
        </button>
        <div className="h-px w-full bg-border" />
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => adjustZoom(-0.18)}
          className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <Minus className="size-4" />
        </button>
      </div>
    </div>
  )
}
