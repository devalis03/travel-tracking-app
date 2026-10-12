"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import Image from "next/image"
import { Camera, ImageIcon, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { fileToAvatarDataUrl } from "@/lib/image"
import { useProfileContext } from "@/components/profile/profile-provider"
import { ProfileAvatar } from "@/components/profile/profile-avatar"

/**
 * Profile picture flow: choose from the device's photo library (or take a
 * photo on touch devices), preview the result, then confirm, pick another, or
 * cancel. Nothing is saved until the user confirms.
 */
export function AvatarPickerSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { profile, updateProfile } = useProfileContext()
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [canTakePhoto, setCanTakePhoto] = useState(false)
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  // The camera shortcut only makes sense on touch devices; desktop browsers
  // would just open the regular file picker.
  useEffect(() => {
    setCanTakePhoto(window.matchMedia("(pointer: coarse)").matches)
  }, [])

  useEffect(() => {
    if (!open) {
      setDraft(null)
      setError(null)
      setBusy(false)
    }
  }, [open])

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setBusy(true)
    setError(null)
    try {
      setDraft(await fileToAvatarDataUrl(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : "That image could not be used.")
    } finally {
      setBusy(false)
    }
  }

  function confirm() {
    if (!draft) return
    updateProfile({ avatarUrl: draft })
    onOpenChange(false)
    toast.success("Profile picture updated")
  }

  function remove() {
    updateProfile({ avatarUrl: "" })
    onOpenChange(false)
    toast.success("Profile picture removed")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] rounded-t-3xl">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="font-serif text-xl">Profile picture</SheetTitle>
          <SheetDescription>
            {draft ? "Preview your new photo before saving." : "Choose a photo to represent you on Wayfarer."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-5 overflow-y-auto px-4 py-6">
          {draft ? (
            <div className="relative size-40 overflow-hidden rounded-full ring-4 ring-accent/30">
              <Image src={draft} alt="Preview of your new profile photo" fill sizes="160px" className="object-cover" />
            </div>
          ) : (
            <ProfileAvatar className="size-40 text-5xl ring-4 ring-accent/20" />
          )}

          {error && (
            <p role="alert" className="text-center text-sm text-destructive">
              {error}
            </p>
          )}

          <input ref={galleryRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={handleFile} />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="user"
            className="sr-only"
            tabIndex={-1}
            onChange={handleFile}
          />

          {draft ? (
            <div className="flex w-full flex-col gap-2">
              <Button size="lg" className="w-full" onClick={confirm}>
                Use this photo
              </Button>
              <Button variant="secondary" size="lg" className="w-full" onClick={() => galleryRef.current?.click()}>
                Choose another
              </Button>
              <Button variant="ghost" size="lg" className="w-full" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-2">
              <Button size="lg" className="w-full" disabled={busy} onClick={() => galleryRef.current?.click()}>
                <ImageIcon className="size-4" />
                {busy ? "Preparing photo…" : "Choose from gallery"}
              </Button>
              {canTakePhoto && (
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={busy}
                  onClick={() => cameraRef.current?.click()}
                >
                  <Camera className="size-4" />
                  Take photo
                </Button>
              )}
              {profile.avatarUrl && (
                <Button variant="ghost" size="lg" className="w-full text-destructive" onClick={remove}>
                  <Trash2 className="size-4" />
                  Remove current photo
                </Button>
              )}
              <Button variant="ghost" size="lg" className="w-full" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
