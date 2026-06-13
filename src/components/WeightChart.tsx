import { useState, useMemo, useCallback } from "react"
import { useStore } from "@/store/useStore"
import {
   AreaChart,
   Area,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   ReferenceArea,
} from "recharts"
import { Save, X, Pencil } from "lucide-react"

type Period = "month" | "6m" | "year" | "all"

function toISODate(d: Date): string {
   return d.toISOString().split("T")[0]
}

function startOfMonth(d: Date): Date {
   return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, months: number): Date {
   const copy = new Date(d)
   copy.setMonth(copy.getMonth() + months)
   return copy
}

interface GridPoint {
   date: string
   index: number
   weight: number | null
   interpolatedWeight: number | null
   day: number
}

function generateDayGrid(
   start: Date,
   end: Date,
   history: { date: string; weight: number }[],
): GridPoint[] {
   const weightMap = new Map(history.map((e) => [e.date, e.weight]))
   const grid: GridPoint[] = []
   const curr = new Date(start)

   while (curr <= end) {
      const dateStr = toISODate(curr)
      const weight = weightMap.get(dateStr) ?? null
      grid.push({
         date: dateStr,
         index: grid.length,
         weight,
         interpolatedWeight: weight,
         day: curr.getDate(),
      })
      curr.setDate(curr.getDate() + 1)
   }

   // Interpolate between real data points for smooth area fill
   let lastRealIdx = -1
   for (let i = 0; i < grid.length; i++) {
      if (grid[i].weight !== null) {
         if (lastRealIdx !== -1 && lastRealIdx < i - 1) {
            const w1 = grid[lastRealIdx].weight!
            const w2 = grid[i].weight!
            const steps = i - lastRealIdx
            for (let j = 1; j < steps; j++) {
               grid[lastRealIdx + j].interpolatedWeight =
                  w1 + (w2 - w1) * (j / steps)
            }
         }
         lastRealIdx = i
      }
   }

   return grid
}

interface MonthSpan {
   label: string
   startIndex: number
   endIndex: number
   colorIndex: number
}

function getMonthSpans(grid: GridPoint[]): MonthSpan[] {
   const spans: MonthSpan[] = []
   let currentMonth = -1
   let startIndex = 0
   let colorIndex = 0

   grid.forEach((day, i) => {
      const d = new Date(day.date)
      const month = d.getMonth()
      if (month !== currentMonth) {
         if (currentMonth !== -1) {
            spans.push({
               label: new Date(grid[startIndex].date)
                  .toLocaleDateString("es-ES", { month: "short" })
                  .replace(".", "")
                  .toUpperCase(),
               startIndex,
               endIndex: i - 1,
               colorIndex,
            })
         }
         currentMonth = month
         startIndex = i
         colorIndex = (colorIndex + 1) % 2
      }
   })

   if (grid.length > 0) {
      spans.push({
         label: new Date(grid[startIndex].date)
            .toLocaleDateString("es-ES", { month: "short" })
            .replace(".", "")
            .toUpperCase(),
         startIndex,
         endIndex: grid.length - 1,
         colorIndex,
      })
   }

   return spans
}

