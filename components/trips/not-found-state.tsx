"use client"

import Link from "next/link"
import { isTripsHydrated } from "@/lib/data"
import { ScreenHeader } from "@/components/layout/screen-header"

/**
 * Shown when a trip-backed screen finds nothing. Before saved trips have been
 * read from browser storage nothing is rendered, so a trip that exists only in
 * storage is never reported missing on a fresh load.
 */
export function NotFoundState({ title, backHref, backLabel }: { title: string; backHref: string; backLabel: string }) {
  if (!isTripsHydrated()) return null
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={title} showBack />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-serif text-xl">Nothing here</p>
        <p className="text-sm text-muted-foreground">This page may have been deleted or never existed.</p>
        <Link href={backHref} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          {backLabel}
        </Link>
      </div>
    </div>
  )
}
