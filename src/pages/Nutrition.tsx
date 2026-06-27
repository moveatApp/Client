import { useState } from "react"
import { useStore, Meal, mealFromEntry } from "@/store/useStore"
import { apiDeleteMealEntry, type MealEntryCreateResponse } from "@/api/meals"
import { toast } from "@/components/ui/toast"
import MealBuilder from "@/components/MealBuilder"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
   Utensils,
   Apple,
   History,
   Trash2,
   ChevronDown,
   ChevronUp,
   CheckCircle,
} from "lucide-react"
import { Button, CountUp } from "@/components/ui"
import { cardEnter, stagger } from "@/lib/motion"
import { localDateStr } from "@/lib/date"

export default function NutritionPage() {
   const {
      meals,
      dailyCalories,
      targetCalories,
      removeMeal,
      addXP,
      setDailyTotals,
   } = useStore()
   const shouldReduceMotion = useReducedMotion()
   const { t, i18n } = useTranslation("common")
   const [expandedMealId, setExpandedMealId] = useState<string | null>(null)

   // Backend is authoritative: store the persisted entry and its updated totals.
   const handleMealSaved = (data: MealEntryCreateResponse) => {
      const meal = mealFromEntry(data.mealEntry)
      useStore.setState((state) => ({ meals: [meal, ...state.meals] }))
      setDailyTotals(data.dailySummary.caloriesConsumed, data.dailySummary.calorieTarget)
      addXP(20)
   }

   const todayStr = localDateStr()
   const yesterdayDate = new Date()
   yesterdayDate.setDate(yesterdayDate.getDate() - 1)
   const yesterdayStr = localDateStr(yesterdayDate)

   // Optimistic delete: drop the meal locally, persist, and roll back on error.
   const handleDeleteMeal = async (meal: Meal) => {
      const prevMeals = useStore.getState().meals
      const prevDaily = useStore.getState().dailyCalories
      removeMeal(meal.id)

      const res = await apiDeleteMealEntry(meal.id)
      if (!res.ok) {
         useStore.setState({ meals: prevMeals, dailyCalories: prevDaily })
         toast.error(res.message)
         return
      }
      // Reconcile today's ring with the authoritative summary when the deleted
      // meal was from today (past-day deletions don't affect today's totals).
      if ((meal.date || todayStr) === todayStr) {
         setDailyTotals(res.data.dailySummary.caloriesConsumed, res.data.dailySummary.calorieTarget)
      }
   }

   const groupedMeals = meals.reduce<Record<string, Meal[]>>((acc, meal) => {
      const key = meal.date || todayStr
      if (!acc[key]) acc[key] = []
      acc[key].push(meal)
      return acc
   }, {})

   const sortedDates = Object.keys(groupedMeals).sort((a, b) => b.localeCompare(a))

   const dateLabel = (date: string) => {
      if (date === todayStr) return t("nutrition.today")
      if (date === yesterdayStr) return t("nutrition.yesterday")
      return new Date(date + "T12:00:00").toLocaleDateString(i18n.language, {
         weekday: "long",
         day: "numeric",
         month: "long",
      })
   }

   const progress = Math.min((dailyCalories / targetCalories) * 100, 100)

   // Today's macro totals (preview alongside the calorie counter).
   const todayMacros = meals
      .filter((m) => (m.date || todayStr) === todayStr)
      .reduce(
         (acc, m) => ({
            protein: acc.protein + (m.protein || 0),
            carbs: acc.carbs + (m.carbs || 0),
            fat: acc.fat + (m.fat || 0),
         }),
         { protein: 0, carbs: 0, fat: 0 },
      )
   const macroKcal = todayMacros.protein * 4 + todayMacros.carbs * 4 + todayMacros.fat * 9
   const macroPct = (grams: number, perGram: number) =>
      macroKcal > 0 ? (grams * perGram * 100) / macroKcal : 0
   const macroRows = [
      { key: "protein", val: todayMacros.protein, color: "text-macro-protein", bar: "bg-macro-protein", pct: macroPct(todayMacros.protein, 4) },
      { key: "carbs", val: todayMacros.carbs, color: "text-macro-carbs", bar: "bg-macro-carbs", pct: macroPct(todayMacros.carbs, 4) },
      { key: "fat", val: todayMacros.fat, color: "text-macro-fat", bar: "bg-macro-fat", pct: macroPct(todayMacros.fat, 9) },
   ]

   return (
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-6 animate-fade-in font-sans w-full h-full min-h-screen flex flex-col">
         <header className="mb-6 shrink-0">
            <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight flex items-center gap-2">
               <Apple size={32} className="text-primary" />
               {t("nutrition.header")}
            </h1>
         </header>

          <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-4 lg:gap-6 mb-6">
             <motion.section variants={cardEnter} className="bg-primary/10 border border-primary/20 rounded-[32px] p-6 min-h-[140px] flex flex-col justify-center soft-raised">
                <div className="flex justify-between items-center mb-4">
                   <div>
                      <span className="text-4xl font-display font-extrabold text-primary">
                         <CountUp value={dailyCalories} />
                      </span>
                       <span className="text-subtle font-medium ml-1">
                         / {targetCalories} kcal
                      </span>
                   </div>
                   {dailyCalories >= targetCalories ? (
                      <motion.div
                         animate={
                            shouldReduceMotion
                               ? undefined
                               : { scale: [1, 1.15, 1], rotate: [0, 3, -3, 0] }
                         }
                         transition={{
                            repeat: shouldReduceMotion ? 0 : Infinity,
                            duration: 1.5,
                            ease: "easeInOut",
                         }}
                           className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-caption text-primary border border-primary/30 bg-primary/10">
                         <CheckCircle size={12} /> {t("nutrition.completed")}
                      </motion.div>
                   ) : (
                        <div className="bg-muted/70 dark:bg-muted px-3 py-1.5 rounded-xl border border-card-border text-caption text-primary">
                         {t("nutrition.remaining", { count: targetCalories - dailyCalories })}
                      </div>
                   )}
                </div>
                 <div className="h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                   <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                       className={`h-full ${progress > 100 ? "bg-danger" : "bg-primary"}`}
                   />
                </div>
             </motion.section>

             {/* Daily macros preview */}
             <motion.section variants={cardEnter} className="bg-card-bg border border-card-border rounded-[32px] p-5 flex flex-col gap-4 soft-raised">
                <span className="text-xs font-bold uppercase tracking-wider text-subtle">
                   {t("nutrition.macros_today")}
                </span>
                <div className="h-2.5 flex rounded-full overflow-hidden bg-muted soft-inset">
                   {macroKcal > 0 ? (
                      macroRows.map((m) => (
                         <motion.div
                            key={m.key}
                            initial={{ width: 0 }}
                            animate={{ width: `${m.pct}%` }}
                            className={m.bar}
                         />
                      ))
                   ) : null}
                </div>
                <div className="grid grid-cols-3 gap-3">
                   {macroRows.map((m) => (
                      <div
                         key={m.key}
                         className="flex flex-col items-center bg-card-bg rounded-2xl py-3 soft-raised-sm">
                         <span className={`text-xl font-display font-extrabold ${m.color}`}>
                            <CountUp value={Math.round(m.val)} />g
                         </span>
                         <span className="text-caption text-subtle capitalize">
                            {t(`nutrition.macros.${m.key}`)}
                         </span>
                      </div>
                   ))}
                </div>
             </motion.section>

          </motion.div>

         <div className="mb-6">
            <MealBuilder onSaved={handleMealSaved} />
         </div>

         <section className="flex-1">
             <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                <History size={18} className="text-primary" /> {t("nutrition.history")}
             </h2>
            {sortedDates.length === 0 ? (
               <div className="text-center py-10 text-subtle border-2 border-dashed border-card-border rounded-[32px]">
                  {t("nutrition.empty")}
               </div>
            ) : (
               <div className="space-y-6">
                  {sortedDates.map((date) => (
                     <div key={date}>
                         <h3 className="text-xs font-bold uppercase tracking-wider text-subtle mb-3">
                            {dateLabel(date)}
                         </h3>
                        <div className="space-y-3">
                           {groupedMeals[date].map((meal) => (
                              <motion.div
                                 key={meal.id}
                                 layout
                                 className={`bg-card-bg/40 border border-card-border overflow-hidden transition-all ${expandedMealId === meal.id ? "rounded-[32px] shadow-lg" : "rounded-[24px]"}`}>
                                 <div
                                    className="p-4 flex items-center justify-between cursor-pointer"
                                    onClick={() =>
                                       setExpandedMealId(
                                          expandedMealId === meal.id
                                             ? null
                                             : meal.id,
                                       )
                                    }>
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                          <Utensils size={18} />
                                       </div>
                                       <div>
                                          <h4 className="font-bold text-sm capitalize">
                                             {meal.name}
                                          </h4>
                                           <span className="text-xs text-subtle font-medium">{meal.time}</span>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                       <div className="text-right">
                                          <span className="block font-bold text-base leading-none">
                                             {meal.calories}
                                          </span>
                                            <span className="text-caption text-subtle">Kcal</span>
                                       </div>
                                       {expandedMealId === meal.id ? (
                                          <ChevronUp size={16} />
                                       ) : (
                                          <ChevronDown size={16} />
                                       )}
                                    </div>
                                 </div>

                                 <AnimatePresence>
                                    {expandedMealId === meal.id && (
                                       <motion.div
                                          initial={{ height: 0 }}
                                          animate={{ height: "auto" }}
                                          exit={{ height: 0 }}
                                          className="px-5 pb-5 border-t border-card-border/50">
                                          {/* Macros View-only */}
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3">
                                             {[
                                                {
                                                   key: "protein",
                                                   val: meal.protein,
                                                   color: "text-macro-protein",
                                                },
                                                {
                                                   key: "carbs",
                                                   val: meal.carbs,
                                                   color: "text-macro-carbs",
                                                },
                                                 {
                                                    key: "fat",
                                                    val: meal.fat,
                                                    color: "text-macro-fat",
                                                 },
                                                {
                                                    key: "sugar",
                                                    val: meal.sugar,
                                                    color: "text-macro-sugar",
                                                },
                                             ].map((m) => (
                                                 <div key={m.key} className="bg-muted p-3 rounded-2xl border border-card-border">
                                                     <span className="text-caption text-subtle block mb-0.5">{t(`nutrition.macros.${m.key}`)}</span>
                                                   <span
                                                      className={`text-base font-display font-bold ${m.color}`}>
                                                      {m.val}g
                                                   </span>
                                                </div>
                                             ))}
                                          </div>

                                          <div className="mt-4">
                                             <Button
                                                variant="danger"
                                                onClick={() => handleDeleteMeal(meal)}
                                                className="w-full flex items-center justify-center gap-2">
                                                <Trash2 size={18} /> {t("nutrition.delete_entry")}
                                             </Button>
                                          </div>
                                       </motion.div>
                                    )}
                                 </AnimatePresence>
                              </motion.div>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </section>
      </div>
   )
}
