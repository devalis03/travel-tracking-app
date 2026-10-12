"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env"

let client: SupabaseClient | undefined

export function createSupabaseBrowserClient() {
  if (client) return client

  client = createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey())
  return client
}
