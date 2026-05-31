import { useState } from "react"
import { useStore, Meal } from "@/store/useStore"
import { estimateMacros } from "@/lib/nutrition"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
   Send,
   Utensils,
   Plus,
   Image as ImageIcon,
   Apple,
   History,
   Trash2,
   ChevronDown,
   ChevronUp,
   Scale,
   CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui"

export default function NutritionPage() {
   const {
      meals,
      dailyCalories,
      targetCalories,
      addMeal,
      updateMealGrams,
      removeMeal,
   } = useStore()
   const shouldReduceMotion = useReducedMotion()
   const [inputText, setInputText] = useState("")
   const [isAnalyzing, setIsAnalyzing] = useState(false)
   const [suggestedMeal, setSuggestedMeal] = useState<any>(null)
   const [expandedMealId, setExpandedMealId] = useState<string | null>(null)

   const handleAIAnalyze = (e: React.FormEvent) => {
      e.preventDefault()
      if (!inputText.trim()) return

      setIsAnalyzing(true)
      setTimeout(() => {
         const macros = estimateMacros(inputText)
         const initialGrams = 200
         const ratio = initialGrams / 100

         setSuggestedMeal({
            name: inputText,
            grams: initialGrams,
            calories: Math.round(macros.baseCalories * ratio),
            baseCalories: macros.baseCalories,
            baseProtein: macros.baseProtein,
            baseCarbs: macros.baseCarbs,
            baseFat: macros.baseFat,
            baseSugar: macros.baseSugar,
            protein: Math.round(macros.baseProtein * ratio),
            carbs: Math.round(macros.baseCarbs * ratio),
            fat: Math.round(macros.baseFat * ratio),
            sugar: Math.round(macros.baseSugar * ratio),
            confidence: macros.confidence,
         })
         setIsAnalyzing(false)
      }, 800)
   }

   const confirmMeal = () => {
      if (!suggestedMeal) return
      const now = new Date()
      const timeStr = now.toLocaleTimeString("es-ES", {
         hour: "2-digit",
         minute: "2-digit",
      })
      const dateStr = now.toISOString().split("T")[0]
      const meal: Meal = {
         ...suggestedMeal,
         id: Date.now().toString(),
         time: timeStr,
         date: dateStr,
      }
      addMeal(meal)
      setSuggestedMeal(null)
      setInputText("")
   }

   const todayStr = new Date().toISOString().split("T")[0]
   const yesterdayDate = new Date()
   yesterdayDate.setDate(yesterdayDate.getDate() - 1)
   const yesterdayStr = yesterdayDate.toISOString().split("T")[0]

   const groupedMeals = meals.reduce<Record<string, Meal[]>>((acc, meal) => {
      const key = meal.date || todayStr
      if (!acc[key]) acc[key] = []
      acc[key].push(meal)
      return acc
   }, {})

   const sortedDates = Object.keys(groupedMeals).sort((a, b) => b.localeCompare(a))

   const dateLabel = (date: string) => {
      if (date === todayStr) return "Hoy"
      if (date === yesterdayStr) return "Ayer"
      return new Date(date + "T12:00:00").toLocaleDateString("es-ES", {
         weekday: "long",
         day: "numeric",
         month: "long",
      })
   }

   const progress = Math.min((dailyCalories / targetCalories) * 100, 100)

   return (
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-6 animate-fade-in font-sans w-full h-full min-h-screen flex flex-col">
         <header className="mb-6 shrink-0">
            <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight flex items-center gap-2">
               <Apple size={32} className="text-primary" />
               Alimentación
            </h1>
         </header>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6">
            <motion.section className="bg-primary/10 border border-primary/20 rounded-[32px] p-6 min-h-[140px] flex flex-col justify-center">
               <div className="flex justify-between items-center mb-4">
                  <div>
                     <span className="text-4xl font-display font-extrabold text-primary">
                        {dailyCalories}
                     </span>
                     <span className="text-gray-400 font-medium ml-1">
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
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold text-green-500 border border-green-500/30 bg-green-500/10">
                        <CheckCircle size={12} /> Completado!
                     </motion.div>
                  ) : (
                     <div className="bg-white/50 dark:bg-gray-400/20 px-3 py-1.5 rounded-xl border border-gray-400/30 text-[10px] font-bold text-primary">
                        {targetCalories - dailyCalories} restantes
                     </div>
                  )}
               </div>
               <div className="h-2 bg-muted dark:bg-white-500/5 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                     initial={{ width: 0 }}
                     animate={{ width: `${progress}%` }}
                     className={`h-full ${progress > 100 ? "bg-red-400" : "bg-primary"}`}
                  />
               </div>
            </motion.section>

            <motion.section className="bg-card-bg rounded-[32px] p-6 shadow-sm border border-card-border flex flex-col justify-center">
               <form
                  onSubmit={handleAIAnalyze}
                  className="relative ring-1 ring-black/5 dark:ring-white/10 rounded-2xl overflow-hidden focus-within:ring-primary/40 transition-all">
                  <div className="flex items-center bg-muted dark:bg-white-500/5">
                     <div className="p-3 text-gray-400">
                        <ImageIcon size={18} />
                     </div>
                     <input
                        type="text"
                        aria-label="Buscar comida"
                        placeholder="Bowl de avena…"
                        autoComplete="off"
                        spellCheck={false}
                         className="flex-1 min-w-0 py-3 outline-none bg-transparent font-medium text-sm text-foreground"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={isAnalyzing || suggestedMeal}
                     />
                     <button
                        type="submit"
                        className="p-2 mr-1.5 bg-primary text-white rounded-xl active:scale-95 transition-transform">
                        {isAnalyzing ? (
                           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                           <Send size={16} />
                        )}
                     </button>
                  </div>
               </form>
            </motion.section>
         </div>

         <AnimatePresence>
            {suggestedMeal && (
               <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-6 overflow-hidden">
                  <div className="bg-primary/5 p-5 rounded-[32px] border border-primary/20">
                     <div className="flex justify-between items-center mb-4 text-primary">
                        <span className="text-xs font-bold uppercase tracking-widest">
                           Sugerencia AI
                        </span>
                        <div className="text-right">
                           <span className="block text-2xl font-display font-bold">
                              {suggestedMeal.calories} kcal
                           </span>
                           <span className="text-[10px] opacity-70 font-bold uppercase">
                              Estimación {suggestedMeal.grams}g
                           </span>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <Button
                           variant="muted"
                           onClick={() => {
                              setSuggestedMeal(null)
                              setInputText("")
                           }}
                           className="flex-1 py-3">
                           Descartar
                        </Button>
                        <Button
                           variant="primary"
                           onClick={confirmMeal}
                           className="flex-1 py-3">
                           Confirmar
                        </Button>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         <section className="flex-1">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
               <History size={18} className="text-primary" /> Historial
            </h3>
            {sortedDates.length === 0 ? (
               <div className="text-center py-10 text-gray-400 border-2 border-dashed border-card-border rounded-[32px]">
                  Sin registros aún
               </div>
            ) : (
               <div className="space-y-6">
                  {sortedDates.map((date) => (
                     <div key={date}>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                           {dateLabel(date)}
                        </h4>
                        <div className="space-y-3">
                           {groupedMeals[date].map((meal) => (
                              <motion.div
                                 key={meal.id}
                                 layout
                                 className={`bg-card-bg border border-card-border overflow-hidden transition-all ${expandedMealId === meal.id ? "rounded-[32px] shadow-lg" : "rounded-[24px]"}`}>
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
                                          <span className="text-[10px] text-gray-400 font-medium">
                                             {meal.time}
                                          </span>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                       <div className="text-right">
                                          <span className="block font-bold text-base leading-none">
                                             {meal.calories}
                                          </span>
                                          <span className="text-[9px] text-gray-400 font-bold uppercase">
                                             Kcal
                                          </span>
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
                                          {/* Quantity Edit Section */}
                                          <div className="py-4 border-b border-card-border/30 mb-2">
                                             <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                   Cantidad consumida
                                                </span>
                                             </div>
                                             <div className="flex items-center gap-3 bg-muted/50 dark:bg-white-500/5 p-3 rounded-2xl">
                                                <Scale
                                                   size={18}
                                                   className="text-gray-400"
                                                />
                                                <input
                                                   type="range"
                                                   aria-label="Cantidad en gramos"
                                                   min="10"
                                                   max="1000"
                                                   step="10"
                                                   className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full appearance-none cursor-pointer accent-primary"
                                                   value={meal.grams}
                                                   onChange={(e) =>
                                                      updateMealGrams(
                                                         meal.id,
                                                         parseInt(e.target.value),
                                                      )
                                                   }
                                                />
                                                <div className="flex items-center">
                                                   <input
                                                      type="number"
                                                      aria-label="Gramos"
                                                      className="w-13 text-lg bg-transparent text-primary font-bold text-center"
                                                      value={meal.grams}
                                                      onChange={(e) =>
                                                         updateMealGrams(
                                                            meal.id,
                                                            parseInt(
                                                               e.target.value,
                                                            ) || 0,
                                                         )
                                                      }
                                                   />
                                                </div>
                                             </div>
                                          </div>

                                          {/* Macros View-only */}
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3">
                                             {[
                                                {
                                                   label: "Proteínas",
                                                   val: meal.protein,
                                                   color: "text-primary",
                                                },
                                                {
                                                   label: "Carbos",
                                                   val: meal.carbs,
                                                   color: "text-accent",
                                                },
                                                {
                                                   label: "Grasas",
                                                   val: meal.fat,
                                                   color: "text-orange-400",
                                                },
                                                {
                                                   label: "Azúcar",
                                                   val: meal.sugar,
                                                   color: "text-pink-400",
                                                },
                                             ].map((m) => (
                                                <div
                                                   key={m.label}
                                                   className="bg-muted dark:bg-white-500/5 p-3 rounded-2xl border border-black/5">
                                                   <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">
                                                      {m.label}
                                                   </span>
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
                                                onClick={() => removeMeal(meal.id)}
                                                className="w-full flex items-center justify-center gap-2">
                                                <Trash2 size={18} /> Eliminar
                                                Registro
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
