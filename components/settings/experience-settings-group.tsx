"use client"

import { SettingsGroup } from "@/components/settings/settings-group"
import { SettingsRow } from "@/components/settings/settings-row"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettingsContext } from "@/components/settings/settings-provider"
import type { ThemePreference } from "@/lib/settings"

export function ExperienceSettingsGroup() {
  const { settings, updateSetting } = useSettingsContext()

  return (
    <SettingsGroup title="Experience">
      <SettingsRow
        label="Theme"
        description="Choose how Wayfarer looks on your device. System follows your device setting."
        wrapDescription
        action={
          <Select value={settings.theme} onValueChange={(v) => updateSetting("theme", v as ThemePreference)}>
            <SelectTrigger size="sm" aria-label="Theme" className="w-24 border-none bg-transparent px-1 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        }
      />
      <SettingsRow
        label="Reduce motion"
        description="Reduce non-essential animations and transitions throughout Wayfarer."
        wrapDescription
        action={
          <Switch
            aria-label="Reduce motion"
            checked={settings.reduceMotion}
            onCheckedChange={(v) => updateSetting("reduceMotion", v)}
          />
        }
      />
      <SettingsRow
        label="Timeline animations"
        description="Enable the animated glow and flowing effects in Timeline."
        wrapDescription
        action={
          <Switch
            aria-label="Timeline animations"
            checked={settings.timelineAnimations}
            onCheckedChange={(v) => updateSetting("timelineAnimations", v)}
          />
        }
      />
    </SettingsGroup>
  )
}
