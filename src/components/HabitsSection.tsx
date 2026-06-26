// ─── Daily habits: water + steps (persisted to the backend) ──────────────────

import { useState } from "react"
import { Droplet, Footprints, Plus, Minus, Check } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useStore } from "@/store/useStore"
import { apiUpsertHabit } from "@/api/habits"
import { todayLocalISO } from "@/api/client"
import { ProgressRing, CountUp } from "@/components/ui"

export default function HabitsSection() {
   const { t } = useTranslation("common")
   const waterGlasses = useStore((s) => s.waterGlasses)
   const waterTarget = useStore((s) => s.waterTarget)
   const steps = useStore((s) => s.steps)
   const stepsTarget = useStore((s) => s.stepsTarget)
   const setSteps = useStore((s) => s.setSteps)

   const [stepsInput, setStepsInput] = useState("")
   const [editingSteps, setEditingSteps] = useState(false)

   const persistWater = (value: number) =>
      void apiUpsertHabit("WATER", { localDate: todayLocalISO(), value, target: waterTarget, unit: "glass" })
   const persistSteps = (value: number) =>
      void apiUpsertHabit("STEPS", { localDate: todayLocalISO(), value, target: stepsTarget, unit: "step" })

   const changeWater = (delta: number) => {
      const next = Math.max(0, waterGlasses + delta)
      useStore.setState({ waterGlasses: next })
      persistWater(next)
   }

   const saveSteps = () => {
      const n = Math.max(0, Math.round(Number(stepsInput)))
      if (!Number.isFinite(n)) return
      setSteps(n)
      persistSteps(n)
      setEditingSteps(false)
   }

   return (
      <div className="flex flex-col gap-4 w-full">
         {/* Water */}
         <div className="bg-card-bg rounded-[28px] p-5 flex items-center gap-4 soft-raised">
            <ProgressRing value={waterGlasses} max={waterTarget} size={56} stroke={6} color="var(--water)" gradientTo="#bfe3f5">
               <Droplet size={18} className="text-water" />
            </ProgressRing>
            <div className="flex-1 min-w-0">
               <p className="font-bold text-foreground">{t("habits.water")}</p>
               <p className="text-sm text-subtle font-medium">
                  <CountUp value={waterGlasses} />/{waterTarget} · <CountUp value={waterGlasses * 200} />ml
               </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
               <button
                  aria-label={t("habits.remove")}
                  onClick={() => changeWater(-1)}
                  disabled={waterGlasses === 0}
                  className="w-10 h-10 rounded-2xl bg-muted text-foreground flex items-center justify-center disabled:opacity-30 soft-pressable">
                  <Minus size={18} />
               </button>
               <button
                  aria-label={t("habits.add")}
                  onClick={() => changeWater(1)}
                  className="w-10 h-10 rounded-2xl bg-water/20 text-water flex items-center justify-center soft-pressable">
                  <Plus size={18} />
               </button>
            </div>
         </div>

         {/* Steps */}
         <div className="bg-card-bg rounded-[28px] p-5 flex items-center gap-4 soft-raised">
            <ProgressRing value={steps} max={stepsTarget} size={56} stroke={6} color="var(--primary)" gradientTo="var(--accent)">
               <Footprints size={18} className="text-primary" />
            </ProgressRing>
            <div className="flex-1 min-w-0">
               <p className="font-bold text-foreground">{t("habits.steps")}</p>
               {editingSteps ? (
                  <div className="flex items-center gap-2 mt-1">
                     <input
                        type="number"
                        min={0}
                        step={100}
                        autoFocus
                        value={stepsInput}
                        onChange={(e) => setStepsInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveSteps()}
                        placeholder={String(steps)}
                        className="w-24 bg-muted rounded-xl px-2 py-1 font-bold text-sm text-foreground outline-none soft-inset"
                     />
                     <button
                        onClick={saveSteps}
                        className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center soft-pressable">
                        <Check size={16} />
                     </button>
                  </div>
               ) : (
                  <p className="text-sm text-subtle font-medium">
                     <CountUp value={steps} />/<CountUp value={stepsTarget} />
                  </p>
               )}
            </div>
            {!editingSteps && (
               <button
                  onClick={() => {
                     setStepsInput(steps > 0 ? String(steps) : "")
                     setEditingSteps(true)
                  }}
                  className="px-4 py-2 rounded-2xl bg-primary/10 text-primary font-bold text-sm shrink-0 soft-pressable">
                  {t("habits.log")}
               </button>
            )}
         </div>
      </div>
   )
}
