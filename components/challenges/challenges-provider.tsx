"use client"

import { createContext, useCallback, useContext, useState, type ReactNode } from "react"

interface ChallengesContextValue {
  activatedIds: Set<string>
  activate: (id: string) => void
}

const ChallengesContext = createContext<ChallengesContextValue | null>(null)

/**
 * Holds which challenges the user has activated. Lives in memory at the root
 * layout so it survives client-side navigation between Profile and the
 * Challenges page within a session — this app has no backend persistence
 * layer, so, like the rest of its mock data, activation resets on reload.
 */
export function ChallengesProvider({ children }: { children: ReactNode }) {
  const [activatedIds, setActivatedIds] = useState<Set<string>>(new Set())

  const activate = useCallback((id: string) => {
    setActivatedIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  return <ChallengesContext.Provider value={{ activatedIds, activate }}>{children}</ChallengesContext.Provider>
}

export function useChallengesContext() {
  const ctx = useContext(ChallengesContext)
  if (!ctx) throw new Error("useChallengesContext must be used within ChallengesProvider")
  return ctx
}
