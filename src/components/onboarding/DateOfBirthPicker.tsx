import { useMemo } from "react"
import { CalendarDays, ChevronDown } from "lucide-react"
import i18n from "@/i18n"

interface DateOfBirthPickerProps {
   /** Current value as YYYY-MM-DD. */
   value: string
   onChange: (iso: string) => void
   minYear: number
   maxYear: number
   label: string
}

function pad(n: number): string {
   return String(n).padStart(2, "0")
}

function daysInMonth(year: number, month: number): number {
   // month is 1-12; day 0 of next month = last day of this month.
   return new Date(year, month, 0).getDate()
}

/**
 * Fully styled date-of-birth picker built from three native <select>s so it
 * looks consistent across browsers (the native <input type="date"> calendar
 * popup cannot be themed). On mobile each select opens the OS wheel.
 */
export default function DateOfBirthPicker({
   value,
   onChange,
   minYear,
   maxYear,
   label,
}: DateOfBirthPickerProps) {
   const [year, month, day] = useMemo(() => {
      const parts = value.split("-").map(Number)
      if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
         return parts as [number, number, number]
      }
      return [maxYear, 1, 1] as [number, number, number]
   }, [value, maxYear])

   const monthNames = useMemo(() => {
      const fmt = new Intl.DateTimeFormat(i18n.language, { month: "long" })
      return Array.from({ length: 12 }, (_, i) =>
         fmt.format(new Date(2000, i, 1)),
      )
   }, [])

   const years = useMemo(() => {
      const list: number[] = []
      for (let y = maxYear; y >= minYear; y--) list.push(y)
      return list
   }, [minYear, maxYear])

   const days = useMemo(
      () =>
         Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1),
      [year, month],
   )

   const emit = (y: number, m: number, d: number) => {
      const clampedDay = Math.min(d, daysInMonth(y, m))
      onChange(`${y}-${pad(m)}-${pad(clampedDay)}`)
   }

   const selectClass =
      "appearance-none w-full bg-card-bg dark:bg-white-500/5 border border-card-border rounded-xl pl-3 pr-8 py-3 text-sm font-bold text-foreground outline-none cursor-pointer transition-colors hover:border-primary/40 focus:border-primary/60 capitalize"

   return (
      <div className="w-full bg-muted dark:bg-white-500/5 border border-card-border rounded-2xl p-4 flex flex-col gap-3">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
               <CalendarDays size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
               {label}
            </span>
         </div>

         <div className="flex gap-2">
            {/* Day */}
            <div className="relative w-[28%]">
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
               <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
               />
            </div>

            {/* Month */}
            <div className="relative flex-1">
               <select
                  aria-label="Mes"
                  className={selectClass}
                  value={month}
                  onChange={(e) => emit(year, Number(e.target.value), day)}>
                  {monthNames.map((name, i) => (
                     <option key={name} value={i + 1}>
                        {name}
                     </option>
                  ))}
               </select>
               <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
               />
            </div>

            {/* Year */}
            <div className="relative w-[30%]">
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
               <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
               />
            </div>
         </div>
      </div>
   )
}
