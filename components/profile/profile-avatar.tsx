"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { useProfileContext } from "@/components/profile/profile-provider"

/**
 * The user's avatar, read from the shared profile so every place it appears
 * (Profile, Settings, Public Profile) updates together. Falls back to the
 * user's initial when no photo is set.
 */
export function ProfileAvatar({ className, priority = false }: { className?: string; priority?: boolean }) {
  const { profile } = useProfileContext()
  const initial = profile.name.trim().charAt(0).toUpperCase() || "?"

  return (
    <div className={cn("relative size-24 shrink-0 overflow-hidden rounded-full", className)}>
      {profile.avatarUrl ? (
        <Image
          src={profile.avatarUrl}
          alt={`${profile.name}'s profile photo`}
          fill
          sizes="96px"
          className="object-cover"
          priority={priority}
        />
      ) : (
        <div
          role="img"
          aria-label={`${profile.name}'s profile photo placeholder`}
          className="flex size-full items-center justify-center bg-secondary font-serif text-3xl text-muted-foreground"
        >
          {initial}
        </div>
      )}
    </div>
  )
}
