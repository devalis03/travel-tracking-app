"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UnvisitedStatus } from "@/lib/types"

const STATUS_OPTIONS: Array<{ value: UnvisitedStatus; label: string }> = [
  { value: "interested", label: "Interested" },
  { value: "next-trip", label: "Next trip" },
  { value: "not-interested", label: "Not interested" },
]

export function UnvisitedCountryCard({
  name,
  status,
  onSetStatus,
  onClose,
}: {
  name: string
  status?: UnvisitedStatus
  onSetStatus: (status: UnvisitedStatus | null) => void
  onClose: () => void
}) {
  return (
    <div className="pointer-events-auto absolute inset-x-4 bottom-4 z-20 animate-in fade-in slide-in-from-bottom-4 duration-300 sm:inset-x-auto sm:left-1/2 sm:w-80 sm:-translate-x-1/2">
      <div className="relative rounded-3xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <h3 className="font-serif text-2xl">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">Not visited yet</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const active = status === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSetStatus(active ? null : option.value)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
