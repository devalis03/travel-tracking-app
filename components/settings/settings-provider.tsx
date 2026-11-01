"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, type SettingsState } from "@/lib/settings"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client"

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
    let active = true

    async function hydrateSettings() {
      const localSettings = loadSettings()
      if (active) setSettings(localSettings)

      const { data: userResult, error: userError } = await createSupabaseBrowserClient().auth.getUser()
      if (userError || !userResult.user) {
        if (userError) console.error("Could not load the authenticated user settings.", userError)
        if (active) setHydrated(true)
        return
      }

      const { data, error } = await createSupabaseBrowserClient()
        .from("user_settings")
        .select(
          "public_profile,show_stats_publicly,show_achievements_publicly,show_memories_publicly,automatic_photo_suggestions,theme,reduce_motion,timeline_animations",
        )
        .eq("user_id", userResult.user.id)
        .maybeSingle()

      if (error) {
        console.error("Could not load the settings from Supabase; using local settings.", error)
      } else if (data && active) {
        setSettings({
          publicProfile: data.public_profile,
          showStatsPublicly: data.show_stats_publicly,
          showAchievementsPublicly: data.show_achievements_publicly,
          showMemoriesPublicly: data.show_memories_publicly,
          automaticPhotoSuggestions: data.automatic_photo_suggestions,
          theme: data.theme,
          reduceMotion: data.reduce_motion,
          timelineAnimations: data.timeline_animations,
        })
      }

      if (active) setHydrated(true)
    }

    void hydrateSettings()
    return () => {
      active = false
    }
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
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      void persistSettings(next)
      return next
    })
  }

  async function persistSettings(settings: SettingsState) {
    const supabase = createSupabaseBrowserClient()
    const { data: userResult, error: userError } = await supabase.auth.getUser()
    if (userError || !userResult.user) {
      if (userError) console.error("Could not identify the user while saving settings.", userError)
      return
    }

    const { error } = await supabase
      .from("user_settings")
      .update({
        public_profile: settings.publicProfile,
        show_stats_publicly: settings.showStatsPublicly,
        show_achievements_publicly: settings.showAchievementsPublicly,
        show_memories_publicly: settings.showMemoriesPublicly,
        automatic_photo_suggestions: settings.automaticPhotoSuggestions,
        theme: settings.theme,
        reduce_motion: settings.reduceMotion,
        timeline_animations: settings.timelineAnimations,
      })
      .eq("user_id", userResult.user.id)

    if (error) console.error("Could not save settings to Supabase.", error)
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
