"use client"

import { SettingsGroup } from "@/components/settings/settings-group"
import { SettingsRow } from "@/components/settings/settings-row"
import { Switch } from "@/components/ui/switch"
import { useSettingsContext } from "@/components/settings/settings-provider"

export function MemoriesSettingsGroup() {
  const { settings, updateSetting } = useSettingsContext()

  return (
    <SettingsGroup title="Memories">
      <SettingsRow
        label="Automatic photo suggestions"
        description="Suggest camera photos taken during your recorded trip dates"
        action={
          <Switch
            checked={settings.automaticPhotoSuggestions}
            onCheckedChange={(v) => updateSetting("automaticPhotoSuggestions", v)}
          />
        }
      />
    </SettingsGroup>
  )
}
