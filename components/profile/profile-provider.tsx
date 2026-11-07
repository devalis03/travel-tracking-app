"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { DEFAULT_PROFILE, PROFILE_STORAGE_KEY, type ProfileInfo } from "@/lib/profile"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client"
import { getWorldCountry, WORLD_COUNTRIES } from "@/lib/locations"

interface ProfileContextValue {
  profile: ProfileInfo
  hydrated: boolean
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
      ...(typeof profile.phone === "string" ? { phone: profile.phone } : {}),
      ...(typeof profile.age === "number" && Number.isInteger(profile.age) ? { age: profile.age } : {}),
      ...(typeof profile.gender === "string" ? { gender: profile.gender } : {}),
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
    let active = true

    async function hydrateProfile() {
      const localProfile = loadProfile()
      if (active) setProfile(localProfile)

      const { data: userResult, error: userError } = await createSupabaseBrowserClient().auth.getUser()
      if (userError || !userResult.user) {
        if (userError && userError.name !== "AuthSessionMissingError") {
          console.error("Could not load the authenticated user profile.", userError)
        }
        if (active) setHydrated(true)
        return
      }

      const { data, error } = await createSupabaseBrowserClient()
        .from("profiles")
        .select("username,display_name,phone,age,gender,bio,home_country_code,avatar_url,member_since")
        .eq("id", userResult.user.id)
        .maybeSingle()

      if (error) {
        console.error("Could not load the profile from Supabase; using the local profile.", error)
      } else if (data && active) {
        setProfile({
          name: data.display_name,
          username: data.username,
          phone: data.phone ?? "",
          age: data.age ?? null,
          gender: data.gender ?? "",
          homeCountry: data.home_country_code ? (getWorldCountry(data.home_country_code)?.name ?? data.home_country_code) : "",
          bio: data.bio ?? "",
          avatarUrl: data.avatar_url ?? DEFAULT_PROFILE.avatarUrl,
          memberSince: data.member_since,
        })
      }

      if (active) setHydrated(true)
    }

    void hydrateProfile()
    return () => {
      active = false
    }
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
    setProfile((prev) => {
      const next = { ...prev, ...patch }
      void persistProfile(next)
      return next
    })
  }

  function resetProfile() {
    setProfile(DEFAULT_PROFILE)
  }

  async function persistProfile(profile: ProfileInfo) {
    const supabase = createSupabaseBrowserClient()
    const { data: userResult, error: userError } = await supabase.auth.getUser()
    if (userError || !userResult.user) {
      if (userError && userError.name !== "AuthSessionMissingError") {
        console.error("Could not identify the user while saving the profile.", userError)
      }
      return
    }

    const countryCode = WORLD_COUNTRIES.find((country) => country.name.toLowerCase() === profile.homeCountry.toLowerCase())?.code
    const profileUpdate = {
      username: profile.username,
      display_name: profile.name,
      phone: profile.phone || null,
      age: profile.age,
      gender: profile.gender || null,
      bio: profile.bio || null,
      avatar_url: profile.avatarUrl || null,
      ...(countryCode ? { home_country_code: countryCode } : {}),
    }
    const { error } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userResult.user.id)

    if (error) console.error("Could not save the profile to Supabase.", error)
  }

  return <ProfileContext.Provider value={{ profile, hydrated, updateProfile, resetProfile }}>{children}</ProfileContext.Provider>
}

export function useProfileContext() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error("useProfileContext must be used within ProfileProvider")
  return ctx
}
