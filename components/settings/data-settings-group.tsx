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
import { clearTrips, formatDateRange, getGlobalStats, getTripCountryNames, getTripTitle, trips } from "@/lib/data"
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

  function exportPdf() {
    const reportWindow = window.open("", "_blank")
    if (!reportWindow) {
      toast.error("Allow pop-ups to create the PDF")
      return
    }

    const escapeHtml = (value: string) =>
      value.replace(
        /[&<>"']/g,
        (character) =>
          ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character,
      )
    const stats = getGlobalStats()
    const tripRows = [...trips]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .map(
        (trip) => `
          <article class="trip">
            <h2>${escapeHtml(getTripTitle(trip))}</h2>
            <p class="muted">${escapeHtml(formatDateRange(trip.startDate, trip.endDate))} · ${escapeHtml(getTripCountryNames(trip).join(", "))}</p>
            <p><strong>Cities:</strong> ${escapeHtml(trip.cities.map((city) => city.name).join(", "))}</p>
            ${trip.favoritePlace ? `<p><strong>Favorite place:</strong> ${escapeHtml(trip.favoritePlace)}</p>` : ""}
            ${trip.highlight ? `<p><strong>Highlight:</strong> ${escapeHtml(trip.highlight)}</p>` : ""}
            ${trip.note ? `<p>${escapeHtml(trip.note)}</p>` : ""}
          </article>
        `,
      )
      .join("")

    reportWindow.document.write(`<!doctype html>
      <html>
        <head>
          <title>Wayfarer travel journal</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            @page { margin: 18mm; }
            body { color: #17232d; font: 11pt Arial, sans-serif; line-height: 1.5; margin: 0; }
            h1, h2 { color: #173c49; font-family: Georgia, serif; }
            h1 { margin-bottom: 0; }
            h2 { margin: 0 0 4px; font-size: 16pt; }
            .muted { color: #5f6c73; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 24px 0; }
            .metric { border: 1px solid #d6dde0; border-radius: 8px; padding: 10px; }
            .metric strong { display: block; font-size: 18pt; }
            .trip { border-top: 1px solid #d6dde0; margin-top: 18px; padding-top: 14px; break-inside: avoid; }
          </style>
        </head>
        <body>
          <h1>Wayfarer travel journal</h1>
          <p class="muted">${escapeHtml(profile.name)} · Exported ${escapeHtml(new Date().toLocaleDateString())}</p>
          <div class="summary">
            <div class="metric"><strong>${stats.countries}</strong>Countries</div>
            <div class="metric"><strong>${stats.cities}</strong>Cities</div>
            <div class="metric"><strong>${stats.tripsCount}</strong>Trips</div>
          </div>
          <h2>Trips</h2>
          ${tripRows || "<p>No trips recorded.</p>"}
        </body>
      </html>`)
    reportWindow.document.close()
    reportWindow.focus()
    reportWindow.addEventListener("afterprint", () => {
      reportWindow.close()
    })
    reportWindow.print()
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
          label="Export travel journal"
          description="Create a readable PDF report without photos"
          onClick={exportPdf}
          action={<ChevronRight className="size-4 text-muted-foreground" />}
        />
        <SettingsRow
          label="Export travel data"
          description="Download a JSON backup for advanced use"
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
