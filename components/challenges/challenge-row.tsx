import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Challenge } from "@/lib/challenges"

export function ChallengeRow({
  challenge,
  onStart,
  compact = false,
}: {
  challenge: Challenge
  onStart?: (id: string) => void
  compact?: boolean
}) {
  const { id, title, description, icon: Icon, target, progress, status } = challenge

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-3.5">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          status === "completed" && "bg-accent/15 text-accent",
          status === "active" && "bg-primary/15 text-primary",
          status === "available" && "bg-secondary text-muted-foreground",
        )}
      >
        {status === "completed" ? <Check className="size-4" strokeWidth={2.5} /> : <Icon className="size-4" strokeWidth={1.75} />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{title}</p>
        {!compact && <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{description}</p>}

        {status === "completed" ? (
          <p className="mt-0.5 text-[11px] font-medium text-accent">Completed</p>
        ) : (
          target > 1 && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary/60">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${(progress / target) * 100}%` }}
                />
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {progress} / {target}
              </span>
            </div>
          )
        )}
      </div>

      {status === "available" && onStart && (
        <Button size="sm" variant="outline" className="shrink-0 rounded-full" onClick={() => onStart(id)}>
          Start
        </Button>
      )}
      {status === "active" && (
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">Active</span>
      )}
    </div>
  )
}
