"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ChevronRight } from "lucide-react"
import { SettingsGroup } from "@/components/settings/settings-group"
import { SettingsRow } from "@/components/settings/settings-row"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { clearTrips, trips } from "@/lib/data"
import { PROFILE_STORAGE_KEY } from "@/lib/profile"
import { SETTINGS_STORAGE_KEY } from "@/lib/settings"
import { useProfileContext } from "@/components/profile/profile-provider"
import { useSettingsContext } from "@/components/settings/settings-provider"

export function DataSettingsGroup() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { profile, resetProfile } = useProfileContext()
  const { settings, resetSettings } = useSettingsContext()

  function exportData() {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        profile,
        settings,
        trips,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `wayfarer-export-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success("Travel data exported")
    } catch {
      toast.error("Couldn't export travel data")
    }
  }

  function deleteLocalData() {
    clearTrips()
    resetProfile()
    resetSettings()
    try {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY)
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY)
    } catch {
      toast.warning("Some browser data could not be removed")
    }
    setConfirmOpen(false)
    toast.success("Local travel data deleted")
  }

  return (
    <>
      <SettingsGroup title="Data">
        <SettingsRow
          label="Export travel data"
          description="Download a copy of your trips and memories"
          onClick={exportData}
          action={<ChevronRight className="size-4 text-muted-foreground" />}
        />
        <SettingsRow label="Backup status" description="Stored locally on this device" action={<span className="text-xs text-muted-foreground">Local only</span>} />
        <SettingsRow
          label="Delete account data"
          description="Permanently remove your trips, memories, and profile"
          destructive
          onClick={() => setConfirmOpen(true)}
          action={<ChevronRight className="size-4 text-destructive/70" />}
        />
      </SettingsGroup>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all travel data?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes your trips, memories, and profile. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                deleteLocalData()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
