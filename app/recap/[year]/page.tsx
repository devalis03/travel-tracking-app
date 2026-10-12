import { getRecapYears } from "@/lib/recap"
import { RecapYearView } from "@/components/recap/recap-year-view"

export const dynamicParams = true

export default async function RecapYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  const parsedYear = Number(year)
  if (!Number.isInteger(parsedYear) || parsedYear < 1) {
    return <RecapYearView year={Number.NaN} />
  }
  return <RecapYearView year={parsedYear} />
}

export function generateStaticParams() {
  return getRecapYears().map((year) => ({ year: String(year) }))
}
