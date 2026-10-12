"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Globe2, Compass, Images, BarChart3, User, Clock, ListIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"

const NAV_ITEMS = [
  { href: "/", label: "Map", icon: Globe2 },
  { href: "/trips/list", label: "Trips", icon: Compass, isTrips: true },
  { href: "/memories", label: "Memories", icon: Images },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [tripsSheetOpen, setTripsSheetOpen] = useState(false)

  const isActive = (href: string, isTrips?: boolean) => {
    if (isTrips) return pathname.startsWith("/trips")
    return pathname === href
  }

  return (
    <>
      <nav className="safe-bottom z-30 shrink-0 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-[4.5rem] max-w-2xl items-center justify-between px-2 sm:justify-center sm:gap-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, "isTrips" in item ? item.isTrips : false)
            const Icon = item.icon
            const content = (
              <div
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 transition-colors sm:flex-none sm:px-6",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                <span className={cn("text-[11px] font-medium", active && "text-accent")}>{item.label}</span>
              </div>
            )
            if ("isTrips" in item && item.isTrips) {
              return (
                <button
                  key={item.href}
                  type="button"
                  aria-label="Open trips view"
                  onClick={() => setTripsSheetOpen(true)}
                  className="flex-1 sm:flex-none"
                >
                  {content}
                </button>
              )
            }
            return (
              <Link key={item.href} href={item.href} className="flex-1 sm:flex-none">
                {content}
              </Link>
            )
          })}
        </div>
      </nav>

      <Drawer open={tripsSheetOpen} onOpenChange={setTripsSheetOpen} showSwipeHandle>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-serif text-xl">View trips</DrawerTitle>
            <DrawerDescription>Choose how you&apos;d like to explore your travels.</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-3 p-4 pt-2">
            <button
              type="button"
              onClick={() => {
                router.push("/trips/list")
                setTripsSheetOpen(false)
              }}
              className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:bg-secondary/70"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <ListIcon className="size-5" />
              </div>
              <div>
                <p className="font-medium">List</p>
                <p className="text-sm text-muted-foreground">Recent to oldest</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                router.push("/trips/timeline")
                setTripsSheetOpen(false)
              }}
              className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:bg-secondary/70"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="font-medium">Timeline</p>
                <p className="text-sm text-muted-foreground">Explore your travels through time</p>
              </div>
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
