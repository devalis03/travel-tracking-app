"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { toast } from "sonner"
import { SettingsGroup } from "@/components/settings/settings-group"
import { SettingsRow } from "@/components/settings/settings-row"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client"

export function AccountSettingsGroup() {
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    const { error } = await createSupabaseBrowserClient().auth.signOut()
    if (error) {
      toast.error(error.message)
      setPending(false)
      return
    }
    window.location.assign("/auth")
  }

  return (
    <SettingsGroup title="Account">
      <SettingsRow
        label="Sign out"
        description={pending ? "Signing out..." : "End your current session on this device"}
        destructive
        onClick={pending ? undefined : signOut}
        action={<LogOut className="size-4 text-destructive/70" />}
      />
    </SettingsGroup>
  )
}
