import { getRecapYears } from "@/lib/recap"
import { RecapYearView } from "@/components/recap/recap-year-view"

export default async function RecapYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  return <RecapYearView year={Number(year)} />
}

export function generateStaticParams() {
  return getRecapYears().map((year) => ({ year: String(year) }))
}
