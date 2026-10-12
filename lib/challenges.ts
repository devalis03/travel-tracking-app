import type { LucideIcon } from "lucide-react"
import { Flag, Building2, Globe, Plane, Camera, Heart } from "lucide-react"
import { trips, getCountryMeta, getTripCountryCodes } from "@/lib/data"

/**
 * Challenges are forward-looking personal travel goals, distinct from
 * Achievements (which recognize what has already been completed). Progress
 * is derived from the shared trip data whenever possible — "new" means the
 * first-ever occurrence of that country / city / continent falls inside a
 * rolling 12-month window, so the numbers move naturally as new trips are
 * logged over time.
 */

export type ChallengeStatus = "available" | "active" | "completed"

export interface ChallengeDefinition {
  id: string
  title: string
  description: string
  icon: LucideIcon
  target: number
}

export interface Challenge extends ChallengeDefinition {
  progress: number
  status: ChallengeStatus
}

const WINDOW_DAYS = 365
const MS_PER_DAY = 86_400_000

function getWindowCutoff(): number {
  return Date.now() - WINDOW_DAYS * MS_PER_DAY
}

/** For each key, keeps only the earliest date it appeared at, then returns those dates. */
function earliestDates<T>(entries: Array<{ date: number; key: T }>): number[] {
  const firstSeen = new Map<T, number>()
  for (const { date, key } of entries) {
    const existing = firstSeen.get(key)
    if (existing === undefined || date < existing) firstSeen.set(key, date)
  }
  return [...firstSeen.values()]
}

function countNewWithinWindow<T>(entries: Array<{ date: number; key: T }>): number {
  const cutoff = getWindowCutoff()
  return earliestDates(entries).filter((date) => date >= cutoff).length
}

function getNewCountriesInWindow(): number {
  const entries: Array<{ date: number; key: string }> = []
  for (const t of trips) {
    const date = new Date(t.startDate).getTime()
    for (const code of getTripCountryCodes(t)) entries.push({ date, key: code })
  }
  return countNewWithinWindow(entries)
}

function getNewCitiesInWindow(): number {
  const entries: Array<{ date: number; key: string }> = []
  for (const t of trips) {
    const date = new Date(t.startDate).getTime()
    for (const city of t.cities) entries.push({ date, key: city.name })
  }
  return countNewWithinWindow(entries)
}

function getNewContinentsInWindow(): number {
  const entries: Array<{ date: number; key: string }> = []
  for (const t of trips) {
    const date = new Date(t.startDate).getTime()
    for (const code of getTripCountryCodes(t)) {
      const continent = getCountryMeta(code)?.continent
      if (continent) entries.push({ date, key: continent })
    }
  }
  return countNewWithinWindow(entries)
}

function getTripsInWindow(): number {
  const cutoff = getWindowCutoff()
  return trips.filter((t) => new Date(t.startDate).getTime() >= cutoff).length
}

function getTripsWithMemoriesInWindow(): number {
  const cutoff = getWindowCutoff()
  return trips.filter((t) => new Date(t.startDate).getTime() >= cutoff && t.photos.length > 0).length
}

function hasReturnedToAFavorite(): boolean {
  const counts = new Map<string, number>()
  for (const t of trips) {
    for (const code of getTripCountryCodes(t)) counts.set(code, (counts.get(code) ?? 0) + 1)
  }
  return [...counts.values()].some((count) => count > 1)
}

const CHALLENGE_DEFINITIONS: Array<ChallengeDefinition & { getProgress: () => number }> = [
  {
    id: "new-countries-3",
    title: "Visit 3 new countries",
    description: "Set foot in three countries you haven't been to before.",
    icon: Flag,
    target: 3,
    getProgress: getNewCountriesInWindow,
  },
  {
    id: "new-cities-5",
    title: "Visit 5 new cities",
    description: "Explore five cities that are new to you.",
    icon: Building2,
    target: 5,
    getProgress: getNewCitiesInWindow,
  },
  {
    id: "new-continent-1",
    title: "Visit a new continent",
    description: "Add a continent you haven't explored yet.",
    icon: Globe,
    target: 1,
    getProgress: getNewContinentsInWindow,
  },
  {
    id: "more-trips-5",
    title: "Complete 5 more trips",
    description: "Log five more trips to keep the momentum going.",
    icon: Plane,
    target: 5,
    getProgress: getTripsInWindow,
  },
  {
    id: "memories-3",
    title: "Add memories to your next 3 trips",
    description: "Save photos and notes for three upcoming trips.",
    icon: Camera,
    target: 3,
    getProgress: getTripsWithMemoriesInWindow,
  },
  {
    id: "return-favorite",
    title: "Return to a favorite destination",
    description: "Go back to somewhere you've already fallen in love with.",
    icon: Heart,
    target: 1,
    getProgress: () => (hasReturnedToAFavorite() ? 1 : 0),
  },
]

/** Resolves every challenge's live progress and status given the set of user-activated challenge ids. */
export function getChallenges(activatedIds: Set<string>): Challenge[] {
  return CHALLENGE_DEFINITIONS.map((def) => {
    const rawProgress = def.getProgress()
    const progress = Math.min(rawProgress, def.target)
    const status: ChallengeStatus = progress >= def.target ? "completed" : activatedIds.has(def.id) ? "active" : "available"
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      target: def.target,
      progress,
      status,
    }
  })
}
