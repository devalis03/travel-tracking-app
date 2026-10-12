"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { DEFAULT_PROFILE, PROFILE_STORAGE_KEY, type ProfileInfo } from "@/lib/profile"

interface ProfileContextValue {
  profile: ProfileInfo
  updateProfile: (patch: Partial<ProfileInfo>) => void
  resetProfile: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

function loadProfile(): ProfileInfo {
  if (typeof window === "undefined") return DEFAULT_PROFILE
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILE
    const saved: unknown = JSON.parse(raw)
    if (!saved || typeof saved !== "object") return DEFAULT_PROFILE
    const profile = saved as Partial<ProfileInfo>
    return {
      ...DEFAULT_PROFILE,
      ...(typeof profile.name === "string" ? { name: profile.name } : {}),
      ...(typeof profile.username === "string" ? { username: profile.username } : {}),
      ...(typeof profile.homeCountry === "string" ? { homeCountry: profile.homeCountry } : {}),
      ...(typeof profile.bio === "string" ? { bio: profile.bio } : {}),
      ...(typeof profile.avatarUrl === "string" ? { avatarUrl: profile.avatarUrl } : {}),
      ...(typeof profile.memberSince === "string" ? { memberSince: profile.memberSince } : {}),
    }
  } catch {
    return DEFAULT_PROFILE
  }
}

/**
 * Holds the user's editable identity fields (name, username, home country,
 * bio) and persists them to localStorage so edits made in the Edit Profile
 * sheet survive reloads and are reflected everywhere the profile is shown —
 * the private Profile screen, the public profile view, and Settings.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileInfo>(DEFAULT_PROFILE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setProfile(loadProfile())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    } catch {
      // ignore write errors (e.g. private browsing storage limits)
    }
  }, [profile, hydrated])

  function updateProfile(patch: Partial<ProfileInfo>) {
    setProfile((prev) => ({ ...prev, ...patch }))
  }

  function resetProfile() {
    setProfile(DEFAULT_PROFILE)
  }

  return <ProfileContext.Provider value={{ profile, updateProfile, resetProfile }}>{children}</ProfileContext.Provider>
}

export function useProfileContext() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error("useProfileContext must be used within ProfileProvider")
  return ctx
}
