"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import { Lock } from "lucide-react"
import { getGlobalStats, getAllMemories } from "@/lib/data"
import { getMemberSinceYear } from "@/lib/profile"
import { getFeaturedAchievements, getAchievementsSummary } from "@/lib/achievements"
import { AchievementBadge } from "@/components/profile/achievement-badge"
import { MediaImage } from "@/components/media/media-image"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { ScreenHeader } from "@/components/layout/screen-header"
import { useSettingsContext } from "@/components/settings/settings-provider"
import { useProfileContext } from "@/components/profile/profile-provider"
import { RecapShareButton } from "@/components/recap/recap-share-button"

/**
 * Public-facing profile view — what a visitor at /u/[username] would see.
 * Since this app has no real backend or other users, the "visitor" view is
 * simulated by reading the owner's own privacy toggles from SettingsProvider:
 * each section only renders if the corresponding "show ... publicly" setting
 * is on, and the whole page is gated behind the "Public profile" switch.
 */
export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const { profile: PROFILE } = useProfileContext()
  if (username !== PROFILE.username) notFound()

  const { settings } = useSettingsContext()
  const stats = getGlobalStats()
  const achievementsSummary = getAchievementsSummary()
  const featuredAchievements = getFeaturedAchievements(4)
  const memories = getAllMemories().slice(0, 6)

  if (!settings.publicProfile) {
    return (
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
        <ScreenHeader title="Profile" showBack />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground">
            <Lock className="size-6" strokeWidth={1.75} />
          </div>
          <p className="font-serif text-lg">This profile is private</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {PROFILE.name} hasn&apos;t made their profile public yet. Turn on &quot;Public profile&quot; in Settings to preview
            what visitors would see.
          </p>
        </div>
      </div>
    )
  }

  const summary = [
    { label: "Countries", value: stats.countries },
    { label: "Cities", value: stats.cities },
    { label: "Trips", value: stats.tripsCount },
  ]

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <ScreenHeader title={`@${PROFILE.username}`} showBack />

      <div className="flex flex-col items-center px-6 pb-28 pt-6">
        <ProfileAvatar className="ring-4 ring-accent/20" priority />

        <h1 className="mt-4 font-serif text-2xl">{PROFILE.name}</h1>
        <p className="text-sm text-muted-foreground">{PROFILE.homeCountry}</p>
        <p className="mt-3 max-w-xs text-center text-sm leading-relaxed text-foreground/85">{PROFILE.bio}</p>
        <p className="mt-2 text-xs text-muted-foreground">Member since {getMemberSinceYear(PROFILE.memberSince)}</p>

        {settings.showStatsPublicly && (
          <div className="mt-6 grid w-full grid-cols-3 gap-3">
            {summary.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card/50 py-4">
                <span className="font-serif text-2xl text-accent">{item.value}</span>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {settings.showAchievementsPublicly && featuredAchievements.length > 0 && (
          <section className="mt-8 w-full">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-serif text-lg">Achievements</h2>
              <p className="text-xs text-muted-foreground">
                {achievementsSummary.unlocked} of {achievementsSummary.total} unlocked
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {featuredAchievements.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </section>
        )}

        {settings.showMemoriesPublicly && memories.length > 0 && (
          <section className="mt-8 w-full">
            <h2 className="mb-3 font-serif text-lg">Memories</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {memories.map((memory) => (
                <div key={memory.photoId} className="relative aspect-square overflow-hidden rounded-md bg-secondary/40">
                  <MediaImage
                    src={memory.url || "/placeholder.svg"}
                    alt={memory.caption ?? memory.countryName}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 20vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {!settings.showStatsPublicly && !settings.showAchievementsPublicly && !settings.showMemoriesPublicly && (
          <p className="mt-8 max-w-xs text-center text-sm text-muted-foreground">
            {PROFILE.name} keeps their travel details private.
          </p>
        )}

        <div className="mt-8 w-full">
          <RecapShareButton year={new Date().getFullYear()} tripsCount={stats.tripsCount} countryCount={stats.countries} />
        </div>
      </div>
    </div>
  )
}
