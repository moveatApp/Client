import { useState } from "react"
import { useStore, Meal } from "@/store/useStore"
import { motion, AnimatePresence } from "framer-motion"
import {
   Send,
   Utensils,
   Zap,
   Plus,
   Image as ImageIcon,
   Apple,
   History,
   Trash2,
   ChevronDown,
   ChevronUp,
   Scale,
} from "lucide-react"

export default function NutritionPage() {
   const { meals, dailyCalories, targetCalories, addMeal, updateMealGrams, removeMeal } = useStore()
   const [inputText, setInputText] = useState("")
   const [isAnalyzing, setIsAnalyzing] = useState(false)
   const [suggestedMeal, setSuggestedMeal] = useState<any>(null)
   const [expandedMealId, setExpandedMealId] = useState<string | null>(null)

   const handleAIAnalyze = (e: React.FormEvent) => {
      e.preventDefault()
      if (!inputText.trim()) return

      setIsAnalyzing(true)
      setTimeout(() => {
         // Valores base por cada 100g
         const baseCalories = 150 + Math.floor(Math.random() * 200)
         const baseProtein = 5 + Math.floor(Math.random() * 10)
         const baseCarbs = 10 + Math.floor(Math.random() * 20)
         const baseFat = 2 + Math.floor(Math.random() * 8)
         const baseSugar = 1 + Math.floor(Math.random() * 5)
         
         const initialGrams = 200
         const ratio = initialGrams / 100

         setSuggestedMeal({
            name: inputText,
            baseCalories,
            baseProtein,
            baseCarbs,
            baseFat,
            baseSugar,
            grams: initialGrams,
            calories: Math.round(baseCalories * ratio),
            protein: Math.round(baseProtein * ratio),
            carbs: Math.round(baseCarbs * ratio),
            fat: Math.round(baseFat * ratio),
            sugar: Math.round(baseSugar * ratio),
         })
         setIsAnalyzing(false)
      }, 1200)
   }

   const confirmMeal = () => {
      if (suggestedMeal) {
         addMeal({
            id: Date.now().toString(),
            name: suggestedMeal.name,
            baseCalories: suggestedMeal.baseCalories,
            baseProtein: suggestedMeal.baseProtein,
            baseCarbs: suggestedMeal.baseCarbs,
            baseFat: suggestedMeal.baseFat,
            baseSugar: suggestedMeal.baseSugar,
            grams: suggestedMeal.grams,
            calories: suggestedMeal.calories,
            protein: suggestedMeal.protein,
            carbs: suggestedMeal.carbs,
            fat: suggestedMeal.fat,
            sugar: suggestedMeal.sugar,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
         })
         setSuggestedMeal(null)
         setInputText("")
      }
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
                     <span className="text-4xl font-display font-extrabold text-primary">{dailyCalories}</span>
                     <span className="text-gray-400 font-medium ml-1">/ {targetCalories} kcal</span>
                  </div>
                  <div className="bg-white/50 dark:bg-white/10 px-3 py-1.5 rounded-xl border border-white/50 text-[10px] font-bold text-primary">
                     {targetCalories - dailyCalories} restantes
                  </div>
               </div>
               <div className="h-2 bg-white dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full ${progress > 100 ? "bg-red-400" : "bg-primary"}`} />
               </div>
            </motion.section>

            <motion.section className="bg-card-bg rounded-[32px] p-6 shadow-sm border border-card-border flex flex-col justify-center">
               <form onSubmit={handleAIAnalyze} className="relative ring-1 ring-black/5 dark:ring-white/10 rounded-2xl overflow-hidden focus-within:ring-primary/40 transition-all">
                  <div className="flex items-center bg-muted dark:bg-white/5">
                     <div className="p-3 text-gray-400"><ImageIcon size={18} /></div>
                     <input
                        type="text"
                        placeholder="Bowl de avena..."
                        className="flex-1 py-3 outline-none bg-transparent font-medium text-sm text-foreground"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={isAnalyzing || suggestedMeal}
                     />
                     <button type="submit" className="p-2 mr-1.5 bg-primary text-white rounded-xl active:scale-95 transition-transform">
                        {isAnalyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                     </button>
                  </div>
               </form>
            </motion.section>
         </div>

         <AnimatePresence>
            {suggestedMeal && (
               <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-6 overflow-hidden">
                  <div className="bg-primary/5 p-5 rounded-[32px] border border-primary/20">
                     <div className="flex justify-between items-center mb-4 text-primary">
                        <span className="text-xs font-bold uppercase tracking-widest">Sugerencia AI</span>
                        <div className="text-right">
                           <span className="block text-2xl font-display font-bold">{suggestedMeal.calories} kcal</span>
                           <span className="text-[10px] opacity-70 font-bold uppercase">Estimación {suggestedMeal.grams}g</span>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => { setSuggestedMeal(null); setInputText("") }} className="flex-1 py-3 rounded-xl font-bold text-xs bg-gray-100 text-gray-500">Descartar</button>
                        <button onClick={confirmMeal} className="flex-1 py-3 rounded-xl font-bold text-xs bg-primary text-white">Confirmar</button>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         <section className="flex-1">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2"><History size={18} className="text-primary" /> Historial</h3>
            <div className="space-y-3">
               {meals.map((meal) => (
                  <motion.div
                     key={meal.id}
                     layout
                     className={`bg-card-bg border border-card-border overflow-hidden transition-all ${expandedMealId === meal.id ? 'rounded-[32px] shadow-lg' : 'rounded-[24px]'}`}
                  >
                     <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedMealId(expandedMealId === meal.id ? null : meal.id)}>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Utensils size={18} /></div>
                           <div>
                              <h4 className="font-bold text-sm capitalize">{meal.name}</h4>
                              <span className="text-[10px] text-gray-400 font-medium">{meal.time}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right">
                              <span className="block font-bold text-base leading-none">{meal.calories}</span>
                              <span className="text-[9px] text-gray-400 font-bold uppercase">Kcal</span>
                           </div>
                           {expandedMealId === meal.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                     </div>

                     <AnimatePresence>
                        {expandedMealId === meal.id && (
                           <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-5 pb-5 border-t border-card-border/50">
                              {/* Quantity Edit Section */}
                              <div className="py-4 border-b border-card-border/30 mb-2">
                                 <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cantidad consumida</span>
                                    <span className="text-lg font-display font-bold text-primary">{meal.grams} g</span>
                                 </div>
                                 <div className="flex items-center gap-3 bg-gray-100/50 dark:bg-white/5 p-3 rounded-2xl">
                                    <Scale size={18} className="text-gray-400" />
                                    <input 
                                       type="range" 
                                       min="10" 
                                       max="1000" 
                                       step="10"
                                       className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary"
                                       value={meal.grams}
                                       onChange={(e) => updateMealGrams(meal.id, parseInt(e.target.value))}
                                    />
                                    <div className="flex items-center gap-1 bg-white dark:bg-white/10 px-3 py-1 rounded-xl shadow-sm border border-black/5">
                                       <input 
                                          type="number" 
                                          className="w-12 bg-transparent font-bold text-sm text-center outline-none"
                                          value={meal.grams}
                                          onChange={(e) => updateMealGrams(meal.id, parseInt(e.target.value) || 0)}
                                       />
                                       <span className="text-[10px] font-bold text-gray-400">g</span>
                                    </div>
                                 </div>
                              </div>

                              {/* Macros View-only */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3">
                                 {[
                                    { label: 'Proteínas', val: meal.protein, color: 'text-primary' },
                                    { label: 'Carbos', val: meal.carbs, color: 'text-accent' },
                                    { label: 'Grasas', val: meal.fat, color: 'text-orange-400' },
                                    { label: 'Azúcar', val: meal.sugar, color: 'text-pink-400' }
                                 ].map(m => (
                                    <div key={m.label} className="bg-muted dark:bg-white/5 p-3 rounded-2xl border border-black/5">
                                       <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">{m.label}</span>
                                       <span className={`text-base font-display font-bold ${m.color}`}>{m.val}g</span>
                                    </div>
                                 ))}
                              </div>

                              <div className="mt-4">
                                 <button onClick={() => removeMeal(meal.id)} className="w-full py-3.5 flex items-center justify-center gap-2 rounded-2xl bg-red-50 text-red-500 font-bold hover:bg-red-100 active:scale-95 transition-all">
                                    <Trash2 size={18} /> Eliminar Registro
                                 </button>
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </motion.div>
               ))}
               {meals.length === 0 && <div className="text-center py-10 text-gray-400 border-2 border-dashed border-card-border rounded-[32px]">Sin registros hoy</div>}
            </div>
         </section>
      </div>
   )
}
