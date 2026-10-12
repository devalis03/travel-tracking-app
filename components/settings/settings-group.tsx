import type { ReactNode } from "react"

export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-card/50">{children}</div>
    </section>
  )
}
