"use client"

import { useState } from "react"
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const MIN_YEAR = 1950
const MAX_YEAR = new Date().getFullYear() + 10
const YEARS_PER_PAGE = 12

const monthLong = new Intl.DateTimeFormat("en-US", { month: "long" })
const monthShort = new Intl.DateTimeFormat("en-US", { month: "short" })
const dateShort = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
const dateLong = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })

const MONTHS_LONG = Array.from({ length: 12 }, (_, i) => monthLong.format(new Date(2000, i, 1)))
const MONTHS_SHORT = Array.from({ length: 12 }, (_, i) => monthShort.format(new Date(2000, i, 1)))
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]

const pad = (n: number) => String(n).padStart(2, "0")
const toIso = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`
const monthIndex = (year: number, month: number) => year * 12 + month

function parseIso(value?: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "")
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) }
}

function todayIso() {
  const now = new Date()
  return toIso(now.getFullYear(), now.getMonth(), now.getDate())
}

function formatIso(value: string, long = false) {
  const parsed = parseIso(value)
  if (!parsed) return ""
  const date = new Date(parsed.year, parsed.month, parsed.day)
  return (long ? dateLong : dateShort).format(date)
}

interface DateFieldProps {
  id: string
  title: string
  value: string
  onChange: (value: string) => void
  /** Earliest selectable day (YYYY-MM-DD). Earlier days are disabled. */
  min?: string
  /** Month the calendar opens at when there is no value yet (YYYY-MM-DD). */
  defaultMonth?: string
  placeholder?: string
  invalid?: boolean
}

/**
 * Touch-friendly date field shared by Add Trip and Edit Trip. Tapping it opens
 * a Wayfarer-styled calendar in a bottom sheet instead of the browser's native
 * date popup.
 */
export function DateField({
  id,
  title,
  value,
  onChange,
  min,
  defaultMonth,
  placeholder = "Select date",
  invalid,
}: DateFieldProps) {
  const [open, setOpen] = useState(false)
  const label = value ? formatIso(value) : ""

  const hints = [
    value ? `Selected ${formatIso(value)}` : "Pick a day",
    min ? `On or after ${formatIso(min)}` : null,
  ].filter(Boolean)

  return (
    <>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-input bg-transparent px-3 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          invalid && "border-destructive",
          !label && "text-muted-foreground",
        )}
      >
        <CalendarDays className="size-4 shrink-0 text-accent" aria-hidden />
        <span className="truncate">{label || placeholder}</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[92dvh] overflow-y-auto rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))] wayfarer-scroll"
        >
          <SheetHeader className="px-4 pt-4 pb-0">
            <SheetTitle className="font-serif text-xl">{title}</SheetTitle>
            <SheetDescription>{hints.join(" · ")}</SheetDescription>
          </SheetHeader>
          <CalendarPanel
            value={value}
            min={min}
            defaultMonth={defaultMonth}
            onPick={(next) => {
              onChange(next)
              setOpen(false)
            }}
            onCancel={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}

type Mode = "days" | "months" | "years"

function CalendarPanel({
  value,
  min,
  defaultMonth,
  onPick,
  onCancel,
}: {
  value: string
  min?: string
  defaultMonth?: string
  onPick: (value: string) => void
  onCancel: () => void
}) {
  const lower = min && min > `${MIN_YEAR}-01-01` ? min : `${MIN_YEAR}-01-01`
  const upper = `${MAX_YEAR}-12-31`
  const lowerParts = parseIso(lower)!
  const upperParts = parseIso(upper)!
  const lowerIdx = monthIndex(lowerParts.year, lowerParts.month)
  const upperIdx = monthIndex(upperParts.year, upperParts.month)
  const today = todayIso()

  const clampView = (year: number, month: number) => {
    const idx = Math.min(upperIdx, Math.max(lowerIdx, monthIndex(year, month)))
    return { year: Math.floor(idx / 12), month: idx % 12 }
  }

  // Opens on the current value, otherwise on the supplied default month (the
  // Start Date for the End Date picker), otherwise on today.
  const [view, setView] = useState(() => {
    const seed = parseIso(value) ?? parseIso(defaultMonth) ?? parseIso(today)!
    return clampView(seed.year, seed.month)
  })
  const [mode, setMode] = useState<Mode>("days")
  const [pageStart, setPageStart] = useState(() => MIN_YEAR + Math.floor((view.year - MIN_YEAR) / YEARS_PER_PAGE) * YEARS_PER_PAGE)

  const viewIdx = monthIndex(view.year, view.month)
  const firstWeekday = new Date(view.year, view.month, 1).getDay()
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array<null>(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const nav = {
    days: {
      label: `${MONTHS_LONG[view.month]} ${view.year}`,
      prevDisabled: viewIdx <= lowerIdx,
      nextDisabled: viewIdx >= upperIdx,
      prev: () => setView(clampView(view.year, view.month - 1)),
      next: () => setView(clampView(view.year, view.month + 1)),
      prevLabel: "Previous month",
      nextLabel: "Next month",
    },
    months: {
      label: String(view.year),
      prevDisabled: view.year <= lowerParts.year,
      nextDisabled: view.year >= upperParts.year,
      prev: () => setView(clampView(view.year - 1, view.month)),
      next: () => setView(clampView(view.year + 1, view.month)),
      prevLabel: "Previous year",
      nextLabel: "Next year",
    },
    years: {
      label: `${pageStart} – ${Math.min(MAX_YEAR, pageStart + YEARS_PER_PAGE - 1)}`,
      prevDisabled: pageStart <= Math.max(MIN_YEAR, lowerParts.year - ((lowerParts.year - MIN_YEAR) % YEARS_PER_PAGE)),
      nextDisabled: pageStart + YEARS_PER_PAGE > Math.min(MAX_YEAR, upperParts.year),
      prev: () => setPageStart(pageStart - YEARS_PER_PAGE),
      next: () => setPageStart(pageStart + YEARS_PER_PAGE),
      prevLabel: "Previous years",
      nextLabel: "Next years",
    },
  }[mode]

  function toggleHeader() {
    if (mode === "days") setMode("months")
    else if (mode === "months") {
      setPageStart(MIN_YEAR + Math.floor((view.year - MIN_YEAR) / YEARS_PER_PAGE) * YEARS_PER_PAGE)
      setMode("years")
    } else setMode("days")
  }

  const iconButton =
    "flex size-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors enabled:hover:bg-secondary enabled:active:bg-secondary disabled:opacity-30"

  return (
    <div className="px-4 pb-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" onClick={nav.prev} disabled={nav.prevDisabled} aria-label={nav.prevLabel} className={iconButton}>
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={toggleHeader}
          aria-label={mode === "days" ? "Choose month and year" : "Back"}
          className="flex h-11 items-center gap-1.5 rounded-full px-4 font-serif text-lg transition-colors hover:bg-secondary"
        >
          {nav.label}
          <ChevronDown className={cn("size-4 text-accent transition-transform", mode !== "days" && "rotate-180")} aria-hidden />
        </button>
        <button type="button" onClick={nav.next} disabled={nav.nextDisabled} aria-label={nav.nextLabel} className={iconButton}>
          <ChevronRight className="size-5" />
        </button>
      </div>

      {mode === "days" && (
        <div role="grid" aria-label={`${MONTHS_LONG[view.month]} ${view.year}`}>
          <div className="grid grid-cols-7 pb-1" aria-hidden>
            {WEEKDAYS.map((day, i) => (
              <span key={i} className="py-1 text-center text-xs font-medium text-muted-foreground">
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (day === null) return <span key={`blank-${i}`} />
              const iso = toIso(view.year, view.month, day)
              const disabled = iso < lower || iso > upper
              const selected = iso === value
              const isToday = iso === today
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPick(iso)}
                  aria-label={formatIso(iso, true)}
                  aria-pressed={selected}
                  aria-current={isToday ? "date" : undefined}
                  className="group flex h-11 items-center justify-center outline-none disabled:cursor-not-allowed"
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full text-sm tabular-nums transition-colors group-focus-visible:ring-2 group-focus-visible:ring-ring",
                      selected && "bg-primary font-semibold text-primary-foreground",
                      !selected && isToday && "font-semibold text-accent ring-1 ring-accent",
                      !selected && !disabled && "group-hover:bg-secondary group-active:bg-secondary",
                      disabled && "text-muted-foreground/40",
                    )}
                  >
                    {day}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {mode === "months" && (
        <div className="grid grid-cols-3 gap-2 py-1">
          {MONTHS_SHORT.map((name, month) => {
            const idx = monthIndex(view.year, month)
            const disabled = idx < lowerIdx || idx > upperIdx
            const selected = month === view.month
            return (
              <button
                key={name}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setView({ year: view.year, month })
                  setMode("days")
                }}
                className={cn(
                  "h-12 rounded-xl border text-sm transition-colors disabled:opacity-30",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/30 enabled:hover:bg-secondary",
                )}
              >
                {name}
              </button>
            )
          })}
        </div>
      )}

      {mode === "years" && (
        <div className="grid grid-cols-3 gap-2 py-1">
          {Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStart + i)
            .filter((year) => year <= MAX_YEAR)
            .map((year) => {
              const disabled = year < lowerParts.year || year > upperParts.year
              const selected = year === view.year
              return (
                <button
                  key={year}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setView(clampView(year, view.month))
                    setMode("months")
                  }}
                  className={cn(
                    "h-12 rounded-xl border text-sm tabular-nums transition-colors disabled:opacity-30",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/30 enabled:hover:bg-secondary",
                  )}
                >
                  {year}
                </button>
              )
            })}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="flex-1"
          disabled={today < lower || today > upper}
          onClick={() => onPick(today)}
        >
          Today
        </Button>
      </div>
    </div>
  )
}
