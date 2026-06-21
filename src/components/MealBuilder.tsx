// ─── Meal builder: compose one meal from several ingredients ──────────────────
//
// Each ingredient is resolved via OpenFoodFacts (per-100g) with a quantity, or
// entered manually when OFF has no match. Saved as a single MealEntry (items[] +
// mealType) — the platform already supports multi-item meals.

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Database, PencilLine, Plus, Scale, Search, Trash2, Utensils, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { apiSearchFoods, type NormalizedFood } from "@/api/foods"
import { apiCreateMealEntry, type MealEntryCreateResponse } from "@/api/meals"
import type { MealType } from "@/api/client"
import { Button } from "@/components/ui"

const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "SNACK", "DINNER"]
const DEFAULT_GRAMS = 200

interface Base {
   cal: number
   pro: number
   carb: number
   fat: number
} // per 100 g

interface MealItemDraft {
   key: string
   name: string
   source: "openfoodfacts" | "manual"
   grams: number
   base: Base
}

interface ManualDraft {
   name: string
   grams: string
   cal: string
   pro: string
   carb: string
   fat: string
}

let seq = 0
const newKey = (): string => `mi${(seq += 1)}`

function defaultMealType(): MealType {
   const h = new Date().getHours()
   if (h < 11) return "BREAKFAST"
   if (h < 16) return "LUNCH"
   if (h < 20) return "SNACK"
   return "DINNER"
}

const scale = (per100: number, grams: number): number => Math.round((per100 * grams) / 100)
const itemCalories = (it: MealItemDraft): number => scale(it.base.cal, it.grams)

interface MealBuilderProps {
   onSaved: (res: MealEntryCreateResponse) => void
}

