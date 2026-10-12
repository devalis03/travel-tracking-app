"use client"

import { ScreenHeader } from "@/components/layout/screen-header"
import { AchievementBadge } from "@/components/profile/achievement-badge"
import { getAchievementsByCategory, getAchievementsSummary } from "@/lib/achievements"

export default function AchievementsPage() {
  const grouped = getAchievementsByCategory()
  const summary = getAchievementsSummary()

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <ScreenHeader title="Achievements" subtitle={`${summary.unlocked} of ${summary.total} unlocked`} showBack backHref="/profile" />

      <div className="flex flex-col gap-7 px-4 pb-10 pt-4">
        {grouped.map(({ category, label, achievements }) => (
          <section key={category}>
            <h2 className="mb-2.5 font-serif text-lg">{label}</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {achievements.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