function getPeriodRange(
   period: Period,
   history: { date: string; weight: number }[],
): { start: Date; end: Date } {
   const today = new Date()
   today.setHours(0, 0, 0, 0)

   if (period === "month") {
      return { start: startOfMonth(today), end: today }
   }

   if (period === "6m") {
      return { start: addMonths(today, -6), end: today }
   }

   if (period === "year") {
      return { start: new Date(today.getFullYear(), 0, 1), end: today }
   }

   if (history.length > 0) {
      const sorted = [...history].sort(
         (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )
      return { start: new Date(sorted[0].date), end: today }
   }

   return { start: addMonths(today, -1), end: today }
}

interface WeightChartProps {
   onPointClick?: (date: string, weight: number | null) => void
}

export default function WeightChart({ onPointClick }: WeightChartProps = {}) {
   const { weightHistory, addWeightEntry } = useStore()
   const [period, setPeriod] = useState<Period>("month")
   const [selectedPoint, setSelectedPoint] = useState<{
      date: string
      weight: number | null
   } | null>(null)
   const [editWeight, setEditWeight] = useState("")

   const { grid, spans, hasAnyData } = useMemo(() => {
      const { start, end } = getPeriodRange(period, weightHistory)
      const g = generateDayGrid(start, end, weightHistory)
      const s = getMonthSpans(g)
      const hasData = g.some((d) => d.weight !== null)
      return { grid: g, spans: s, hasAnyData: hasData }
   }, [weightHistory, period])

   const yDomain = useMemo<[number, number]>(() => {
      const vals = grid.map((d) => d.weight).filter((w): w is number => w !== null)
      if (vals.length === 0) return [50, 100]
      const min = Math.min(...vals)
      const max = Math.max(...vals)
      const padding = Math.max((max - min) * 0.15, 1)
      return [Math.max(0, min - padding), max + padding]
   }, [grid])

   const handleDotClick = useCallback((date: string, weight: number | null) => {
      if (onPointClick) {
         onPointClick(date, weight)
         return
      }
      setSelectedPoint({ date, weight })
      setEditWeight(weight !== null ? String(weight) : "")
   }, [onPointClick])

   const handleChartClick = useCallback(
      (state: any) => {
         if (!state || !grid.length) return

         let index: number | null = null

         // Prefer the active tooltip index (hover nearest day)
         if (typeof state.activeTooltipIndex === "number") {
            index = state.activeTooltipIndex
         } else if (
            state.activePayload &&
            state.activePayload[0] &&
            state.activePayload[0].payload
         ) {
            const payload = state.activePayload[0].payload as GridPoint
            if (payload && payload.date) {
               handleDotClick(payload.date, payload.weight)
               return
            }
         }

         // Fallback: calculate from click position
         if (
            index === null &&
            typeof state.chartX === "number" &&
            typeof state.containerWidth === "number"
         ) {
            const marginLeft = -10
            const marginRight = 10
            const innerWidth = state.containerWidth - marginLeft - marginRight
            const relativeX = state.chartX - marginLeft
            const ratio = Math.max(0, Math.min(1, relativeX / innerWidth))
            index = Math.round(ratio * (grid.length - 1))
         }

         if (index !== null && index >= 0 && index < grid.length) {
            const day = grid[index]
            if (day) {
               handleDotClick(day.date, day.weight)
            }
         }
      },
      [handleDotClick, grid],
   )

   const handleSave = useCallback(() => {
      if (!selectedPoint) return
      const parsed = parseFloat(editWeight)
      if (!isNaN(parsed) && parsed > 0) {
         addWeightEntry(parsed, selectedPoint.date)
      }
      setSelectedPoint(null)
      setEditWeight("")
   }, [selectedPoint, editWeight, addWeightEntry])

   const formattedSelectedDate = selectedPoint
      ? new Date(selectedPoint.date).toLocaleDateString("es-ES", {
           weekday: "long",
           day: "numeric",
           month: "long",
        })
      : ""

   const isEditing = selectedPoint?.weight !== null

   return (
      <div className="w-full h-full flex flex-col">
         <div className="flex-1 w-full min-h-[260px]">
            {hasAnyData ? (
               <ResponsiveContainer
                  width="100%"
                  height="100%"
                  className="outline-none">
                  <AreaChart
                     data={grid}
                     margin={{ top: 24, right: 10, left: -10, bottom: 0 }}
                     style={{ outline: "none" }}
                     onClick={handleChartClick}>
                     <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                           <stop
                              offset="5%"
                              stopColor="var(--primary)"
                              stopOpacity={0.3}
                           />
                           <stop
                              offset="95%"
                              stopColor="var(--primary)"
                              stopOpacity={0}
                           />
                        </linearGradient>
                     </defs>

                     {/* Month bands */}
                     {spans.map((span) => (
                        <ReferenceArea
                           key={`${span.label}-${span.startIndex}`}
                           x1={span.startIndex}
                           x2={span.endIndex}
                           stroke={
                              span.colorIndex === 0
                                 ? "var(--primary)"
                                 : "var(--card-border)"
                           }
                           strokeOpacity={0.12}
                           fill={
                              span.colorIndex === 0
                                 ? "var(--primary)"
                                 : "transparent"
                           }
                           fillOpacity={span.colorIndex === 0 ? 0.04 : 0}
                           ifOverflow="extendDomain"
                           label={{
                              value: span.label,
                              position: "insideTop",
                              fill: "var(--foreground)",
                              fontSize: 10,
                              fontWeight: 700,
                              opacity: 0.45,
                           }}
                        />
                     ))}

                     <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--chart-grid)"
                     />

                     <XAxis
                        dataKey="index"
                        type="number"
                        domain={[0, grid.length - 1]}
                        axisLine={false}
                        tickLine={false}
                        tick={false}
                        height={0}
                     />

                     <YAxis
                        domain={yDomain}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--chart-label)", fontSize: 12 }}
                        tickFormatter={(v: number) => `${Math.round(v * 10) / 10}`}
                        width={45}
                     />

                     <Tooltip
                        cursor={{
                           stroke: "var(--primary)",
                           strokeWidth: 1,
                           strokeDasharray: "4 4",
                        }}
                        contentStyle={{
                           borderRadius: "12px",
                           border: "none",
                           boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                           backgroundColor: "var(--card-bg)",
                           color: "var(--foreground)",
                        }}
                        itemStyle={{
                           color: "var(--foreground)",
                           fontWeight: 700,
                        }}
                        labelFormatter={(_, payload) => {
                           if (!payload || !payload[0]) return ""
                           const dateStr = payload[0].payload.date as string
                           const d = new Date(dateStr)
                           return d.toLocaleDateString("es-ES", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                           })
                        }}
                        formatter={(value) => [
                           `${Math.round(Number(value) * 10) / 10} kg`,
                           "Peso",
                        ]}
                     />

                     <Area
                        type="monotone"
                        dataKey="interpolatedWeight"
                        stroke="var(--primary)"
                        strokeWidth={3}
                        fill="url(#colorWeight)"
                        connectNulls={false}
                        isAnimationActive={false}
                        dot={(props: any) => {
                           const { cx, cy, payload } = props
                           if (
                              payload.weight === null ||
                              payload.weight === undefined ||
                              cx == null ||
                              cy == null
                           )
                              return null
                           return (
                              <g
                                 onClick={(e) => {
                                    e.stopPropagation()
                                    handleDotClick(payload.date, payload.weight)
                                 }}
                                 style={{ cursor: "pointer" }}>
                                 <circle
                                    cx={cx}
                                    cy={cy}
                                    r={4}
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
                                 <circle
                                    cx={cx}
                                    cy={cy}
                                    r={6}
                                    fill="var(--accent)"
                                    strokeWidth={2}
                                    stroke="var(--card-bg)"
                                 />
                              </g>
                           )
                        }}
                     />
                  </AreaChart>
               </ResponsiveContainer>
            ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                  Sin datos de peso en este período
               </div>
            )}
         </div>

          {/* Inline weight editor */}
          {!onPointClick && selectedPoint && (
            <div className="mt-3 bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between animate-fade-in">
               <div className="flex items-center gap-3">
                  <Pencil size={16} className="text-primary" />
                  <div>
                     <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        {isEditing ? "Editar peso" : "Registrar peso"} ·{" "}
                        {formattedSelectedDate}
                     </p>
                     <div className="flex items-center gap-2 mt-1">
                        <input
                           type="number"
                           step="0.1"
                           aria-label="Peso en kg"
                           className="w-20 bg-transparent border-b-2 border-primary text-lg font-bold text-foreground outline-none"
                           value={editWeight}
                           onChange={(e) => setEditWeight(e.target.value)}
                           onKeyDown={(e) => e.key === "Enter" && handleSave()}
                           placeholder="--"
                        />
                        <span className="text-sm text-gray-400 font-medium">kg</span>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button
                     onClick={handleSave}
                     className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
                     <Save size={16} />
                  </button>
                  <button
                     onClick={() => {
                        setSelectedPoint(null)
                        setEditWeight("")
                     }}
                     className="p-2 bg-white-500/5 text-gray-400 rounded-xl hover:text-foreground transition-colors">
                     <X size={16} />
                  </button>
               </div>
            </div>
         )}

         <div className="flex max-[415px]:grid max-[415px]:grid-cols-2 mx-auto mt-4 px-3 bg-white-500/5 rounded-2xl sm:rounded-full py-2 w-full sm:w-auto text-xs font-bold text-gray-500 gap-2 sm:gap-5 max-[415px]:gap-1.5">
            <button
               onClick={() => {
                  setPeriod("month")
                  setSelectedPoint(null)
               }}
               className={`w-full sm:w-auto text-nowrap text-center max-[415px]:px-3 max-[415px]:py-1.5 max-[415px]:text-[10px] sm:px-6 px-4 py-2 rounded-full transition-colors ${period === "month" ? "bg-primary text-white" : ""}`}>
               Este mes
            </button>
            <button
               onClick={() => {
                  setPeriod("6m")
                  setSelectedPoint(null)
               }}
               className={`w-full sm:w-auto text-nowrap text-center max-[415px]:px-3 max-[415px]:py-1.5 max-[415px]:text-[10px] sm:px-6 px-4 py-2 rounded-full transition-colors ${period === "6m" ? "bg-primary text-white" : ""}`}>
               6 Meses
            </button>
            <button
               onClick={() => {
                  setPeriod("year")
                  setSelectedPoint(null)
               }}
               className={`w-full sm:w-auto text-nowrap text-center max-[415px]:px-3 max-[415px]:py-1.5 max-[415px]:text-[10px] sm:px-6 px-4 py-2 rounded-full transition-colors ${period === "year" ? "bg-primary text-white" : ""}`}>
               Este año
            </button>
            <button
               onClick={() => {
                  setPeriod("all")
                  setSelectedPoint(null)
               }}
               className={`w-full sm:w-auto text-nowrap text-center max-[415px]:px-3 max-[415px]:py-1.5 max-[415px]:text-[10px] sm:px-6 px-4 py-2 rounded-full transition-colors ${period === "all" ? "bg-primary text-white" : ""}`}>
               Todo
            </button>
         </div>
      </div>
   )
}
