"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ChevronRight } from "lucide-react"
import { jsPDF } from "jspdf"
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
    try {
      const pdf = new jsPDF({ format: "a4", unit: "mm" })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 18
      const textWidth = pageWidth - margin * 2
      let cursorY = margin

      const ensureSpace = (height: number) => {
        if (cursorY + height > pageHeight - margin) {
          pdf.addPage()
          cursorY = margin
        }
      }

      const addText = (text: string, size: number, color: [number, number, number], gap = 5) => {
        pdf.setFontSize(size)
        pdf.setTextColor(...color)
        const lines = pdf.splitTextToSize(text, textWidth) as string[]
        const lineHeight = size * 0.45
        ensureSpace(lines.length * lineHeight + gap)
        pdf.text(lines, margin, cursorY)
        cursorY += lines.length * lineHeight + gap
      }

      const stats = getGlobalStats()
      pdf.setFont("helvetica", "bold")
      addText("Wayfarer Travel Journal", 24, [23, 60, 73], 3)
      addText(profile.name, 11, [95, 108, 115], 12)

      pdf.setFont("helvetica", "normal")
      addText(`${stats.countries} countries · ${stats.cities} cities · ${stats.tripsCount} trips`, 12, [23, 60, 73], 12)
      addText("Trips", 17, [23, 60, 73], 7)

      const sortedTrips = [...trips].sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      )

      for (const trip of sortedTrips) {
        const title = getTripTitle(trip)
        const details = `${formatDateRange(trip.startDate, trip.endDate)} · ${getTripCountryNames(trip).join(", ")}`
        const cities = `Cities: ${trip.cities.map((city) => city.name).join(", ")}`
        const optionalDetails = [trip.favoritePlace && `Favorite place: ${trip.favoritePlace}`, trip.highlight && `Highlight: ${trip.highlight}`, trip.note]
          .filter((value): value is string => Boolean(value))

        ensureSpace(22)
        pdf.setDrawColor(214, 221, 224)
        pdf.line(margin, cursorY - 2, pageWidth - margin, cursorY - 2)
        pdf.setFont("helvetica", "bold")
        addText(title, 14, [23, 60, 73], 2)
        pdf.setFont("helvetica", "normal")
        addText(details, 9, [95, 108, 115], 3)
        addText(cities, 10, [23, 35, 45], 3)
        for (const detail of optionalDetails) addText(detail, 10, [23, 35, 45], 3)
        cursorY += 5
      }

      pdf.save(`wayfarer-travel-journal-${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success("Travel journal PDF exported")
    } catch {
      toast.error("Couldn't create the PDF")
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
