"use client"

import type { ReactNode } from "react"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AddTripFab } from "@/components/layout/add-trip-fab"
import { TripsBoundary } from "@/components/trips/trips-boundary"
import { useAppViewportHeight } from "@/lib/use-app-viewport-height"

export function AppShell({ children }: { children: ReactNode }) {
  useAppViewportHeight()

  return (
    <div
      className="flex justify-center bg-secondary/40 sm:py-4"
      style={{ height: "var(--app-height, 100dvh)" }}
    >
      <div className="safe-top safe-x relative flex h-full w-full max-w-md flex-col overflow-hidden bg-background text-foreground sm:rounded-[2rem] sm:border sm:border-border sm:shadow-2xl">
        <div className="relative min-h-0 flex-1">
          <TripsBoundary>{children}</TripsBoundary>
        </div>
        <AddTripFab />
        <BottomNav />
      </div>
    </div>
  )
}
