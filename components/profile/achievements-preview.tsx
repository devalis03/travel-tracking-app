import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getFeaturedAchievements, getAchievementsSummary } from "@/lib/achievements"
import { AchievementBadge } from "@/components/profile/achievement-badge"

export function AchievementsPreview() {
  const featured = getFeaturedAchievements(2)
  const summary = getAchievementsSummary()

  return (
    <section className="mt-8 w-full">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="font-serif text-lg">Achievements</h2>
          <p className="text-xs text-muted-foreground">
            {summary.unlocked} of {summary.total} unlocked
          </p>
        </div>
        <Link href="/achievements" className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-accent">
          View all
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
      {featured.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {featured.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </div>
      ) : (
        <Link
          href="/achievements"
          className="flex items-center justify-between rounded-2xl border border-dashed border-border/70 bg-card/25 p-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Keep traveling to earn your first badge
          <ChevronRight className="size-4" />
        </Link>
      )}
    </section>
  )
}
