"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { ChallengeRow } from "@/components/challenges/challenge-row"
import { useChallengesContext } from "@/components/challenges/challenges-provider"
import { getChallenges } from "@/lib/challenges"

export function ChallengesPreview() {
  const { activatedIds } = useChallengesContext()
  const active = getChallenges(activatedIds).filter((c) => c.status === "active")

  return (
    <section className="mt-8 w-full">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-serif text-lg">Challenges</h2>
        <Link href="/challenges" className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-accent">
          View all
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
      {active.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {active.map((challenge) => (
            <ChallengeRow key={challenge.id} challenge={challenge} compact />
          ))}
        </div>
      ) : (
        <Link
          href="/challenges"
          className="flex items-center justify-between rounded-2xl border border-dashed border-border/70 bg-card/25 p-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Set a personal travel goal
          <ChevronRight className="size-4" />
        </Link>
      )}
    </section>
  )
}
