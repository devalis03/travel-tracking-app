export type ThemePreference = "system" | "light" | "dark"

export interface SettingsState {
  publicProfile: boolean
  showStatsPublicly: boolean
  showAchievementsPublicly: boolean
  showMemoriesPublicly: boolean
  automaticPhotoSuggestions: boolean
  theme: ThemePreference
  reduceMotion: boolean
  timelineAnimations: boolean
}

export const DEFAULT_SETTINGS: SettingsState = {
  publicProfile: false,
  showStatsPublicly: false,
  showAchievementsPublicly: false,
  showMemoriesPublicly: false,
  automaticPhotoSuggestions: false,
  theme: "system",
  reduceMotion: false,
  timelineAnimations: true,
}

export const SETTINGS_STORAGE_KEY = "wayfarer:settings"
