"use client"

import { useCallback, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
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
import { AddTripForm } from "@/components/add-trip/add-trip-form"
import type { Trip } from "@/lib/types"

interface TripFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip?: Trip
}

/** Bottom sheet around the trip form that asks before discarding unsaved changes. */
export function TripFormSheet({ open, onOpenChange, trip }: TripFormSheetProps) {
  const [dirty, setDirty] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isEditing = Boolean(trip)

  const requestClose = useCallback(() => {
    if (dirty) setConfirmOpen(true)
    else onOpenChange(false)
  }, [dirty, onOpenChange])

  function handleOpenChange(next: boolean) {
    if (next) onOpenChange(true)
    else requestClose()
  }

  function finish() {
    setDirty(false)
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[92dvh] rounded-t-3xl">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="font-serif text-xl">{isEditing ? "Edit trip" : "Log a trip"}</SheetTitle>
            <SheetDescription>
              {isEditing ? "Update the details of this trip." : "Add a new destination to your travel map."}
            </SheetDescription>
          </SheetHeader>
          <div className="wayfarer-scroll flex-1 overflow-y-auto px-4 pb-6">
            {open && <AddTripForm trip={trip} onDone={finish} onCancel={requestClose} onDirtyChange={setDirty} />}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>Your unsaved changes to this trip will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                finish()
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
