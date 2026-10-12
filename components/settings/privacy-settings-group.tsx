"use client"

import { SettingsGroup } from "@/components/settings/settings-group"
import { SettingsRow } from "@/components/settings/settings-row"
import { Switch } from "@/components/ui/switch"
import { useSettingsContext } from "@/components/settings/settings-provider"

export function PrivacySettingsGroup() {
  const { settings, updateSetting } = useSettingsContext()

  return (
    <SettingsGroup title="Privacy">
      <SettingsRow
        label="Public profile"
        description="Let others view your profile"
        action={<Switch checked={settings.publicProfile} onCheckedChange={(v) => updateSetting("publicProfile", v)} />}
      />
      <SettingsRow
        label="Show travel stats"
        description="Countries, cities, and trips"
        action={<Switch checked={settings.showStatsPublicly} onCheckedChange={(v) => updateSetting("showStatsPublicly", v)} />}
      />
      <SettingsRow
        label="Show achievements"
        action={
          <Switch checked={settings.showAchievementsPublicly} onCheckedChange={(v) => updateSetting("showAchievementsPublicly", v)} />
        }
      />
      <SettingsRow
        label="Show memories"
        action={<Switch checked={settings.showMemoriesPublicly} onCheckedChange={(v) => updateSetting("showMemoriesPublicly", v)} />}
      />
    </SettingsGroup>
  )
}
