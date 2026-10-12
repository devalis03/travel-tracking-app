import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Achievement } from "@/lib/achievements"

export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const { title, description, icon: Icon, tier, unlocked, progress, threshold } = achievement
  const showProgress = !unlocked && threshold > 1

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl border p-3.5",
        unlocked && tier === "platinum" &&
          "border-primary/45 bg-gradient-to-br from-primary/15 via-card to-card shadow-[0_0_18px_-4px_oklch(0.78_0.14_68/0.5)]",
        unlocked && tier === "gold" && "border-primary/35 bg-primary/[0.08]",
        unlocked && tier === "silver" && "border-accent/35 bg-accent/[0.07]",
        unlocked && tier === "bronze" && "border-border bg-card/60",
        !unlocked && "border-border/70 bg-card/25 opacity-70",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          unlocked && tier === "platinum" && "bg-primary/20 text-primary",
          unlocked && tier === "gold" && "bg-primary/15 text-primary",
          unlocked && tier === "silver" && "bg-accent/15 text-accent",
          unlocked && tier === "bronze" && "bg-secondary text-foreground",
          !unlocked && "bg-secondary/50 text-muted-foreground",
        )}
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </div>

      <div className="min-w-0">
        <p className={cn("line-clamp-2 text-sm font-medium leading-snug", !unlocked && "text-muted-foreground")}>
          {title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{description}</p>
      </div>

      {unlocked ? (
        <div className="mt-auto flex items-center gap-1 text-[11px] font-medium text-accent">
          <Check className="size-3" strokeWidth={2.5} /> Earned
        </div>
      ) : showProgress ? (
        <div className="mt-auto flex flex-col gap-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary/60">
            <div
              className="h-full rounded-full bg-muted-foreground/50"
              style={{ width: `${(progress / threshold) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground">
            {progress} / {threshold}
          </span>
        </div>
      ) : (
        <span className="mt-auto text-[11px] text-muted-foreground">Locked</span>
      )}
    </div>
  )
}
