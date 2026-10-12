import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function SettingsRow({
  label,
  description,
  action,
  onClick,
  destructive = false,
  wrapDescription = false,
}: {
  label: string
  description?: string
  /** Let a long description wrap onto several lines instead of truncating. */
  wrapDescription?: boolean
  action?: ReactNode
  onClick?: () => void
  destructive?: boolean
}) {
  const Comp = onClick ? "button" : "div"

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 border-b border-border/60 px-4 py-3.5 text-left last:border-b-0",
        onClick && "transition-colors active:bg-secondary/40",
        destructive && "text-destructive",
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className={cn("mt-0.5 text-[11px] leading-snug text-muted-foreground", wrapDescription ? "text-pretty" : "line-clamp-1")}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Comp>
  )
}
