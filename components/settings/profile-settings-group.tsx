"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { SettingsGroup } from "@/components/settings/settings-group"
import { SettingsRow } from "@/components/settings/settings-row"
import { EditProfileSheet } from "@/components/profile/edit-profile-sheet"
import { AvatarPickerSheet } from "@/components/profile/avatar-picker-sheet"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { useProfileContext } from "@/components/profile/profile-provider"

export function ProfileSettingsGroup() {
  const [editOpen, setEditOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const { profile } = useProfileContext()
  const chevron = <ChevronRight className="size-4 text-muted-foreground" />

  return (
    <>
      <SettingsGroup title="Profile">
        <SettingsRow label="Name" description={profile.name} onClick={() => setEditOpen(true)} action={chevron} />
        <SettingsRow label="Home country" description={profile.homeCountry} onClick={() => setEditOpen(true)} action={chevron} />
        <SettingsRow label="Bio" description={profile.bio} onClick={() => setEditOpen(true)} action={chevron} />
        <SettingsRow
          label="Profile picture"
          description="Choose, preview or remove your photo"
          onClick={() => setAvatarOpen(true)}
          action={
            <div className="flex items-center gap-2">
              <ProfileAvatar className="size-9 text-sm" />
              {chevron}
            </div>
          }
        />
      </SettingsGroup>
      <EditProfileSheet open={editOpen} onOpenChange={setEditOpen} />
      <AvatarPickerSheet open={avatarOpen} onOpenChange={setAvatarOpen} />
    </>
  )
}
