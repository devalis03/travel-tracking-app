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

export function DataSettingsGroup() {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <SettingsGroup title="Data">
        <SettingsRow
          label="Export travel data"
          description="Download a copy of your trips and memories"
          onClick={() => toast.success("Export started — this can take a moment")}
          action={<ChevronRight className="size-4 text-muted-foreground" />}
        />
        <SettingsRow label="Backup status" description="Last backed up just now" action={<span className="text-xs text-muted-foreground">Up to date</span>} />
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
                setConfirmOpen(false)
                toast.success("Deletion request received")
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
