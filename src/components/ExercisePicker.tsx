// ─── Full-screen catalog picker for choosing an exercise into a routine ──────

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Dumbbell, Eye, PencilLine, Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
   apiListExercises,
   EXERCISE_DIFFICULTIES,
   MUSCLE_GROUPS,
   type Exercise,
   type ExerciseDifficulty,
   type MuscleGroup,
} from "@/api/workouts"
import { mediaUrl } from "@/api/client"
import ExerciseAnimation from "@/components/ExerciseAnimation"

interface ExercisePickerProps {
   isOpen: boolean
   onClose: () => void
   onSelect: (exercise: Exercise) => void
   onCustom: (name: string) => void
}

function primaryImage(ex: Exercise): string {
   const media = ex.media.find((m) => m.isPrimary) ?? ex.media[0]
   return mediaUrl(media?.url)
}

export default function ExercisePicker({
   isOpen,
   onClose,
   onSelect,
   onCustom,
}: ExercisePickerProps) {
   const { t, i18n } = useTranslation("common")

   const [search, setSearch] = useState("")
   const [muscle, setMuscle] = useState<MuscleGroup | null>(null)
   const [difficulty, setDifficulty] = useState<ExerciseDifficulty | null>(null)
   const [results, setResults] = useState<Exercise[]>([])
   const [loading, setLoading] = useState(false)
   const [customMode, setCustomMode] = useState(false)
   const [customName, setCustomName] = useState("")
   const [preview, setPreview] = useState<Exercise | null>(null)

   const muscleLabel = (value: string) => t(`fitness.muscle.${value.toLowerCase()}`)
   const difficultyLabel = (value: string) => t(`fitness.difficulty.${value.toLowerCase()}`)

   // Reset transient state whenever the picker is (re)opened.
   useEffect(() => {
      if (isOpen) {
         setCustomMode(false)
         setCustomName("")
         setPreview(null)
      }
   }, [isOpen])

   // Debounced, server-side search against the catalog (limit capped at 100 by the platform).
   const reqSeq = useRef(0)
   useEffect(() => {
      if (!isOpen) return

      const seq = ++reqSeq.current
      setLoading(true)
      const timer = setTimeout(async () => {
         const res = await apiListExercises({
            search: search.trim() || undefined,
            muscleGroup: muscle ?? undefined,
            difficulty: difficulty ?? undefined,
            locale: i18n.language,
            limit: 50,
         })
         if (seq !== reqSeq.current) return // a newer query superseded this one
         setResults(res.ok ? res.data.exercises : [])
         setLoading(false)
      }, 300)

      return () => clearTimeout(timer)
   }, [isOpen, search, muscle, difficulty, i18n.language])

   const confirmCustom = () => {
      const name = customName.trim()
      if (!name) return
      onCustom(name)
      onClose()
   }

   const muscles = useMemo(() => MUSCLE_GROUPS, [])

   // Portaled to <body> so the fixed overlay isn't trapped by the page-transition
   // transform (which would position it relative to the page, not the viewport).
   return createPortal(
      <AnimatePresence>
         {isOpen && (
            <motion.div
               role="dialog"
               aria-modal="true"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] bg-background flex flex-col overscroll-contain">
               {/* Header */}
               <div className="p-4 border-b border-card-border flex items-center gap-3">
                  <button
                     onClick={onClose}
                     aria-label={t("training.cancel")}
                     className="p-2 rounded-xl bg-muted dark:bg-white/5 text-foreground shrink-0">
                     <X size={20} />
                  </button>
                  <h2 className="text-xl font-display font-extrabold text-foreground flex-1">
                     {t("training.pick_exercise")}
                  </h2>
               </div>

               {/* Search */}
               <div className="p-4 pb-2">
                  <div className="flex items-center gap-2 bg-card-bg border border-card-border rounded-2xl px-4 py-3">
                     <Search size={18} className="text-subtle shrink-0" />
                     <input
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("training.search_exercise")}
                        className="flex-1 bg-transparent outline-none font-medium text-foreground"
                     />
                     {search && (
                        <button onClick={() => setSearch("")} aria-label={t("training.cancel")}>
                           <X size={16} className="text-subtle" />
                        </button>
                     )}
                  </div>
               </div>

               {/* Difficulty segmented filter */}
               <div className="px-4 flex gap-2">
                  <FilterChip active={difficulty === null} onClick={() => setDifficulty(null)}>
                     {t("training.all_filter")}
                  </FilterChip>
                  {EXERCISE_DIFFICULTIES.map((d) => (
                     <FilterChip
                        key={d}
                        active={difficulty === d}
                        onClick={() => setDifficulty(difficulty === d ? null : d)}>
                        {difficultyLabel(d)}
                     </FilterChip>
                  ))}
               </div>

               {/* Muscle filter chips */}
               <div className="px-4 py-2 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden snap-x">
                  <FilterChip active={muscle === null} onClick={() => setMuscle(null)}>
                     {t("training.filter_muscle")}: {t("training.all_filter")}
                  </FilterChip>
                  {muscles.map((m) => (
                     <FilterChip
                        key={m}
                        active={muscle === m}
                        onClick={() => setMuscle(muscle === m ? null : m)}>
                        {muscleLabel(m)}
                     </FilterChip>
                  ))}
               </div>

               {/* Custom exercise */}
               <div className="px-4 py-2">
                  {customMode ? (
                     <div className="flex items-center gap-2 bg-card-bg border border-primary/40 rounded-2xl px-3 py-2">
                        <PencilLine size={18} className="text-primary shrink-0" />
                        <input
                           autoFocus
                           value={customName}
                           onChange={(e) => setCustomName(e.target.value)}
                           onKeyDown={(e) => e.key === "Enter" && confirmCustom()}
                           placeholder={t("training.exercise_name")}
                           className="flex-1 bg-transparent outline-none font-bold text-foreground"
                        />
                        <button
                           onClick={confirmCustom}
                           className="p-2 rounded-xl bg-primary text-white">
                           <Check size={16} />
                        </button>
                     </div>
                  ) : (
                     <button
                        onClick={() => setCustomMode(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-card-border text-subtle font-bold text-sm hover:bg-muted dark:hover:bg-white/5 transition-colors">
                        <PencilLine size={16} /> {t("training.custom_exercise")}
                     </button>
                  )}
               </div>

               {/* Results */}
               <div className="flex-1 overflow-y-auto px-4 pb-8 pt-1">
                  {loading ? (
                     <p className="text-center text-subtle text-sm py-10 font-medium">
                        {t("training.loading_catalog")}
                     </p>
                  ) : results.length === 0 ? (
                     <div className="flex flex-col items-center text-subtle py-12">
                        <Dumbbell size={48} className="mb-3 text-muted-foreground dark:text-white/10" />
                        <p className="font-bold text-sm">{t("training.no_results")}</p>
                     </div>
                  ) : (
                     <div className="flex flex-col gap-2 max-w-2xl mx-auto">
                        {results.map((ex) => {
                           const img = primaryImage(ex)
                           return (
                              <div
                                 key={ex.id}
                                 className="flex items-center gap-3 rounded-2xl border border-card-border bg-card-bg p-2 pr-2.5 hover:border-primary/40 transition-colors">
                                 <button
                                    onClick={() => {
                                       onSelect(ex)
                                       onClose()
                                    }}
                                    className="flex items-center gap-3 flex-1 min-w-0 text-left active:scale-[0.99] transition-transform">
                                    <div className="w-14 h-14 shrink-0 rounded-xl bg-muted dark:bg-white/5 flex items-center justify-center overflow-hidden">
                                       {img ? (
                                          <img src={img} alt={ex.name} loading="lazy" className="w-full h-full object-cover" />
                                       ) : (
                                          <Dumbbell size={22} className="text-muted-foreground dark:text-white/10" />
                                       )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                       <p className="font-bold text-sm text-foreground leading-tight truncate">
                                          {ex.name}
                                       </p>
                                       <p className="text-[11px] text-subtle font-bold uppercase tracking-tight mt-0.5 truncate">
                                          {muscleLabel(ex.primaryMuscleGroup)} · {difficultyLabel(ex.difficulty)}
                                       </p>
                                    </div>
                                 </button>
                                 {img && (
                                    <button
                                       onClick={() => setPreview(ex)}
                                       aria-label={ex.name}
                                       className="p-2.5 shrink-0 rounded-xl bg-muted/60 dark:bg-white/5 text-subtle hover:text-primary hover:bg-primary/10 transition-colors">
                                       <Eye size={18} />
                                    </button>
                                 )}
                              </div>
                           )
                        })}
                     </div>
                  )}
               </div>

               {/* Image preview lightbox (on-demand full demo images) */}
               <AnimatePresence>
                  {preview && (
                     <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreview(null)}
                        className="absolute inset-0 z-10 bg-black/90 flex flex-col">
                        <div
                           className="p-4 flex items-center gap-3"
                           onClick={(e) => e.stopPropagation()}>
                           <button
                              onClick={() => setPreview(null)}
                              aria-label={t("training.cancel")}
                              className="p-2 rounded-xl bg-white/10 text-white shrink-0">
                              <X size={20} />
                           </button>
                           <h3 className="text-white font-bold text-lg flex-1 truncate">
                              {preview.name}
                           </h3>
                        </div>
                        <div
                           className="flex-1 min-h-0 px-4 flex flex-col items-center justify-center gap-3"
                           onClick={(e) => e.stopPropagation()}>
                           <ExerciseAnimation
                              contain
                              images={preview.media.map((m) => mediaUrl(m.url))}
                              alt={preview.name}
                              className="w-full max-w-md flex-1 min-h-0 max-h-[65vh] rounded-2xl"
                           />
                           <p className="text-white/50 text-xs font-medium shrink-0">
                              {muscleLabel(preview.primaryMuscleGroup)} · {difficultyLabel(preview.difficulty)}
                           </p>
                        </div>
                        <div className="p-4" onClick={(e) => e.stopPropagation()}>
                           <button
                              onClick={() => {
                                 onSelect(preview)
                                 onClose()
                              }}
                              className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                              <Check size={18} /> {t("training.pick_exercise")}
                           </button>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </motion.div>
         )}
      </AnimatePresence>,
      document.body,
   )
}

function FilterChip({
   active,
   onClick,
   children,
}: {
   active: boolean
   onClick: () => void
   children: React.ReactNode
}) {
   return (
      <button
         onClick={onClick}
         className={`shrink-0 px-3.5 py-2 rounded-xl font-bold text-xs transition-all snap-start ${active ? "bg-primary text-white shadow-sm" : "bg-card-bg/40 text-subtle border border-card-border hover:bg-muted"}`}>
         {children}
      </button>
   )
}
