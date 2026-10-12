/**
 * Single source of truth for globe country colors, shared between the globe
 * itself (`world-globe.tsx`) and the legend (`map-legend.tsx`) so the two
 * never drift out of sync.
 *
 * Visited countries keep a strong fill. Unvisited statuses (next trip,
 * interested, not interested) intentionally keep the base terrain fill and
 * differentiate purely through the border so a full country fill stays
 * reserved for "visited".
 */
export const MAP_COLORS = {
  visitedFill: "oklch(0.62 0.09 195)",
  visitedFillHover: "oklch(0.7 0.1 190)",
  visitedStroke: "oklch(0.78 0.1 190)",

  baseFill: "oklch(0.32 0.02 220)",
  baseFillHover: "oklch(0.36 0.02 220)",
  /**
   * Brightened relative to `baseFill` so every country's boundary reads
   * clearly against the globe's terrain at default zoom, without competing
   * with the stronger status borders (next trip / interested / not
   * interested) or the solid "visited" fill.
   */
  baseStroke: "oklch(0.56 0.025 220)",

  /** Amber — matches the app's primary accent for "next trip" urgency. */
  nextTripStroke: "oklch(0.8 0.15 68)",
  nextTripGlow: "oklch(0.8 0.15 68 / 0.65)",

  /** Cool sky blue — clearly distinct from amber and teal. */
  interestedStroke: "oklch(0.75 0.12 235)",

  /**
   * Vivid coral-red — the brightest, thickest border of any status so "not
   * interested" reads clearly at a glance at default zoom, never mistaken
   * for a low-contrast disabled state.
   */
  notInterestedStroke: "oklch(0.68 0.2 25)",
  notInterestedGlow: "oklch(0.68 0.2 25 / 0.55)",
} as const
