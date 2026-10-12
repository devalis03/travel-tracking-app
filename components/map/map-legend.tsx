"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Layers } from "lucide-react"
import { MAP_COLORS } from "@/lib/map-colors"

const LEGEND_ITEMS: Array<{ label: string; swatchStyle: React.CSSProperties }> = [
  {
    label: "Visited",
    swatchStyle: { background: MAP_COLORS.visitedFill, border: `1px solid ${MAP_COLORS.visitedStroke}` },
  },
  {
    label: "Next trip",
    swatchStyle: {
      background: MAP_COLORS.baseFill,
      border: `2px solid ${MAP_COLORS.nextTripStroke}`,
      boxShadow: `0 0 4px ${MAP_COLORS.nextTripGlow}`,
    },
  },
  {
    label: "Interested",
    swatchStyle: { background: MAP_COLORS.baseFill, border: `1.5px solid ${MAP_COLORS.interestedStroke}` },
  },
  {
    label: "Not interested",
    swatchStyle: {
      background: MAP_COLORS.baseFill,
      border: `2px dashed ${MAP_COLORS.notInterestedStroke}`,
      boxShadow: `0 0 5px ${MAP_COLORS.notInterestedGlow}`,
    },
  },
  {
    label: "Unvisited",
    swatchStyle: { background: MAP_COLORS.baseFill, border: `1px solid ${MAP_COLORS.baseStroke}` },
  },
]

export function MapLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-20">
      {open && (
        <div className="mb-2 flex flex-col gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2.5 shrink-0 rounded-full" style={item.swatchStyle} />
              {item.label}
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-md transition-colors hover:text-foreground"
      >
        <Layers className="size-3.5" />
        Legend
        {open ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
      </button>
    </div>
  )
}
