import { useState, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useStore } from "@/store/useStore"
import {
   AreaChart,
   Area,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   ReferenceLine,
} from "recharts"
import { localDateStr } from "@/lib/date"

type Period = "month" | "6m" | "year" | "all"
type Granularity = "day" | "week" | "month"

interface Point {
   t: number // timestamp (ms) — used for a true time-proportional x-axis
   date: string // YYYY-MM-DD of the actual measurement
   weight: number
   deltaPrev: number | null // change vs the previous point in the series
   toward: "good" | "bad" | "neutral" // whether that change moved toward the target
}

function addMonths(d: Date, months: number): Date {
   const copy = new Date(d)
   copy.setMonth(copy.getMonth() + months)
   return copy
}

function dayMs(date: string): number {
   return new Date(`${date}T00:00:00`).getTime()
}

// Coarser buckets for longer ranges → fewer, evenly-read points instead of a
// cramped per-day line. We keep the latest measurement within each bucket.
function granularityFor(period: Period): Granularity {
   if (period === "month") return "day"
   if (period === "6m") return "week"
   return "month"
}

function bucketKey(date: string, gran: Granularity): string {
   if (gran === "day") return date
   if (gran === "month") return date.slice(0, 7) // YYYY-MM
   // week: anchor to the Monday of that week
   const d = new Date(`${date}T00:00:00`)
   const day = (d.getDay() + 6) % 7 // 0 = Monday
   d.setDate(d.getDate() - day)
   return localDateStr(d)
}

type BasePoint = Pick<Point, "t" | "date" | "weight">

function buildSeries(
   history: { date: string; weight: number }[],
   start: Date,
   end: Date,
   gran: Granularity,
): BasePoint[] {
   const startT = start.getTime()
   const endT = end.getTime()
   const buckets = new Map<string, { date: string; weight: number }>()

   for (const entry of history) {
      const t = dayMs(entry.date)
      if (t < startT || t > endT) continue
      const key = bucketKey(entry.date, gran)
      const prev = buckets.get(key)
      // Keep the most recent measurement in the bucket.
      if (!prev || entry.date > prev.date) buckets.set(key, entry)
   }

   return [...buckets.values()]
      .map((e) => ({ t: dayMs(e.date), date: e.date, weight: e.weight }))
      .sort((a, b) => a.t - b.t)
}

// First-of-month timestamps within [start, end] → clean month gridlines/ticks.
function monthTicks(start: Date, end: Date): number[] {
   const ticks: number[] = []
   const curr = new Date(start.getFullYear(), start.getMonth(), 1)
   if (curr.getTime() < start.getTime()) curr.setMonth(curr.getMonth() + 1)
   while (curr.getTime() <= end.getTime()) {
      ticks.push(curr.getTime())
      curr.setMonth(curr.getMonth() + 1)
   }
   return ticks
}

function getPeriodRange(
   period: Period,
   history: { date: string; weight: number }[],
): { start: Date; end: Date } {
   const today = new Date()
   today.setHours(0, 0, 0, 0)

   // Cover the latest log even if it's dated slightly ahead of the browser clock.
   let end = today
   if (history.length > 0) {
      const latestStr = history.reduce((max, e) => (e.date > max ? e.date : max), history[0].date)
      const latest = new Date(`${latestStr}T00:00:00`)
      if (latest.getTime() > end.getTime()) end = latest
   }

   if (period === "month") return { start: addMonths(today, -1), end }
   if (period === "6m") return { start: addMonths(today, -6), end }
   if (period === "year") return { start: addMonths(today, -12), end }

   if (history.length > 0) {
      const earliest = history.reduce((min, e) => (e.date < min ? e.date : min), history[0].date)
      return { start: new Date(`${earliest}T00:00:00`), end }
   }
   return { start: addMonths(today, -1), end }
}

interface WeightChartProps {
   onPointClick?: (date: string, weight: number | null) => void
   targetWeight?: number | null
}

