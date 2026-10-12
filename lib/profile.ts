/**
 * Single source of truth for the user's own identity fields — name, handle,
 * home country, bio, avatar. Shared by the private Profile screen, the Edit
 * Profile sheet, and the public profile view so all three never drift out
 * of sync. Like the rest of the app's mock data, this is in-memory only.
 */
export interface ProfileInfo {
  name: string
  username: string
  homeCountry: string
  bio: string
  avatarUrl: string
  memberSince: string
}

export const DEFAULT_PROFILE: ProfileInfo = {
  name: "Gaston",
  username: "gaston",
  homeCountry: "Argentina",
  bio: "Always planning the next trip.",
  avatarUrl: "/profile-avatar.png",
  memberSince: "2023-11-15",
}

/** @deprecated Use `useProfileContext()` so edits made via the Edit Profile sheet are reflected. */
export const PROFILE = DEFAULT_PROFILE

export const PROFILE_STORAGE_KEY = "wayfarer:profile"

export function getMemberSinceYear(memberSince: string = DEFAULT_PROFILE.memberSince): number {
  return new Date(memberSince).getFullYear()
}
