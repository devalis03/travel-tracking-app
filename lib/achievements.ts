import type { LucideIcon } from "lucide-react"
import {
  Footprints,
  Compass,
  Globe2,
  Map as MapIcon,
  Crown,
  Building2,
  Landmark,
  Layers,
  Earth,
  PlaneTakeoff,
  Plane,
  Luggage,
  Camera,
  BookOpen,
  Images,
  Repeat2,
} from "lucide-react"
import { getVisitedCountryCodes, getAllTripsSorted, getGlobalStats, getTripCountryCodes, trips } from "@/lib/data"

/**
 * Centralized achievement catalog. Every achievement's progress is derived
 * live from `lib/data.ts` — nothing here is hardcoded as "complete" — so the
 * collection updates naturally as trips, cities, or memories are added.
 */

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum"

export type AchievementCategory = "exploration" | "cities" | "continents" | "trips" | "memories" | "special"

/** The underlying travel metric an achievement's threshold is measured against. */
type RequirementType = "countries" | "cities" | "continents" | "trips" | "trips-with-photos" | "total-photos" | "return-visit"

export interface AchievementDefinition {
  id: string
  title: string
  description: string
  icon: LucideIcon
  category: AchievementCategory
  tier: AchievementTier
  requirementType: RequirementType
  threshold: number
}

export interface Achievement extends AchievementDefinition {
  progress: number
  unlocked: boolean
}

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  exploration: "Exploration",
  cities: "Cities",
  continents: "Continents",
  trips: "Trips",
  memories: "Memories",
  special: "Special",
}

const CATEGORY_ORDER: AchievementCategory[] = ["exploration", "cities", "continents", "trips", "memories", "special"]

const TIER_RANK: Record<AchievementTier, number> = { bronze: 0, silver: 1, gold: 2, platinum: 3 }

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "first-steps",
    title: "First Steps",
    description: "Visit your first country",
    icon: Footprints,
    category: "exploration",
    tier: "bronze",
    requirementType: "countries",
    threshold: 1,
  },
  {
    id: "explorer",
    title: "Explorer",
    description: "Visit 5 countries",
    icon: Compass,
    category: "exploration",
    tier: "bronze",
    requirementType: "countries",
    threshold: 5,
  },
  {
    id: "world-traveler",
    title: "World Traveler",
    description: "Visit 10 countries",
    icon: Globe2,
    category: "exploration",
    tier: "silver",
    requirementType: "countries",
    threshold: 10,
  },
  {
    id: "seasoned-explorer",
    title: "Seasoned Explorer",
    description: "Visit 20 countries",
    icon: MapIcon,
    category: "exploration",
    tier: "gold",
    requirementType: "countries",
    threshold: 20,
  },
  {
    id: "globetrotter",
    title: "Globetrotter",
    description: "Visit 30 countries",
    icon: Crown,
    category: "exploration",
    tier: "platinum",
    requirementType: "countries",
    threshold: 30,
  },
  {
    id: "city-hopper",
    title: "City Hopper",
    description: "Visit 10 different cities",
    icon: Building2,
    category: "cities",
    tier: "bronze",
    requirementType: "cities",
    threshold: 10,
  },
  {
    id: "urban-explorer",
    title: "Urban Explorer",
    description: "Visit 25 different cities",
    icon: Landmark,
    category: "cities",
    tier: "silver",
    requirementType: "cities",
    threshold: 25,
  },
  {
    id: "continental-explorer",
    title: "Continental Explorer",
    description: "Visit 3 continents",
    icon: Layers,
    category: "continents",
    tier: "bronze",
    requirementType: "continents",
    threshold: 3,
  },
  {
    id: "first-journey",
    title: "First Journey",
    description: "Complete your first trip",
    icon: PlaneTakeoff,
    category: "trips",
    tier: "bronze",
    requirementType: "trips",
    threshold: 1,
  },
  {
    id: "frequent-traveler",
    title: "Frequent Traveler",
    description: "Complete 10 trips",
    icon: Plane,
    category: "trips",
    tier: "silver",
    requirementType: "trips",
    threshold: 10,
  },
  {
    id: "seasoned-traveler",
    title: "Seasoned Traveler",
    description: "Complete 20 trips",
    icon: Luggage,
    category: "trips",
    tier: "gold",
    requirementType: "trips",
    threshold: 20,
  },
  {
    id: "memory-keeper",
    title: "Memory Keeper",
    description: "Add memories to 5 trips",
    icon: Camera,
    category: "memories",
    tier: "bronze",
    requirementType: "trips-with-photos",
    threshold: 5,
  },
  {
    id: "story-collector",
    title: "Story Collector",
    description: "Save 10 travel memories",
    icon: BookOpen,
    category: "memories",
    tier: "silver",
    requirementType: "total-photos",
    threshold: 10,
  },
  {
    id: "memory-collector",
    title: "Memory Collector",
    description: "Save 100 travel memories",
    icon: Images,
    category: "memories",
    tier: "platinum",
    requirementType: "total-photos",
    threshold: 100,
  },
  {
    id: "return-traveler",
    title: "Return Traveler",
    description: "Visit the same country more than once",
    icon: Repeat2,
    category: "special",
    tier: "silver",
    requirementType: "return-visit",
    threshold: 1,
  },
  {
    id: "across-the-world",
    title: "Across the World",
    description: "Visit 5 continents",
    icon: Earth,
    category: "special",
    tier: "platinum",
    requirementType: "continents",
    threshold: 5,
  },
]

function getRawProgress(requirementType: RequirementType): number {
  switch (requirementType) {
    case "countries":
      return getVisitedCountryCodes().length
    case "cities": {
      const uniqueCities = new Set(getAllTripsSorted().flatMap((trip) => trip.cities.map((city) => city.name)))
      return uniqueCities.size
    }
    case "continents":
      return getGlobalStats().continentsVisited
    case "trips":
      return getAllTripsSorted().length
    case "trips-with-photos":
      return getAllTripsSorted().filter((trip) => trip.photos.length > 0).length
    case "total-photos":
      return trips.reduce((sum, trip) => sum + trip.photos.length, 0)
    case "return-visit": {
      const counts = new Map<string, number>()
      for (const t of trips) {
        for (const code of getTripCountryCodes(t)) counts.set(code, (counts.get(code) ?? 0) + 1)
      }
      return [...counts.values()].some((count) => count > 1) ? 1 : 0
    }
    default:
      return 0
  }
}

export function getAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const raw = getRawProgress(definition.requirementType)
    const progress = Math.min(raw, definition.threshold)
    return { ...definition, progress, unlocked: raw >= definition.threshold }
  })
}

export function getAchievementsSummary(): { unlocked: number; total: number } {
  const achievements = getAchievements()
  return { unlocked: achievements.filter((a) => a.unlocked).length, total: achievements.length }
}

export function getAchievementsByCategory(): Array<{ category: AchievementCategory; label: string; achievements: Achievement[] }> {
  const achievements = getAchievements()
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    achievements: achievements.filter((a) => a.category === category),
  })).filter((group) => group.achievements.length > 0)
}

/** A short, high-signal set of unlocked achievements for compact previews (e.g. the Profile screen). */
export function getFeaturedAchievements(limit = 2): Achievement[] {
  return getAchievements()
    .filter((a) => a.unlocked)
    .sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier])
    .slice(0, limit)
}
