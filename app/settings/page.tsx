import { ScreenHeader } from "@/components/layout/screen-header"
import { ProfileSettingsGroup } from "@/components/settings/profile-settings-group"
import { PrivacySettingsGroup } from "@/components/settings/privacy-settings-group"
import { MemoriesSettingsGroup } from "@/components/settings/memories-settings-group"
import { ExperienceSettingsGroup } from "@/components/settings/experience-settings-group"
import { DataSettingsGroup } from "@/components/settings/data-settings-group"

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <ScreenHeader title="Settings" showBack backHref="/profile" />
      <div className="flex flex-col gap-6 px-4 pb-10 pt-4">
        <ProfileSettingsGroup />
        <PrivacySettingsGroup />
        <MemoriesSettingsGroup />
        <ExperienceSettingsGroup />
        <DataSettingsGroup />
      </div>
    </div>
  )
}
