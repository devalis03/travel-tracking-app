"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, type SettingsState } from "@/lib/settings"

interface SettingsContextValue {
  settings: SettingsState
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  resetSettings: () => void
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
    const saved: unknown = JSON.parse(raw)
    if (!saved || typeof saved !== "object") return DEFAULT_SETTINGS
    const settings = saved as Partial<SettingsState>
    return {
      ...DEFAULT_SETTINGS,
      ...(typeof settings.publicProfile === "boolean" ? { publicProfile: settings.publicProfile } : {}),
      ...(typeof settings.showStatsPublicly === "boolean" ? { showStatsPublicly: settings.showStatsPublicly } : {}),
      ...(typeof settings.showAchievementsPublicly === "boolean"
        ? { showAchievementsPublicly: settings.showAchievementsPublicly }
        : {}),
      ...(typeof settings.showMemoriesPublicly === "boolean" ? { showMemoriesPublicly: settings.showMemoriesPublicly } : {}),
      ...(typeof settings.automaticPhotoSuggestions === "boolean"
        ? { automaticPhotoSuggestions: settings.automaticPhotoSuggestions }
        : {}),
      ...(settings.theme === "system" || settings.theme === "light" || settings.theme === "dark"
        ? { theme: settings.theme }
        : {}),
      ...(typeof settings.reduceMotion === "boolean" ? { reduceMotion: settings.reduceMotion } : {}),
      ...(typeof settings.timelineAnimations === "boolean" ? { timelineAnimations: settings.timelineAnimations } : {}),
    }
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

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS)
  }

  return <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>{children}</SettingsContext.Provider>
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettingsContext must be used within SettingsProvider")
  return ctx
}
