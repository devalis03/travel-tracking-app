"use client"

import Link from "next/link"
import { Settings, ExternalLink } from "lucide-react"
import { getGlobalStats } from "@/lib/data"
import { getMemberSinceYear } from "@/lib/profile"
import { useProfileContext } from "@/components/profile/profile-provider"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { ScreenHeader } from "@/components/layout/screen-header"
import { AchievementsPreview } from "@/components/profile/achievements-preview"
import { ChallengesPreview } from "@/components/profile/challenges-preview"
import { RecapsPreview } from "@/components/profile/recaps-preview"

export default function ProfilePage() {
  const { profile } = useProfileContext()
  const stats = getGlobalStats()

  const summary = [
    { label: "Countries", value: stats.countries },
    { label: "Cities", value: stats.cities },
    { label: "Trips", value: stats.tripsCount },
  ]

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <ScreenHeader
        title="Profile"
        action={
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-secondary/60"
          >
            <Settings className="size-5" strokeWidth={1.75} />
          </Link>
        }
      />

      <div className="flex flex-col items-center px-6 pb-28 pt-6">
        <ProfileAvatar className="ring-4 ring-accent/20" priority />

        <h1 className="mt-4 font-serif text-2xl">{profile.name}</h1>
        <p className="text-sm text-muted-foreground">{profile.homeCountry}</p>
        <p className="mt-3 max-w-xs text-center text-sm leading-relaxed text-foreground/85">{profile.bio}</p>
        <p className="mt-2 text-xs text-muted-foreground">Member since {getMemberSinceYear(profile.memberSince)}</p>

        <Link
          href={`/u/${profile.username}`}
          className="mt-3 flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          View public profile <ExternalLink className="size-3" />
        </Link>

        <div className="mt-6 grid w-full grid-cols-3 gap-3">
          {summary.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card/50 py-4">
              <span className="font-serif text-2xl text-accent">{item.value}</span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        <RecapsPreview />
        <AchievementsPreview />
        <ChallengesPreview />
      </div>
    </div>
  )
}
