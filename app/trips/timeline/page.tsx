import { ScreenHeader } from "@/components/layout/screen-header"
import { TimelineScrubber } from "@/components/trips/timeline-scrubber"

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <ScreenHeader title="Timeline" subtitle="Drag to explore your travels" />
      <TimelineScrubber initialDateParam={date} />
    </div>
  )
}
