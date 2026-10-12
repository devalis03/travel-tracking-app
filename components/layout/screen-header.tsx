import type { ReactNode } from "react"
import { BackButton } from "@/components/layout/back-button"

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  fallbackHref,
  backHref,
  action,
}: {
  title: string
  subtitle?: string
  showBack?: boolean
  fallbackHref?: string
  backHref?: string
  action?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3.5 backdrop-blur-md">
      {showBack && <BackButton fallbackHref={fallbackHref} href={backHref} />}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-serif text-xl leading-tight">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
