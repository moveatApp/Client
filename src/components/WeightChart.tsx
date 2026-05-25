import { useState } from "react"
import {
   AreaChart,
   Area,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
} from "recharts"

const dataSets = {
   "1d": [
      { label: "00:00", weight: 68.4 },
      { label: "06:00", weight: 68.3 },
      { label: "12:00", weight: 68.5 },
      { label: "18:00", weight: 68.2 },
      { label: "23:59", weight: 68.4 },
   ],
   "1w": [
      { label: "Lun", weight: 69.5 },
      { label: "Mar", weight: 69.2 },
      { label: "Mié", weight: 68.8 },
      { label: "Jue", weight: 69.1 },
      { label: "Vie", weight: 68.5 },
      { label: "Sáb", weight: 68.1 },
      { label: "Dom", weight: 68.0 },
   ],
   "1m": [
      { label: "Sem 1", weight: 70.1 },
      { label: "Sem 2", weight: 69.5 },
      { label: "Sem 3", weight: 68.8 },
      { label: "Sem 4", weight: 68.4 },
   ],
   "1y": [
      { label: "Ene", weight: 75.0 },
      { label: "Abr", weight: 72.5 },
      { label: "Jul", weight: 70.2 },
      { label: "Oct", weight: 68.9 },
      { label: "Dic", weight: 68.4 },
   ],
}

export default function WeightChart() {
   const [period, setPeriod] = useState<keyof typeof dataSets>("1w")
   const data = dataSets[period]

   return (
      <div className="w-full h-full flex flex-col">
         <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" className="outline-none">
               <AreaChart
                  data={data}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  style={{ outline: "none" }}>
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
                  <CartesianGrid
                     strokeDasharray="3 3"
                     vertical={false}
                     stroke="var(--chart-grid)"
                  />
                  <XAxis
                     dataKey="label"
                     axisLine={false}
                     tickLine={false}
                     tick={{ fill: "var(--chart-label)", fontSize: 12 }}
                     dy={10}
                  />
                  <YAxis
                     domain={["dataMin - 1", "dataMax + 1"]}
                     axisLine={false}
                     tickLine={false}
                     tick={{ fill: "var(--chart-label)", fontSize: 12 }}
                  />
                  <Tooltip
                     contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        backgroundColor: "var(--card-bg)",
                        color: "var(--foreground)",
                     }}
                     itemStyle={{ color: "var(--foreground)" }}
                  />
                  <Area
                     type="monotone"
                     dataKey="weight"
                     stroke="var(--primary)"
                     strokeWidth={3}
                     fillOpacity={1}
                     fill="url(#colorWeight)"
                     dot={{
                        r: 4,
                        fill: "var(--primary)",
                        strokeWidth: 2,
                        stroke: "var(--card-bg)",
                     }}
                     activeDot={{
                        r: 6,
                        fill: "var(--accent)",
                        stroke: "var(--card-bg)",
                        strokeWidth: 2,
                     }}
                  />
               </AreaChart>
            </ResponsiveContainer>
         </div>

         <div className="flex justify-between items-center mt-4 px-4 bg-muted dark:bg-muted rounded-full py-2 max-w-md mx-auto w-full text-xs font-bold text-gray-500">
            <button
               onClick={() => setPeriod("1d")}
               className={`px-4 py-1.5 rounded-full transition-colors ${period === "1d" ? "bg-muted-foreground  text-foreground" : ""}`}>
               1 Día
            </button>
            <button
               onClick={() => setPeriod("1w")}
               className={`px-4 py-1.5 rounded-full transition-colors ${period === "1w" ? "bg-muted-foreground  text-foreground" : ""}`}>
               1 Sem
            </button>
            <button
               onClick={() => setPeriod("1m")}
               className={`px-4 py-1.5 rounded-full transition-colors ${period === "1m" ? "bg-muted-foreground  text-foreground" : ""}`}>
               1 Mes
            </button>
            <button
               onClick={() => setPeriod("1y")}
               className={`px-4 py-1.5 rounded-full transition-colors ${period === "1y" ? "bg-muted-foreground  text-foreground" : ""}`}>
               1 Año
            </button>
         </div>
      </div>
   )
}
