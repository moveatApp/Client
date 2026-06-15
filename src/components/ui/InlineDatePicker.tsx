import { useMemo } from "react"
import i18n from "@/i18n"

interface InlineDatePickerProps {
   value: string // YYYY-MM-DD
   onChange: (iso: string) => void
   minYear: number
   maxYear: number
   /** YYYY-MM-DD upper bound; future days/months are not offered. */
   maxDate?: string
   isDarkMode?: boolean
}

function pad(n: number): string {
   return String(n).padStart(2, "0")
}

function daysInMonth(year: number, month: number): number {
   return new Date(year, month, 0).getDate()
}

/**
 * Compact, fully styled inline date picker (3 selects) for logging dates.
 * Mirrors DateOfBirthPicker but in a pill layout, and never offers a future
 * date when `maxDate` is provided.
 */
export default function InlineDatePicker({
   value,
   onChange,
   minYear,
   maxYear,
   maxDate,
   isDarkMode,
}: InlineDatePickerProps) {
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

   const selectClass =
      "appearance-none bg-transparent text-sm font-bold text-foreground outline-none cursor-pointer capitalize text-center"

   return (
      <div
         className="flex items-center gap-1.5 bg-muted/50 dark:bg-white-500/5 px-3 py-2 rounded-2xl border border-black/5 shrink-0"
         style={{ colorScheme: isDarkMode ? "dark" : "light" }}>
         <select
            aria-label="Día"
            className={selectClass}
            value={day}
            onChange={(e) => emit(year, month, Number(e.target.value))}>
            {days.map((d) => (
               <option key={d} value={d}>
                  {d}
               </option>
            ))}
         </select>
         <span className="text-gray-400 text-xs">/</span>
         <select
            aria-label="Mes"
            className={selectClass}
            value={month}
            onChange={(e) => emit(year, Number(e.target.value), day)}>
            {months.map((m) => (
               <option key={m} value={m}>
                  {monthNames[m - 1]}
               </option>
            ))}
         </select>
         <span className="text-gray-400 text-xs">/</span>
         <select
            aria-label="Año"
            className={selectClass}
            value={year}
            onChange={(e) => emit(Number(e.target.value), month, day)}>
            {years.map((y) => (
               <option key={y} value={y}>
                  {y}
               </option>
            ))}
         </select>
      </div>
   )
}
