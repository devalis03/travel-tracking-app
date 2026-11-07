"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AddTripFab } from "@/components/layout/add-trip-fab"
import { TripsBoundary } from "@/components/trips/trips-boundary"
import { useAppViewportHeight } from "@/lib/use-app-viewport-height"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client"

export function AppShell({ children }: { children: ReactNode }) {
  useAppViewportHeight()
  const pathname = usePathname()
  const router = useRouter()
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "unauthenticated">("loading")
  const isPublicRoute = pathname.startsWith("/auth") || pathname.startsWith("/u/")
  const showNavigation = authState === "authenticated" && !pathname.startsWith("/auth")

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    let active = true

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return
      if (error && error.name !== "AuthSessionMissingError") {
        console.error("Could not verify the current authentication session.", error)
      }
      setAuthState(data.user ? "authenticated" : "unauthenticated")
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setAuthState(session?.user ? "authenticated" : "unauthenticated")
      if (!session?.user && !isPublicRoute) router.replace("/auth")
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [isPublicRoute, router])

  const isProtectedRoute = !isPublicRoute
  const canRenderContent = !isProtectedRoute || authState === "authenticated"

  return (
    <div
      className="flex justify-center bg-secondary/40 sm:py-4"
      style={{ height: "var(--app-height, 100dvh)" }}
    >
      <div className="safe-top safe-x relative flex h-full w-full max-w-md flex-col overflow-hidden bg-background text-foreground sm:rounded-[2rem] sm:border sm:border-border sm:shadow-2xl">
        <div className="relative min-h-0 flex-1">
          {authState === "loading" && isProtectedRoute ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading...</div>
          ) : !canRenderContent ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Redirecting to sign in...</div>
          ) : (
            <TripsBoundary>{children}</TripsBoundary>
          )}
        </div>
        {showNavigation && (
          <>
            <AddTripFab />
            <BottomNav />
          </>
        )}
      </div>
    </div>
  )
}
