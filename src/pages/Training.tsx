import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useStore } from "@/store/useStore"
import type { Routine, RoutineExercise } from "@/store/useStore"
import {
   apiCreateRoutine,
   apiUpdateRoutine,
   apiDeleteRoutine,
   type RoutineExerciseInput,
   type UpsertRoutinePayload,
} from "@/api/routines"
import { apiCreateWorkoutSession, type WorkoutSetInput } from "@/api/workouts"
import { todayLocalISO } from "@/api/client"
import { toast } from "@/components/ui/toast"
import { motion, AnimatePresence } from "framer-motion"
import {
   CheckCircle2,
   Circle,
   Dumbbell,
   Zap,
   Trash2,
   Settings2,
   Save,
   ChevronLeft,
   Plus,
   ChevronDown,
   X,
   Weight,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { useWebHaptics } from "web-haptics/react"
import { Button, Modal } from "@/components/ui"

// ─── Local draft model for editing a routine ────────────────────────────────

type Unit = "reps" | "seg" | "min"

interface DraftExercise {
   key: string
   name: string
   unit: Unit
   value: number
   sets: number
   usesWeight: boolean
   weight: number
   rest: number
}

let draftKeySeq = 0
function newKey(): string {
   draftKeySeq += 1
   return `d${draftKeySeq}`
}

function unitOf(ex: RoutineExercise): Unit {
   if (ex.tracking === "TIME") {
      const s = ex.targetDurationSeconds ?? 0
      return s > 0 && s % 60 === 0 ? "min" : "seg"
   }
   return "reps"
}

function valueOf(ex: RoutineExercise): number {
   if (ex.tracking === "TIME") {
      const s = ex.targetDurationSeconds ?? 0
      return s % 60 === 0 ? s / 60 : s
   }
   return ex.targetReps ?? 0
}

function toDraft(routine: Routine): { name: string; exercises: DraftExercise[] } {
   return {
      name: routine.name,
      exercises: routine.exercises.map((ex) => ({
         key: newKey(),
         name: ex.exerciseName,
         unit: unitOf(ex),
         value: valueOf(ex),
         sets: ex.targetSets,
         usesWeight: ex.usesWeight,
         weight: ex.targetWeight ?? 0,
         rest: ex.restSeconds ?? 0,
      })),
   }
}

function blankExercise(name: string): DraftExercise {
   return {
      key: newKey(),
      name,
      unit: "reps",
      value: 10,
      sets: 3,
      usesWeight: false,
      weight: 0,
      rest: 0,
   }
}

function draftToPayload(
   name: string,
   exercises: DraftExercise[],
   unitSystem: Routine["unitSystem"],
   fallback: { routine: string; exercise: string },
): UpsertRoutinePayload {
   const mapped: RoutineExerciseInput[] = exercises.map((e) => {
      const input: RoutineExerciseInput = {
         exerciseName: e.name.trim() || fallback.exercise,
         tracking: e.unit === "reps" ? "REPS" : "TIME",
         usesWeight: e.usesWeight,
         targetSets: Math.max(1, e.sets),
      }
      if (e.unit === "reps") input.targetReps = Math.max(1, e.value)
      else input.targetDurationSeconds = Math.max(1, e.unit === "min" ? e.value * 60 : e.value)
      if (e.usesWeight && e.weight > 0) input.targetWeight = e.weight
      if (e.rest > 0) input.restSeconds = e.rest
      return input
   })
   return { name: name.trim() || fallback.routine, unitSystem, exercises: mapped }
}

// ─── Display helpers ─────────────────────────────────────────────────────────

function planSummary(ex: RoutineExercise, t: TFunction): string {
   const unit = unitOf(ex)
   const value = valueOf(ex)
   const weight = ex.usesWeight && ex.targetWeight ? ` · ${ex.targetWeight} kg` : ""
   return t("training.plan_summary", {
      sets: ex.targetSets,
      value,
      unit: t(`training.units.${unit}`),
      weight,
   })
}

function exerciseToSets(ex: RoutineExercise): WorkoutSetInput[] {
   return Array.from({ length: ex.targetSets }, () => {
      const s: WorkoutSetInput = { completed: true }
      if (ex.tracking === "REPS" && ex.targetReps) s.reps = ex.targetReps
      else if (ex.tracking === "TIME" && ex.targetDurationSeconds)
         s.durationSeconds = ex.targetDurationSeconds
      else if (ex.tracking === "DISTANCE" && ex.targetDistanceMeters)
         s.distanceMeters = ex.targetDistanceMeters
      if (ex.usesWeight && ex.targetWeight) s.weight = ex.targetWeight
      return s
   })
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TrainingPage() {
   const { trigger } = useWebHaptics()
   const { t } = useTranslation("common")
   const routines = useStore((s) => s.routines)
   const activeRoutineId = useStore((s) => s.activeRoutineId)
   const setActiveRoutine = useStore((s) => s.setActiveRoutine)
   const upsertRoutine = useStore((s) => s.upsertRoutine)
   const removeRoutine = useStore((s) => s.removeRoutine)
   const setWorkoutCompleted = useStore((s) => s.setWorkoutCompleted)
   const workoutCompleted = useStore((s) => s.workoutCompleted)

   const activeRoutine = useMemo(
      () => routines.find((r) => r.id === activeRoutineId) ?? routines[0] ?? null,
      [routines, activeRoutineId],
   )

   // Ephemeral per-session set progress: exerciseId -> boolean[] (length = sets).
   const [progress, setProgress] = useState<Record<string, boolean[]>>({})
   const [showCelebration, setShowCelebration] = useState(false)
   const [saving, setSaving] = useState(false)

   // Edit draft state.
   const [editing, setEditing] = useState(false)
   const [draft, setDraft] = useState<{ name: string; exercises: DraftExercise[] }>({
      name: "",
      exercises: [],
   })

   // Modal (create / confirm).
   const [modal, setModal] = useState<{
      isOpen: boolean
      type: "prompt" | "confirm"
      title: string
      message?: string
      onConfirm: (val?: string) => void
   }>({ isOpen: false, type: "confirm", title: "", onConfirm: () => {} })
   const [modalInput, setModalInput] = useState("")

   // Reset session progress when switching routines or its shape changes.
   useEffect(() => {
      if (!activeRoutine) {
         setProgress({})
         return
      }
      setProgress((prev) => {
         const next: Record<string, boolean[]> = {}
         for (const ex of activeRoutine.exercises) {
            const existing = prev[ex.id]
            next[ex.id] =
               existing && existing.length === ex.targetSets
                  ? existing
                  : Array.from({ length: ex.targetSets }, () => false)
         }
         return next
      })
   }, [activeRoutine])

   useEffect(() => {
      if (showCelebration) {
         const timer = setTimeout(() => setShowCelebration(false), 4000)
         return () => clearTimeout(timer)
      }
   }, [showCelebration])

   const totalSets = activeRoutine
      ? activeRoutine.exercises.reduce((acc, ex) => acc + ex.targetSets, 0)
      : 0
   const completedSets = Object.values(progress).reduce(
      (acc, arr) => acc + arr.filter(Boolean).length,
      0,
   )
   const sessionProgress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0

   // ─── Session ──────────────────────────────────────────────────────────────

   const logSession = async (routine: Routine) => {
      const res = await apiCreateWorkoutSession({
         title: routine.name,
         unitSystem: routine.unitSystem,
         idempotencyKey: `routine-${routine.id}-${todayLocalISO()}`,
         exercises: routine.exercises.map((ex) => ({
            exerciseId: ex.exerciseId ?? undefined,
            exerciseName: ex.exerciseId ? undefined : ex.exerciseName,
            sets: exerciseToSets(ex),
         })),
      })
      if (res.ok) {
         setWorkoutCompleted(true)
         setShowCelebration(true)
         trigger("success")
      } else {
         toast.error(res.message)
      }
   }

   const toggleSet = (exerciseId: string, idx: number) => {
      if (!activeRoutine) return

      const arr = [...(progress[exerciseId] ?? [])]
      arr[idx] = !arr[idx]
      const next = { ...progress, [exerciseId]: arr }
      setProgress(next)
      trigger("nudge")

      // Fire the session log once, outside the state updater (keeping it pure),
      // when every set of every exercise is complete.
      const done = activeRoutine.exercises.every((ex) =>
         (next[ex.id] ?? []).slice(0, ex.targetSets).every(Boolean),
      )
      if (done && !workoutCompleted) void logSession(activeRoutine)
   }

   const resetSession = () => {
      if (!activeRoutine) return
      setProgress(
         Object.fromEntries(
            activeRoutine.exercises.map((ex) => [
               ex.id,
               Array.from({ length: ex.targetSets }, () => false),
            ]),
         ),
      )
   }

   // ─── Create / edit / delete ─────────────────────────────────────────────────

   const handleCreate = () => {
      setModalInput(t("training.new_routine"))
      setModal({
         isOpen: true,
         type: "prompt",
         title: t("training.create_routine"),
         onConfirm: async (val) => {
            setModal((m) => ({ ...m, isOpen: false }))
            const name = (val ?? "").trim()
            if (!name) return
            const res = await apiCreateRoutine({
               name,
               exercises: [
                  { exerciseName: t("training.exercise_n", { n: 1 }), tracking: "REPS", usesWeight: false, targetSets: 3, targetReps: 10 },
               ],
            })
            if (res.ok) {
               upsertRoutine(res.data.routine)
               startEditing(res.data.routine)
            } else {
               toast.error(res.message)
            }
         },
      })
   }

   const startEditing = (routine: Routine) => {
      setDraft(toDraft(routine))
      setEditing(true)
   }

   const handleSaveEdits = async () => {
      if (!activeRoutine || saving) return
      if (draft.exercises.length === 0) return
      setSaving(true)
      const res = await apiUpdateRoutine(
         activeRoutine.id,
         draftToPayload(draft.name, draft.exercises, activeRoutine.unitSystem, {
            routine: t("training.routine_fallback"),
            exercise: t("training.exercise_fallback"),
         }),
      )
      if (res.ok) {
         upsertRoutine(res.data.routine)
         setEditing(false)
         trigger("success")
      } else {
         toast.error(res.message)
      }
      setSaving(false)
   }

   const handleDelete = () => {
      if (!activeRoutine) return
      setModal({
         isOpen: true,
         type: "confirm",
         title: t("training.delete_routine"),
         message: t("training.delete_confirm", { name: activeRoutine.name }),
         onConfirm: async () => {
            setModal((m) => ({ ...m, isOpen: false }))
            const id = activeRoutine.id
            const res = await apiDeleteRoutine(id)
            if (res.ok) removeRoutine(id)
            else toast.error(res.message)
         },
      })
   }

   // Draft mutators
   const updateDraftExercise = (key: string, fields: Partial<DraftExercise>) =>
      setDraft((d) => ({
         ...d,
         exercises: d.exercises.map((e) => (e.key === key ? { ...e, ...fields } : e)),
      }))
   const removeDraftExercise = (key: string) =>
      setDraft((d) => ({ ...d, exercises: d.exercises.filter((e) => e.key !== key) }))
   const addDraftExercise = () =>
      setDraft((d) => ({
         ...d,
         exercises: [...d.exercises, blankExercise(t("training.new_exercise"))],
      }))

   return (
      <div className="p-4 md:p-6 pb-32 animate-fade-in font-sans flex flex-col min-h-screen relative">
         <AnimatePresence>
            {showCelebration && (
               <motion.div
                  initial={{ opacity: 0, y: -40, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                  className="mb-4 w-full bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-[28px] p-4 flex items-center gap-4 shadow-lg shadow-primary/10">
                  <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 text-primary rounded-full flex items-center justify-center shrink-0">
                     <CheckCircle2 size={28} />
                  </div>
                  <div className="flex-1">
                     <h3 className="font-bold text-foreground text-lg">
                        {t("training.celebration_title")}
                     </h3>
                     <p className="text-subtle dark:text-muted-foreground text-sm font-medium">
                        {t("training.celebration_desc")}
                     </p>
                  </div>
                  <button
                     onClick={() => setShowCelebration(false)}
                     className="p-2 rounded-xl hover:bg-primary/10 dark:hover:bg-primary/20 text-primary transition-colors">
                     <ChevronDown size={20} className="rotate-180" />
                  </button>
               </motion.div>
            )}
         </AnimatePresence>

         <header className="mb-6 flex flex-col items-start justify-between">
            <div className="flex items-center gap-2 mb-2">
               <Link
                  to="/"
                  aria-label={t("training.back_home")}
                  className="p-2 bg-muted dark:bg-white/5 rounded-xl">
                  <ChevronLeft size={20} />
               </Link>
               <h1 className="text-3xl font-display font-extrabold text-foreground flex items-center gap-2">
                  <Zap size={32} className="text-primary" /> {t("training.header")}
               </h1>
            </div>

            <div className="flex gap-2 overflow-x-auto w-full pb-2 [&::-webkit-scrollbar]:hidden mt-2 snap-x">
               <button
                  onClick={handleCreate}
                  className="shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm bg-primary/10 text-primary flex items-center gap-2 hover:bg-primary/20 transition-colors snap-start border border-primary/20">
                  <Plus size={16} /> {t("training.create")}
               </button>
               {routines.map((r) => (
                  <button
                     key={r.id}
                     onClick={() => {
                        setEditing(false)
                        setActiveRoutine(r.id)
                     }}
                     className={`shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all snap-start ${activeRoutine?.id === r.id ? "bg-primary text-white shadow-md" : "bg-card-bg/40 text-subtle border border-card-border hover:bg-muted"}`}>
                     {r.name}
                  </button>
               ))}
            </div>
         </header>

         {!activeRoutine ? (
            <div className="flex-1 flex flex-col items-center justify-center text-subtle">
               <Dumbbell size={64} className="mb-4 text-muted-foreground dark:text-white/10" />
               <p className="font-bold text-lg mb-1 text-foreground">{t("training.empty_title")}</p>
               <p className="text-sm mb-6 text-center max-w-xs">
                  {t("training.empty_desc")}
               </p>
               <Button onClick={handleCreate} className="flex items-center gap-2">
                  <Plus size={20} /> {t("training.create_routine")}
               </Button>
            </div>
         ) : editing ? (
            <RoutineEditor
               draft={draft}
               saving={saving}
               onName={(name) => setDraft((d) => ({ ...d, name }))}
               onUpdate={updateDraftExercise}
               onRemove={removeDraftExercise}
               onAdd={addDraftExercise}
               onCancel={() => setEditing(false)}
               onSave={handleSaveEdits}
            />
         ) : (
            <>
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">{activeRoutine.name}</h2>
                  <div className="flex items-center gap-2">
                     {completedSets > 0 && (
                        <button
                           onClick={resetSession}
                           title={t("training.reset_progress")}
                           className="text-primary p-2 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">
                           <Circle size={20} />
                        </button>
                     )}
                     <button
                        onClick={() => startEditing(activeRoutine)}
                        title={t("training.edit_routine")}
                        className="text-subtle p-2 bg-muted dark:bg-white/5 rounded-xl hover:text-foreground transition-colors">
                        <Settings2 size={20} />
                     </button>
                     <button
                        onClick={handleDelete}
                        className="text-red-500 p-2 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 transition-colors">
                        <Trash2 size={20} />
                     </button>
                  </div>
               </div>

               {/* Session progress */}
               <div className="bg-card-bg rounded-[32px] p-5 shadow-sm border border-card-border mb-8 flex items-center gap-5">
                  <div className="w-14 h-14 relative shrink-0">
                     <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <path
                           className="text-muted dark:text-white/5"
                           strokeWidth="4"
                           stroke="currentColor"
                           fill="none"
                           d="M18 2.5 a 15.5 15.5 0 0 1 0 31.0 a 15.5 15.5 0 0 1 0 -31.0"
                        />
                        <motion.path
                           initial={{ pathLength: 0 }}
                           animate={{ pathLength: sessionProgress / 100 }}
                           className="text-primary"
                           strokeWidth="4"
                           strokeLinecap="round"
                           stroke="currentColor"
                           fill="none"
                           d="M18 2.5 a 15.5 15.5 0 0 1 0 31.0 a 15.5 15.5 0 0 1 0 -31.0"
                        />
                     </svg>
                  </div>
                  <div>
                     <span className="block font-bold text-lg text-foreground">
                        {t("training.session_progress")}
                     </span>
                     <span className="text-sm font-bold text-primary">
                        {t("training.sets_completed", { done: completedSets, total: totalSets })}
                     </span>
                  </div>
               </div>

               {/* Exercises */}
               <div className="space-y-4 flex-1">
                  {activeRoutine.exercises.map((ex) => {
                     const sets = progress[ex.id] ?? []
                     const done = sets.length > 0 && sets.every(Boolean)
                     return (
                        <div
                           key={ex.id}
                           className={`rounded-[32px] border-2 transition-all p-5 ${done ? "bg-muted dark:bg-white/5 opacity-70 border-transparent" : "bg-card-bg border-card-border"}`}>
                           <div className="flex items-start justify-between gap-3 mb-4">
                              <div>
                                 <h4 className="font-bold text-lg text-foreground">
                                    {ex.exerciseName}
                                 </h4>
                                 <p className="text-xs text-subtle font-bold mt-1 uppercase tracking-tight flex items-center gap-1.5">
                                    {planSummary(ex, t)}
                                    {ex.usesWeight && (
                                       <Weight size={12} className="text-primary" />
                                    )}
                                 </p>
                              </div>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {Array.from({ length: ex.targetSets }, (_, i) => {
                                 const checked = sets[i]
                                 return (
                                    <button
                                       key={i}
                                       onClick={() => toggleSet(ex.id, i)}
                                       className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm transition-all active:scale-90 ${checked ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-muted dark:bg-white/5 text-subtle hover:text-foreground"}`}>
                                       {checked ? <CheckCircle2 size={18} /> : i + 1}
                                    </button>
                                 )
                              })}
                           </div>
                        </div>
                     )
                  })}
               </div>
            </>
         )}

         <Modal
            isOpen={modal.isOpen}
            onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
            title={modal.title}
            footer={
               <div className="flex gap-3 w-full">
                  <Button
                     variant="muted"
                     className="flex-1 border border-card-border"
                     onClick={() => setModal((m) => ({ ...m, isOpen: false }))}>
                     {t("training.cancel")}
                  </Button>
                  <Button
                     variant="primary"
                     className="flex-1"
                     onClick={() =>
                        modal.type === "prompt"
                           ? modal.onConfirm(modalInput)
                           : modal.onConfirm()
                     }>
                     {t("training.accept")}
                  </Button>
               </div>
            }>
            {modal.type === "confirm" && (
               <p className="text-sm text-subtle font-medium mb-6">{modal.message}</p>
            )}
            {modal.type === "prompt" && (
               <div className="bg-muted dark:bg-white/5 p-4 rounded-2xl border border-card-border mb-6">
                  <input
                     aria-label={t("training.routine_name")}
                     className="w-full bg-transparent font-bold text-foreground outline-none text-base"
                     value={modalInput}
                     onChange={(e) => setModalInput(e.target.value)}
                  />
               </div>
            )}
         </Modal>
      </div>
   )
}

// ─── Editor ──────────────────────────────────────────────────────────────────

interface EditorProps {
   draft: { name: string; exercises: DraftExercise[] }
   saving: boolean
   onName: (name: string) => void
   onUpdate: (key: string, fields: Partial<DraftExercise>) => void
   onRemove: (key: string) => void
   onAdd: () => void
   onCancel: () => void
   onSave: () => void
}

const UNITS: { id: Unit }[] = [{ id: "reps" }, { id: "seg" }, { id: "min" }]

function RoutineEditor({
   draft,
   saving,
   onName,
   onUpdate,
   onRemove,
   onAdd,
   onCancel,
   onSave,
}: EditorProps) {
   const { t } = useTranslation("common")
   return (
      <div className="flex-1 flex flex-col gap-4">
         <input
            aria-label={t("training.routine_name")}
            value={draft.name}
            onChange={(e) => onName(e.target.value)}
            className="w-full bg-card-bg border border-card-border rounded-2xl px-4 py-3 text-xl font-bold text-foreground outline-none focus:border-primary/40"
            placeholder={t("training.routine_name")}
         />

         <div className="space-y-4">
            {draft.exercises.map((ex, idx) => (
               <div
                  key={ex.key}
                  className="rounded-[28px] border border-card-border bg-card-bg p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                     <span className="w-7 h-7 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                     </span>
                     <input
                        aria-label={t("training.exercise_name")}
                        value={ex.name}
                        onChange={(e) => onUpdate(ex.key, { name: e.target.value })}
                        className="flex-1 bg-transparent font-bold text-base text-foreground border-b border-card-border focus:border-primary/40 outline-none pb-1"
                     />
                     <button
                        aria-label={t("training.remove_exercise")}
                        onClick={() => onRemove(ex.key)}
                        className="p-2 rounded-xl text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-colors">
                        <Trash2 size={16} />
                     </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <Field label={t("training.field.series")}>
                        <NumberInput
                           value={ex.sets}
                           min={1}
                           onChange={(v) => onUpdate(ex.key, { sets: v })}
                        />
                     </Field>
                     <Field label={t("training.field.amount")}>
                        <NumberInput
                           value={ex.value}
                           min={1}
                           onChange={(v) => onUpdate(ex.key, { value: v })}
                        />
                     </Field>
                  </div>

                  <div className="rounded-xl border border-card-border overflow-hidden flex">
                     {UNITS.map((u) => (
                        <button
                           key={u.id}
                           onClick={() => onUpdate(ex.key, { unit: u.id })}
                           className={`flex-1 px-3 py-2 font-bold text-xs transition-all ${ex.unit === u.id ? "bg-primary text-white" : "bg-muted/50 dark:bg-white/5 text-foreground hover:bg-muted"}`}>
                           {t(`training.unit_labels.${u.id}`)}
                        </button>
                     ))}
                  </div>

                  {/* Weight (optional) */}
                  <div className="flex items-center justify-between bg-muted/50 dark:bg-white/5 rounded-2xl px-4 py-3">
                     <div className="flex items-center gap-2">
                        <Weight size={16} className="text-primary" />
                        <span className="text-sm font-bold text-foreground">{t("training.uses_weight")}</span>
                     </div>
                     <button
                        role="switch"
                        aria-checked={ex.usesWeight}
                        onClick={() => onUpdate(ex.key, { usesWeight: !ex.usesWeight })}
                        className={`w-11 h-6 rounded-full transition-colors relative ${ex.usesWeight ? "bg-primary" : "bg-muted-foreground"}`}>
                        <span
                           className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${ex.usesWeight ? "left-[22px]" : "left-0.5"}`}
                        />
                     </button>
                  </div>
                  {ex.usesWeight && (
                     <Field label={t("training.field.weight")}>
                        <NumberInput
                           value={ex.weight}
                           min={0}
                           step={0.5}
                           onChange={(v) => onUpdate(ex.key, { weight: v })}
                        />
                     </Field>
                  )}
               </div>
            ))}

            <button
               onClick={onAdd}
               className="w-full py-5 border-2 border-dashed border-card-border text-subtle font-bold rounded-[28px] flex items-center justify-center gap-2 hover:bg-muted dark:hover:bg-white/5 transition-colors active:scale-95">
               <Plus size={20} /> {t("training.add_exercise")}
            </button>
         </div>

         <div className="flex gap-3 sticky bottom-4 mt-2">
            <Button
               variant="muted"
               onClick={onCancel}
               className="flex-1 border border-card-border flex items-center justify-center gap-2">
               <X size={18} /> {t("training.cancel")}
            </Button>
            <Button
               variant="primary"
               disabled={saving || draft.exercises.length === 0}
               onClick={onSave}
               className="flex-1 flex items-center justify-center gap-2">
               <Save size={18} /> {saving ? t("training.saving") : t("training.save")}
            </Button>
         </div>
      </div>
   )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
   return (
      <div className="bg-muted/50 dark:bg-white/5 rounded-xl px-3 py-2 flex flex-col">
         <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">
            {label}
         </span>
         {children}
      </div>
   )
}

function NumberInput({
   value,
   onChange,
   min = 0,
   step = 1,
}: {
   value: number
   onChange: (v: number) => void
   min?: number
   step?: number
}) {
   return (
      <input
         type="number"
         min={min}
         step={step}
         value={value}
         onChange={(e) => {
            const v = parseFloat(e.target.value)
            onChange(Number.isNaN(v) ? min : v)
         }}
         className="w-full bg-transparent font-bold text-base text-foreground outline-none mt-0.5"
      />
   )
}