export default function WeightChart({ onPointClick, targetWeight }: WeightChartProps = {}) {
   const { t, i18n } = useTranslation("common")
   const locale = i18n.language
   const { weightHistory } = useStore()
   const [period, setPeriod] = useState<Period>("month")

   const { series, ticks, multiYear } = useMemo(() => {
      const { start, end } = getPeriodRange(period, weightHistory)
      const gran = granularityFor(period)
      const base = buildSeries(weightHistory, start, end, gran)
      // Enrich each point with its change vs the previous measurement.
      const s: Point[] = base.map((p, i) => {
         const prev = i > 0 ? base[i - 1].weight : null
         const deltaPrev = prev === null ? null : Math.round((p.weight - prev) * 10) / 10
         let toward: "good" | "bad" | "neutral" = "neutral"
         if (prev !== null && targetWeight != null) {
            const before = Math.abs(prev - targetWeight)
            const after = Math.abs(p.weight - targetWeight)
            toward = after < before ? "good" : after > before ? "bad" : "neutral"
         }
         return { ...p, deltaPrev, toward }
      })
      return {
         series: s,
         ticks: monthTicks(start, end),
         multiYear: start.getFullYear() !== end.getFullYear(),
      }
   }, [weightHistory, period, targetWeight])

   const latest = series.length > 0 ? series[series.length - 1] : null
   const lastT = latest?.t ?? null

   const yDomain = useMemo<[number, number]>(() => {
      const vals = series.map((d) => d.weight)
      const target = targetWeight ?? null
      if (vals.length === 0) {
         const min = target != null ? Math.min(target, 50) : 50
         const max = target != null ? Math.max(target, 100) : 100
         return [min - 2, max + 2]
      }
      let min = Math.min(...vals)
      let max = Math.max(...vals)
      if (target != null) {
         min = Math.min(min, target)
         max = Math.max(max, target)
      }
      const padding = Math.max((max - min) * 0.2, 1.5)
      return [Math.max(0, min - padding), max + padding]
   }, [series, targetWeight])

   // Split the line color at the target line: below target → green, above → theme.
   const targetOffset =
      targetWeight != null && yDomain[1] > yDomain[0]
         ? Math.min(1, Math.max(0, (yDomain[1] - targetWeight) / (yDomain[1] - yDomain[0])))
         : null
   const strokeColor = targetOffset === null ? "var(--primary)" : "url(#weightSplit)"

   const formatMonth = useCallback(
      (ts: number) => {
         const d = new Date(ts)
         const month = d.toLocaleDateString(locale, { month: "short" }).replace(".", "")
         // Disambiguate years on long/cross-year ranges.
         return (multiYear && d.getMonth() === 0) || d.getTime() === ticks[0]
            ? `${month} '${String(d.getFullYear()).slice(-2)}`
            : month
      },
      [locale, multiYear, ticks],
   )

   const handleDotClick = useCallback(
      (date: string, weight: number | null) => onPointClick?.(date, weight),
      [onPointClick],
   )

   const handleChartClick = useCallback(
      (state: any) => {
         const payload = state?.activePayload?.[0]?.payload as Point | undefined
         if (payload?.date) handleDotClick(payload.date, payload.weight)
      },
      [handleDotClick],
   )

   const hasAnyData = series.length > 0

   return (
      <div className="w-full h-full flex flex-col">
         <div className="flex-1 w-full min-h-[260px]">
            {hasAnyData ? (
               <ResponsiveContainer width="100%" height="100%" className="outline-none">
                  <AreaChart
                     data={series}
                     margin={{ top: 24, right: 12, left: -8, bottom: 4 }}
                     style={{ outline: "none" }}
                     onClick={handleChartClick}>
                     <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                           <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                        {targetOffset !== null && (
                           <linearGradient id="weightSplit" x1="0" y1="0" x2="0" y2="1">
                              <stop offset={0} stopColor="var(--primary)" />
                              <stop offset={targetOffset} stopColor="var(--primary)" />
                              <stop offset={targetOffset} stopColor="#22c55e" />
                              <stop offset={1} stopColor="#22c55e" />
                           </linearGradient>
                        )}
                     </defs>

                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />

                     {targetWeight != null && (
                        <ReferenceLine
                           y={targetWeight}
                           stroke="var(--accent)"
                           strokeDasharray="6 4"
                           strokeWidth={2}
                           label={{
                              value: `${t("chart.target")} ${targetWeight}`,
                              position: "insideTopRight",
                              fill: "var(--accent)",
                              fontSize: 10,
                              fontWeight: 700,
                           }}
                        />
                     )}

                     <XAxis
                        dataKey="t"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        ticks={ticks}
                        tickFormatter={formatMonth}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={24}
                        tick={{ fill: "var(--chart-label)", fontSize: 11, fontWeight: 700 }}
                        tickMargin={8}
                        height={22}
                     />

                     <YAxis
                        domain={yDomain}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--chart-label)", fontSize: 12 }}
                        tickFormatter={(v: number) => `${Math.round(v)}`}
                        width={36}
                     />

                     <Tooltip
                        cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
                        content={(props: any) => {
                           const p = props?.payload?.[0]?.payload as Point | undefined
                           if (!props?.active || !p) return null
                           const dateLabel = new Date(`${p.date}T00:00:00`).toLocaleDateString(locale, {
                              weekday: "short",
                              day: "numeric",
                              month: "long",
                           })
                           const deltaColor =
                              p.toward === "good" ? "#22c55e" : p.toward === "bad" ? "var(--danger)" : "var(--subtle)"
                           return (
                              <div
                                 style={{
                                    borderRadius: 12,
                                    boxShadow: "0 4px 12px -2px rgb(0 0 0 / 0.15)",
                                    backgroundColor: "var(--card-bg)",
                                    color: "var(--foreground)",
                                    padding: "8px 12px",
                                 }}>
                                 <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600 }}>{dateLabel}</div>
                                 <div style={{ fontSize: 15, fontWeight: 700 }}>
                                    {Math.round(p.weight * 10) / 10} kg
                                 </div>
                                 {p.deltaPrev != null && (
                                    <div style={{ fontSize: 12, fontWeight: 700, color: deltaColor, marginTop: 2 }}>
                                       {p.deltaPrev < 0 ? "↓" : p.deltaPrev > 0 ? "↑" : "•"} {p.deltaPrev > 0 ? "+" : ""}
                                       {p.deltaPrev} kg
                                    </div>
                                 )}
                              </div>
                           )
                        }}
                     />

                     <Area
                        type="monotone"
                        dataKey="weight"
                        stroke={strokeColor}
                        strokeWidth={3}
                        fill="url(#colorWeight)"
                        connectNulls
                        isAnimationActive={false}
                        dot={(props: any) => {
                           const { cx, cy, payload } = props
                           if (cx == null || cy == null) return null
                           const isLast = payload.t === lastT
                           return (
                              <g
                                 onClick={(e) => {
                                    e.stopPropagation()
                                    handleDotClick(payload.date, payload.weight)
                                 }}
                                 style={{ cursor: "pointer" }}>
                                 {isLast && (
                                    <circle cx={cx} cy={cy} r={9} fill="var(--primary)" fillOpacity={0.15} />
                                 )}
                                 <circle
                                    cx={cx}
                                    cy={cy}
                                    r={isLast ? 5 : 3.5}
                                    fill="var(--primary)"
                                    strokeWidth={2}
                                    stroke="var(--card-bg)"
                                 />
                              </g>
                           )
                        }}
                        activeDot={(props: any) => {
                           const { cx, cy, payload } = props
                           if (cx == null || cy == null || !payload) return null
                           return (
                              <g
                                 onClick={(e) => {
                                    e.stopPropagation()
                                    handleDotClick(payload.date, payload.weight)
                                 }}
                                 style={{ cursor: "pointer" }}>
                                 <circle cx={cx} cy={cy} r={7} fill="var(--accent)" strokeWidth={2} stroke="var(--card-bg)" />
                              </g>
                           )
                        }}
                     />
                  </AreaChart>
               </ResponsiveContainer>
            ) : (
               <div className="w-full h-full flex items-center justify-center text-subtle text-sm font-medium">
                  {t("chart.no_data")}
               </div>
            )}
         </div>

         <div className="flex max-[415px]:grid max-[415px]:grid-cols-2 mx-auto mt-4 px-3 bg-white/5 rounded-2xl sm:rounded-full py-2 w-full sm:w-auto text-xs font-bold text-subtle gap-2 sm:gap-5 max-[415px]:gap-2">
            {(["month", "6m", "year", "all"] as const).map((p) => (
               <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`w-full sm:w-auto text-nowrap text-center max-[415px]:px-4 max-[415px]:py-2 max-[415px]:text-xs sm:px-6 px-4 py-2 rounded-full transition-colors ${period === p ? "bg-primary text-white" : ""}`}>
                  {t(`chart.period.${p}`)}
               </button>
            ))}
         </div>
      </div>
   )
}
