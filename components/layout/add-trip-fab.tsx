"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { TripFormSheet } from "@/components/add-trip/trip-form-sheet"

export function AddTripFab() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Hidden on the Map screen: its zoom controls and legend already occupy the
  // bottom-right corner, so a floating trigger there would overlap essential
  // map UI. Hidden on Profile, Achievements, Challenges, and Settings: their
  // grids and lists run edge to edge, so a floating trigger there would
  // overlap that content. Adding a trip remains reachable from every other
  // screen.
  const hiddenOn = ["/profile", "/achievements", "/challenges", "/settings"]
  if (pathname.startsWith("/trips/add") || pathname === "/" || hiddenOn.some((route) => pathname.startsWith(route)))
    return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Log a new trip"
        className="fixed right-4 z-40 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_oklch(0.78_0.14_68/0.5)] transition-transform active:scale-95"
        style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        <Plus className="size-4" strokeWidth={2.25} />
      </button>

      <TripFormSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