export default function MealBuilder({ onSaved }: MealBuilderProps) {
   const { t, i18n } = useTranslation("common")
   const [mealType, setMealType] = useState<MealType>(defaultMealType())
   const [items, setItems] = useState<MealItemDraft[]>([])
   const [saving, setSaving] = useState(false)
   const [saveError, setSaveError] = useState("")

   // Add-ingredient sub-flow.
   const [query, setQuery] = useState("")
   const [searching, setSearching] = useState(false)
   const [results, setResults] = useState<NormalizedFood[] | null>(null)
   const [pending, setPending] = useState<MealItemDraft | null>(null)
   const [manual, setManual] = useState<ManualDraft | null>(null)

   const total = items.reduce(
      (acc, it) => ({
         cal: acc.cal + scale(it.base.cal, it.grams),
         pro: acc.pro + scale(it.base.pro, it.grams),
         carb: acc.carb + scale(it.base.carb, it.grams),
         fat: acc.fat + scale(it.base.fat, it.grams),
      }),
      { cal: 0, pro: 0, carb: 0, fat: 0 },
   )

   const resetAdd = () => {
      setQuery("")
      setResults(null)
      setPending(null)
      setManual(null)
   }

   const search = async (e: React.FormEvent) => {
      e.preventDefault()
      const q = query.trim()
      if (!q || searching) return
      setSearching(true)
      setResults(null)
      setManual(null)
      setPending(null)
      const res = await apiSearchFoods(q, i18n.language)
      setResults(res.ok ? res.data.foods : [])
      setSearching(false)
   }

   const pickFood = (food: NormalizedFood) => {
      setResults(null)
      setPending({
         key: newKey(),
         name: food.name,
         source: "openfoodfacts",
         grams: food.servingSizeG ?? DEFAULT_GRAMS,
         base: {
            cal: food.per100g.calories,
            pro: food.per100g.proteinG ?? 0,
            carb: food.per100g.carbsG ?? 0,
            fat: food.per100g.fatG ?? 0,
         },
      })
   }

   const startManual = () => {
      setResults(null)
      setManual({ name: query.trim(), grams: "100", cal: "", pro: "", carb: "", fat: "" })
   }

   const addPending = () => {
      if (!pending) return
      setItems((prev) => [...prev, pending])
      resetAdd()
   }

   const addManual = () => {
      if (!manual) return
      const grams = Math.max(1, parseFloat(manual.grams) || 0)
      const ratio = grams / 100
      const num = (v: string) => parseFloat(v) || 0
      setItems((prev) => [
         ...prev,
         {
            key: newKey(),
            name: manual.name.trim() || t("nutrition.builder.name"),
            source: "manual",
            grams,
            // Manual values are entered for the given portion → store back as per-100g.
            base: {
               cal: num(manual.cal) / ratio,
               pro: num(manual.pro) / ratio,
               carb: num(manual.carb) / ratio,
               fat: num(manual.fat) / ratio,
            },
         },
      ])
      resetAdd()
   }

   const setPendingGrams = (grams: number) =>
      setPending((p) => (p === null ? p : { ...p, grams: Math.max(1, grams) }))
   const removeItem = (key: string) => setItems((prev) => prev.filter((it) => it.key !== key))

   const saveMeal = async () => {
      if (items.length === 0 || saving) return
      setSaving(true)
      setSaveError("")
      const res = await apiCreateMealEntry({
         mealType,
         items: items.map((it) => ({
            name: it.name,
            estimatedQuantity: it.grams,
            estimatedUnit: "g",
            estimatedCalories: scale(it.base.cal, it.grams),
            proteinG: scale(it.base.pro, it.grams),
            carbsG: scale(it.base.carb, it.grams),
            fatG: scale(it.base.fat, it.grams),
         })),
      })
      if (res.ok) {
         onSaved(res.data)
         setItems([])
         resetAdd()
      } else {
         setSaveError(res.message)
      }
      setSaving(false)
   }

   const mealLabel = (mt: MealType) => t(`mealtype.${mt}`)

   return (
      <section className="bg-card-bg/40 rounded-[32px] p-5 shadow-sm border border-card-border max-w-xl mx-auto w-full">
         {/* Meal type */}
         <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden mb-4">
            {MEAL_TYPES.map((mt) => (
               <button
                  key={mt}
                  onClick={() => setMealType(mt)}
                  className={`shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-colors ${mealType === mt ? "bg-primary text-white" : "bg-muted/50 dark:bg-white/5 text-subtle hover:text-foreground"}`}>
                  {mealLabel(mt)}
               </button>
            ))}
         </div>

         {/* Current ingredients */}
         {items.length > 0 && (
            <div className="space-y-2 mb-4">
               {items.map((it) => (
                  <div
                     key={it.key}
                     className="flex items-center justify-between gap-3 bg-muted/40 rounded-2xl px-3 py-2.5 border border-card-border">
                     <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate capitalize">{it.name}</p>
                        <p className="text-[11px] text-subtle font-medium">
                           {it.grams} g · {itemCalories(it)} kcal
                           {it.source === "manual" && ` · ${t("nutrition.source_estimate")}`}
                        </p>
                     </div>
                     <button
                        onClick={() => removeItem(it.key)}
                        aria-label={t("training.remove_exercise")}
                        className="p-2 rounded-xl text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-colors shrink-0">
                        <Trash2 size={15} />
                     </button>
                  </div>
               ))}
            </div>
         )}

         {/* Search to add an ingredient */}
         <form
            onSubmit={search}
            className="relative ring-1 ring-card-border rounded-2xl overflow-hidden focus-within:ring-primary/40 transition-all">
            <div className="flex items-center bg-muted">
               <div className="p-3 text-subtle">
                  <Search size={18} />
               </div>
               <input
                  type="text"
                  aria-label={t("nutrition.builder.add_ingredient")}
                  placeholder={t("nutrition.builder.add_ingredient")}
                  autoComplete="off"
                  className="flex-1 min-w-0 py-3 outline-none bg-transparent font-medium text-sm text-foreground"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
               />
               <button
                  type="submit"
                  aria-label={t("nutrition.search_aria")}
                  className="min-w-11 min-h-11 flex items-center justify-center mr-1.5 bg-primary text-white rounded-xl active:scale-95 transition-transform">
                  {searching ? (
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                     <Plus size={18} />
                  )}
               </button>
            </div>
         </form>

         {/* Results */}
         <AnimatePresence>
            {results && (
               <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                     {results.length === 0 ? (
                        <p className="text-center text-subtle text-xs py-3 font-medium">
                           {t("nutrition.builder.manual_hint")}
                        </p>
                     ) : (
                        results.map((food, idx) => (
                           <button
                              key={`${food.sourceId}-${idx}`}
                              onClick={() => pickFood(food)}
                              className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-2xl bg-muted/50 hover:bg-muted border border-card-border transition-colors active:scale-[0.99]">
                              <div className="min-w-0">
                                 <p className="font-bold text-sm text-foreground truncate capitalize">{food.name}</p>
                                 {food.brand && (
                                    <p className="text-[11px] text-subtle font-medium truncate">{food.brand}</p>
                                 )}
                              </div>
                              <span className="text-xs font-bold text-primary shrink-0">
                                 {food.per100g.calories}
                                 <span className="text-subtle font-medium"> kcal/100g</span>
                              </span>
                           </button>
                        ))
                     )}
                     <button
                        onClick={startManual}
                        className="w-full text-xs font-bold text-subtle flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-muted/50 transition-colors">
                        <PencilLine size={12} /> {t("nutrition.builder.manual_entry")}
                     </button>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Pending OFF item: set quantity, then add */}
         {pending && (
            <div className="mt-3 bg-primary/5 border border-primary/20 rounded-2xl p-4">
               <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="min-w-0">
                     <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                        <Database size={10} /> {t("nutrition.source_off")}
                     </span>
                     <p className="font-bold text-foreground text-sm truncate capitalize mt-1">{pending.name}</p>
                  </div>
                  <span className="text-lg font-display font-bold text-primary shrink-0">
                     {itemCalories(pending)} <span className="text-xs">kcal</span>
                  </span>
               </div>
               <div className="flex items-center gap-3 bg-muted p-2.5 rounded-2xl mb-3">
                  <Scale size={16} className="text-subtle shrink-0" />
                  <input
                     type="range"
                     min="10"
                     max="1000"
                     step="10"
                     aria-label={t("nutrition.amount_grams_aria")}
                     className="flex-1 h-1.5 bg-on-subtle rounded-full appearance-none cursor-pointer accent-primary"
                     value={pending.grams}
                     onChange={(e) => setPendingGrams(parseInt(e.target.value))}
                  />
                  <input
                     type="number"
                     min={1}
                     aria-label={t("nutrition.grams_aria")}
                     className="w-14 text-base bg-transparent text-primary font-bold text-center"
                     value={pending.grams}
                     onChange={(e) => setPendingGrams(parseInt(e.target.value) || 0)}
                  />
                  <span className="text-xs text-subtle font-bold shrink-0">g</span>
               </div>
               <div className="flex gap-2">
                  <Button variant="muted" onClick={resetAdd} className="flex-1 py-2.5 border border-card-border">
                     {t("nutrition.discard")}
                  </Button>
                  <Button variant="primary" onClick={addPending} className="flex-1 py-2.5">
                     <Plus size={16} /> {t("nutrition.builder.add")}
                  </Button>
               </div>
            </div>
         )}

         {/* Manual entry */}
         {manual && (
            <div className="mt-3 bg-muted/40 border border-card-border rounded-2xl p-4 space-y-2">
               <p className="text-[11px] text-subtle font-medium mb-1">{t("nutrition.builder.manual_hint")}</p>
               <input
                  value={manual.name}
                  onChange={(e) => setManual({ ...manual, name: e.target.value })}
                  placeholder={t("nutrition.builder.name")}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary/40"
               />
               <div className="grid grid-cols-2 gap-2">
                  <ManualField label="g" value={manual.grams} onChange={(v) => setManual({ ...manual, grams: v })} />
                  <ManualField label={t("nutrition.builder.calories")} value={manual.cal} onChange={(v) => setManual({ ...manual, cal: v })} />
                  <ManualField label={t("nutrition.macros.protein")} value={manual.pro} onChange={(v) => setManual({ ...manual, pro: v })} />
                  <ManualField label={t("nutrition.macros.carbs")} value={manual.carb} onChange={(v) => setManual({ ...manual, carb: v })} />
                  <ManualField label={t("nutrition.macros.fat")} value={manual.fat} onChange={(v) => setManual({ ...manual, fat: v })} />
               </div>
               <div className="flex gap-2 pt-1">
                  <Button variant="muted" onClick={resetAdd} className="flex-1 py-2.5 border border-card-border">
                     <X size={16} /> {t("nutrition.discard")}
                  </Button>
                  <Button variant="primary" onClick={addManual} className="flex-1 py-2.5">
                     <Plus size={16} /> {t("nutrition.builder.add")}
                  </Button>
               </div>
            </div>
         )}

         {/* Total + save */}
         {items.length > 0 && (
            <div className="mt-4 pt-4 border-t border-card-border">
               <div className="flex items-center justify-between mb-3">
                  <div>
                     <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">
                        {mealLabel(mealType)} · {t("nutrition.builder.total")}
                     </p>
                     <p className="text-2xl font-display font-extrabold text-primary">
                        {total.cal} <span className="text-base">kcal</span>
                     </p>
                  </div>
                  <div className="text-right text-[11px] font-bold text-subtle">
                     <span>{t("nutrition.macros.protein")} {total.pro}g</span>
                     <br />
                     <span>{t("nutrition.macros.carbs")} {total.carb}g · {t("nutrition.macros.fat")} {total.fat}g</span>
                  </div>
               </div>
               {saveError && <p className="text-xs font-bold text-red-500 mb-2">{saveError}</p>}
               <Button variant="primary" onClick={saveMeal} disabled={saving} className="w-full py-3 flex items-center justify-center gap-2">
                  <Utensils size={18} /> {saving ? t("nutrition.saving") : t("nutrition.builder.save_meal")}
               </Button>
            </div>
         )}

         {items.length === 0 && !pending && !manual && !results && (
            <p className="text-center text-subtle text-xs py-4 font-medium">{t("nutrition.builder.empty")}</p>
         )}
      </section>
   )
}

function ManualField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
   return (
      <div className="bg-card-bg rounded-xl px-3 py-2 border border-card-border flex flex-col">
         <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">{label}</span>
         <input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent font-bold text-sm text-foreground outline-none mt-0.5"
         />
      </div>
   )
}
