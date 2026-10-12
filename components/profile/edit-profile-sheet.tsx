"use client"

import type { FormEvent } from "react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useProfileContext } from "@/components/profile/profile-provider"

export function EditProfileSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { profile, updateProfile } = useProfileContext()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") ?? "").trim()
    const username = String(formData.get("username") ?? "").trim()
    const homeCountry = String(formData.get("home") ?? "").trim()
    const bio = String(formData.get("bio") ?? "").trim()

    updateProfile({
      name: name || profile.name,
      username: username || profile.username,
      homeCountry: homeCountry || profile.homeCountry,
      bio,
    })
    onOpenChange(false)
    toast.success("Profile updated")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] rounded-t-3xl">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="font-serif text-xl">Edit profile</SheetTitle>
          <SheetDescription>Update your basic profile details.</SheetDescription>
        </SheetHeader>
        <form key={open ? "open" : "closed"} onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" name="name" defaultValue={profile.name} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-username">Username</Label>
            <Input id="edit-username" name="username" defaultValue={profile.username} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-home">Home country</Label>
            <Input id="edit-home" name="home" defaultValue={profile.homeCountry} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-bio">Short bio</Label>
            <Textarea id="edit-bio" name="bio" defaultValue={profile.bio} rows={2} />
          </div>
          <Button type="submit" size="lg" className="mt-2 w-full">
            Save changes
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
