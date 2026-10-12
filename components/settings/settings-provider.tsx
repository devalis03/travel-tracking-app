"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, type SettingsState } from "@/lib/settings"

interface SettingsContextValue {
  settings: SettingsState
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function loadSettings(): SettingsState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) {
      // First visit: follow the device's reduced-motion accessibility setting.
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      return { ...DEFAULT_SETTINGS, reduceMotion: prefersReducedMotion }
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/**
 * Holds user preference toggles at the root layout and persists them to
 * localStorage, so privacy and display settings survive reloads even though
 * this app has no backend. The first render always uses DEFAULT_SETTINGS
 * (for SSR consistency); the real, persisted values are applied right after
 * mount to avoid a hydration mismatch.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore write errors (e.g. private browsing storage limits)
    }
  }, [settings, hydrated])

  function updateSetting<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return <SettingsContext.Provider value={{ settings, updateSetting }}>{children}</SettingsContext.Provider>
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettingsContext must be used within SettingsProvider")
  return ctx
}
