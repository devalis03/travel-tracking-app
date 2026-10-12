"use client"

import { useEffect } from "react"

/**
 * Keeps a `--app-height` CSS custom property in sync with the *stable*
 * viewport height on mobile.
 *
 * Why this exists: relying on `100dvh` alone caused the bottom navigation to
 * render squashed into a collapsed sliver immediately after a mobile
 * reload / pull-to-refresh, only "popping" back to full size on the next tap.
 * That happens because `dvh` reflects the *live* viewport, and right after a
 * reload the browser chrome (address bar, pull-to-refresh indicator) is
 * still animating in/out — the very first layout pass can be computed
 * against a transient, too-short viewport before the browser settles. A
 * later user interaction forces a reflow against the now-correct viewport,
 * which is why tapping "fixes" it.
 *
 * Fixing this means not trusting the very first `dvh` value: measure
 * `window.visualViewport` (falls back to `window.innerHeight`) after mount,
 * and again on `resize`/`orientationchange`/`visualViewport.resize`, so the
 * app shell settles to the correct height without needing user interaction.
 */
export function useAppViewportHeight() {
  useEffect(() => {
    const root = document.documentElement

    const setHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight
      root.style.setProperty("--app-height", `${height}px`)
    }

    // Run once immediately, then again after the browser chrome (address
    // bar, pull-to-refresh indicator) has had a chance to finish settling.
    setHeight()
    const settleTimeout = window.setTimeout(setHeight, 150)

    window.addEventListener("resize", setHeight)
    window.addEventListener("orientationchange", setHeight)
    window.visualViewport?.addEventListener("resize", setHeight)

    return () => {
      window.clearTimeout(settleTimeout)
      window.removeEventListener("resize", setHeight)
      window.removeEventListener("orientationchange", setHeight)
      window.visualViewport?.removeEventListener("resize", setHeight)
    }
  }, [])
}
