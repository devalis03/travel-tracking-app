"use client"

import type { ReactNode } from "react"
import { ScreenHeader } from "@/components/layout/screen-header"
import { ChallengeRow } from "@/components/challenges/challenge-row"
import { useChallengesContext } from "@/components/challenges/challenges-provider"
import { getChallenges } from "@/lib/challenges"

export default function ChallengesPage() {
  const { activatedIds, activate } = useChallengesContext()
  const challenges = getChallenges(activatedIds)
  const active = challenges.filter((c) => c.status === "active")
  const available = challenges.filter((c) => c.status === "available")
  const completed = challenges.filter((c) => c.status === "completed")

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <ScreenHeader title="Challenges" subtitle="Personal travel goals" showBack backHref="/profile" />

      <div className="flex flex-col gap-6 px-4 pb-10 pt-4">
        {active.length > 0 && (
          <Section title="Active">
            {active.map((challenge) => (
              <ChallengeRow key={challenge.id} challenge={challenge} />
            ))}
          </Section>
        )}

        <Section title="Available">
          {available.length > 0 ? (
            available.map((challenge) => <ChallengeRow key={challenge.id} challenge={challenge} onStart={activate} />)
          ) : (
            <p className="px-1 text-sm text-muted-foreground">No challenges available right now — check back after your next trip.</p>
          )}
        </Section>

        {completed.length > 0 && (
          <Section title="Completed">
            {completed.map((challenge) => (
              <ChallengeRow key={challenge.id} challenge={challenge} compact />
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 font-serif text-lg">{title}</h2>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  )
}
