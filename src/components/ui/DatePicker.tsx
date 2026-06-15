import { useMemo, type ReactNode } from "react"
import { CalendarDays, ChevronDown } from "lucide-react"
import i18n from "@/i18n"

type Variant = "card" | "inline"

interface DatePickerProps {
   /** Current value as YYYY-MM-DD. */
   value: string
   onChange: (iso: string) => void
   minYear: number
   maxYear: number
   /** YYYY-MM-DD upper bound; future days/months are not offered. */
   maxDate?: string
   /** "card" = labeled card with icon (onboarding); "inline" = compact pill. */
   variant?: Variant
   label?: string
   isDarkMode?: boolean
}

function pad(n: number): string {
   return String(n).padStart(2, "0")
}

function daysInMonth(year: number, month: number): number {
   // month is 1-12; day 0 of next month = last day of this month.
   return new Date(year, month, 0).getDate()
}

/**
 * Single styled date picker built from three native <select>s (day/month/year)
 * so it looks consistent across browsers — the native <input type="date">
 * calendar popup cannot be themed. Months are localized via the active i18n
 * language; when `maxDate` is set, future days/months are never offered.
 */
export default function DatePicker({
   value,
   onChange,
   minYear,
   maxYear,
   maxDate,
   variant = "inline",
   label,
   isDarkMode,
}: DatePickerProps) {
   const [year, month, day] = useMemo(() => {
      const parts = value.split("-").map(Number)
      if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
         return parts as [number, number, number]
      }
      return [maxYear, 1, 1] as [number, number, number]
   }, [value, maxYear])

   const [maxY, maxM, maxD] = useMemo(() => {
      if (!maxDate) return [Infinity, 12, 31] as [number, number, number]
      return maxDate.split("-").map(Number) as [number, number, number]
   }, [maxDate])

   const monthNames = useMemo(() => {
      const fmt = new Intl.DateTimeFormat(i18n.language, { month: "long" })
      return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2000, i, 1)))
   }, [])

   const years = useMemo(() => {
      const list: number[] = []
      for (let y = maxYear; y >= minYear; y--) list.push(y)
      return list
   }, [minYear, maxYear])

   const monthsForYear = year === maxY ? maxM : 12
   const months = useMemo(
      () => Array.from({ length: monthsForYear }, (_, i) => i + 1),
      [monthsForYear],
   )

   const baseDays = daysInMonth(year, month)
   const maxDaysForMonth =
      year === maxY && month === maxM ? Math.min(baseDays, maxD) : baseDays
   const days = useMemo(
      () => Array.from({ length: maxDaysForMonth }, (_, i) => i + 1),
      [maxDaysForMonth],
   )

   const emit = (y: number, m: number, d: number) => {
      const monthCount = y === maxY ? maxM : 12
      const cm = Math.min(m, monthCount)
      const dim = daysInMonth(y, cm)
      const maxDay = y === maxY && cm === maxM ? Math.min(dim, maxD) : dim
      const cd = Math.min(d, maxDay)
      onChange(`${y}-${pad(cm)}-${pad(cd)}`)
   }

   const dayOptions = days.map((d) => (
      <option key={d} value={d}>
         {d}
      </option>
   ))
   const monthOptions = months.map((m) => (
      <option key={m} value={m}>
         {monthNames[m - 1]}
      </option>
   ))
   const yearOptions = years.map((y) => (
      <option key={y} value={y}>
         {y}
      </option>
   ))

   if (variant === "card") {
      const selectClass =
         "appearance-none w-full bg-card-bg dark:bg-white-500/5 border border-card-border rounded-xl pl-3 pr-8 py-3 text-sm font-bold text-foreground outline-none cursor-pointer transition-colors hover:border-primary/40 focus:border-primary/60 capitalize"

      const cardSelect = (
         widthClass: string,
         ariaLabel: string,
         current: number,
         onSel: (v: number) => void,
         children: ReactNode,
      ) => (
         <div className={`relative ${widthClass}`}>
            <select
               aria-label={ariaLabel}
               className={selectClass}
               value={current}
               onChange={(e) => onSel(Number(e.target.value))}>
               {children}
            </select>
            <ChevronDown
               size={16}
               className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
         </div>
      )

      return (
         <div
            className="w-full bg-muted dark:bg-white-500/5 border border-card-border rounded-2xl p-4 flex flex-col gap-3"
            style={{ colorScheme: isDarkMode ? "dark" : "light" }}>
            {label && (
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                     <CalendarDays size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                     {label}
                  </span>
               </div>
            )}
            <div className="flex gap-2">
               {cardSelect("w-[28%]", "Día", day, (v) => emit(year, month, v), dayOptions)}
               {cardSelect("flex-1", "Mes", month, (v) => emit(year, v, day), monthOptions)}
               {cardSelect("w-[30%]", "Año", year, (v) => emit(v, month, day), yearOptions)}
            </div>
         </div>
      )
   }

   // inline pill
   const inlineSelectClass =
      "appearance-none bg-transparent text-sm font-bold text-foreground outline-none cursor-pointer capitalize text-center"
   const separator = <span className="text-gray-400 text-xs">/</span>

   return (
      <div
         className="flex items-center gap-1.5 bg-muted/50 dark:bg-white-500/5 px-3 py-2 rounded-2xl border border-black/5 shrink-0"
         style={{ colorScheme: isDarkMode ? "dark" : "light" }}>
         <select
            aria-label="Día"
            className={inlineSelectClass}
            value={day}
            onChange={(e) => emit(year, month, Number(e.target.value))}>
            {dayOptions}
         </select>
         {separator}
         <select
            aria-label="Mes"
            className={inlineSelectClass}
            value={month}
            onChange={(e) => emit(year, Number(e.target.value), day)}>
            {monthOptions}
         </select>
         {separator}
         <select
            aria-label="Año"
            className={inlineSelectClass}
            value={year}
            onChange={(e) => emit(Number(e.target.value), month, day)}>
            {yearOptions}
         </select>
      </div>
   )
}
