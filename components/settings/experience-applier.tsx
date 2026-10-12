"use client"

import { useEffect } from "react"
import { useSettingsContext } from "@/components/settings/settings-provider"

const THEME_COLORS = { dark: "#0e1a24", light: "#f7f4ee" } as const

/**
 * Applies the Experience settings to the document: the resolved theme (and
 * its browser/PWA chrome colour) and the Reduce Motion flag. Renders nothing.
 */
export function ExperienceApplier() {
  const { settings } = useSettingsContext()
  const { theme, reduceMotion } = settings

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia("(prefers-color-scheme: dark)")

    const apply = () => {
      const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme
      root.classList.toggle("dark", resolved === "dark")
      root.classList.toggle("light", resolved === "light")
      root.style.colorScheme = resolved
      document
        .querySelectorAll('meta[name="theme-color"]')
        .forEach((meta) => meta.setAttribute("content", THEME_COLORS[resolved]))
    }

    apply()
    if (theme !== "system") return
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduceMotion ? "true" : "false"
  }, [reduceMotion])

  return null
}
