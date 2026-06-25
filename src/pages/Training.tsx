import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useStore } from "@/store/useStore"
import type { Routine, RoutineExercise, RoutineSet } from "@/store/useStore"
import {
   apiCreateRoutine,
   apiUpdateRoutine,
   apiDeleteRoutine,
   type RoutineExerciseInput,
   type RoutineSetInput,
   type UpsertRoutinePayload,
} from "@/api/routines"
import { apiCreateWorkoutSession, apiListExercises, type Exercise, type WorkoutSetInput } from "@/api/workouts"
import { mediaUrl, todayLocalISO } from "@/api/client"
import { toast } from "@/components/ui/toast"
import ExercisePicker from "@/components/ExercisePicker"
import ExerciseAnimation from "@/components/ExerciseAnimation"
import WorkoutHistory from "@/components/WorkoutHistory"
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
   Search,
   X,
   Weight,
   SlidersHorizontal,
   Eye,
   Timer,
   History,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { useWebHaptics } from "web-haptics/react"
import { Button, Modal } from "@/components/ui"

// ─── Local draft model for editing a routine ────────────────────────────────

type Unit = "reps" | "seg" | "min" | "m" | "km"

interface DraftSet {
   key: string
   /** Reps / seconds (or minutes) / meters (or km) depending on the exercise unit. */
   value: number
   weight: number
   rir: number | null
   rpe: number | null
   tempo: string
}

interface DraftExercise {
   key: string
   name: string
   /** Catalog exercise id when picked from the catalog; null for custom free-text exercises. */
   exerciseId: string | null
   imageUrl: string | null
   muscleGroup: string | null
   unit: Unit
   usesWeight: boolean
   rest: number
   notes: string
   sets: DraftSet[]
   /** UI-only: reveal the optional intensity fields (RIR/RPE/tempo) + rest/notes. */
   showAdvanced: boolean
}

let draftKeySeq = 0
function newKey(): string {
   draftKeySeq += 1
   return `d${draftKeySeq}`
}

function parseNum(raw: string, fallback: number): number {
   const n = parseFloat(raw)
   return Number.isNaN(n) ? fallback : n
}

// ─── Unit helpers (tracking lives on the exercise; value lives on each set) ──

/**
 * Per-set rows for an exercise. Routines persisted before the per-set model (or
 * still loading from the cache) have no `sets`, so synthesize them from the
 * aggregate target* fields to stay crash-safe until the API refresh lands.
 */
function setsOf(ex: RoutineExercise): RoutineSet[] {
   if (ex.sets && ex.sets.length > 0) return ex.sets
   const count = Math.max(1, ex.targetSets ?? 1)
   return Array.from({ length: count }, (_, i) => ({
      id: `${ex.id}-agg-${i + 1}`,
      orderIndex: i + 1,
      targetReps: ex.targetReps,
      targetDurationSeconds: ex.targetDurationSeconds,
      targetDistanceMeters: ex.targetDistanceMeters,
      targetWeight: ex.targetWeight,
      targetWeightKg: ex.targetWeightKg,
      rir: null,
      rpe: null,
      tempo: null,
   }))
}

function unitForExercise(ex: RoutineExercise): Unit {
   const sets = setsOf(ex)
   if (ex.tracking === "DURATION") {
      const s = sets[0]?.targetDurationSeconds ?? ex.targetDurationSeconds ?? 0
      return s > 0 && s % 60 === 0 ? "min" : "seg"
   }
   if (ex.tracking === "DISTANCE") {
      const m = sets[0]?.targetDistanceMeters ?? ex.targetDistanceMeters ?? 0
      return m >= 1000 && m % 1000 === 0 ? "km" : "m"
   }
   return "reps"
}

function setDisplayValue(set: RoutineSet, tracking: RoutineExercise["tracking"], unit: Unit): number {
   if (tracking === "DURATION") {
      const s = set.targetDurationSeconds ?? 0
      return unit === "min" && s % 60 === 0 ? s / 60 : s
   }
   if (tracking === "DISTANCE") {
      const m = set.targetDistanceMeters ?? 0
      return unit === "km" && m % 1000 === 0 ? m / 1000 : m
   }
   return set.targetReps ?? 0
}

function toDraft(routine: Routine): { name: string; exercises: DraftExercise[] } {
   return {
      name: routine.name,
      exercises: routine.exercises.map((ex) => {
         const unit = unitForExercise(ex)
         const exSets = setsOf(ex)
         const hasAdvanced = exSets.some((s) => s.rir != null || s.rpe != null || (s.tempo ?? "") !== "")
            || (ex.restSeconds ?? 0) > 0
            || (ex.notes ?? "") !== ""
         const sets: DraftSet[] = exSets.map((s) => ({
            key: newKey(),
            value: setDisplayValue(s, ex.tracking, unit),
            weight: s.targetWeight ?? 0,
            rir: s.rir ?? null,
            rpe: s.rpe ?? null,
            tempo: s.tempo ?? "",
         }))
         return {
            key: newKey(),
            name: ex.exerciseName,
            exerciseId: ex.exerciseId,
            imageUrl: mediaUrl(ex.imageUrl),
            muscleGroup: null,
            unit,
            usesWeight: ex.usesWeight,
            rest: ex.restSeconds ?? 0,
            notes: ex.notes ?? "",
            sets,
            showAdvanced: hasAdvanced,
         }
      }),
   }
}

function freshSet(template?: DraftSet): DraftSet {
   return {
      key: newKey(),
      value: template?.value ?? 10,
      weight: template?.weight ?? 0,
      rir: template?.rir ?? null,
      rpe: template?.rpe ?? null,
      tempo: template?.tempo ?? "",
   }
}

function draftFromExercise(ex: Exercise): DraftExercise {
   const media = ex.media.find((m) => m.isPrimary) ?? ex.media[0]
   return {
      key: newKey(),
      name: ex.name,
      exerciseId: ex.id,
      imageUrl: mediaUrl(media?.url),
      muscleGroup: ex.primaryMuscleGroup,
      unit: "reps",
      usesWeight: false,
      rest: 0,
      notes: "",
      sets: [freshSet(), freshSet(), freshSet()],
      showAdvanced: false,
   }
}

function draftFromCustom(name: string): DraftExercise {
   return {
      key: newKey(),
      name,
      exerciseId: null,
      imageUrl: null,
      muscleGroup: null,
      unit: "reps",
      usesWeight: false,
      rest: 0,
      notes: "",
      sets: [freshSet(), freshSet(), freshSet()],
      showAdvanced: false,
   }
}

function draftToPayload(
   name: string,
   exercises: DraftExercise[],
   unitSystem: Routine["unitSystem"],
   fallback: { routine: string; exercise: string },
): UpsertRoutinePayload {
   const mapped: RoutineExerciseInput[] = exercises.map((e) => {
      const tracking = e.unit === "reps" ? "REPS" : e.unit === "m" || e.unit === "km" ? "DISTANCE" : "DURATION"
      const sets: RoutineSetInput[] = e.sets.map((s) => {
         const set: RoutineSetInput = {}
         if (tracking === "REPS") set.targetReps = Math.max(1, Math.round(s.value))
         else if (tracking === "DURATION") set.targetDurationSeconds = Math.max(1, Math.round(e.unit === "min" ? s.value * 60 : s.value))
         else set.targetDistanceMeters = Math.max(1, e.unit === "km" ? s.value * 1000 : s.value)
         if (e.usesWeight && s.weight > 0) set.targetWeight = s.weight
         if (s.rir != null) set.rir = s.rir
         if (s.rpe != null) set.rpe = s.rpe
         if (s.tempo.trim()) set.tempo = s.tempo.trim()
         return set
      })
      const input: RoutineExerciseInput = {
         exerciseName: e.name.trim() || fallback.exercise,
         tracking,
         usesWeight: e.usesWeight,
         sets: sets.length > 0 ? sets : [{ targetReps: 1 }],
      }
      if (e.exerciseId) input.exerciseId = e.exerciseId
      if (e.rest > 0) input.restSeconds = e.rest
      if (e.notes.trim()) input.notes = e.notes.trim()
      return input
   })
   return { name: name.trim() || fallback.routine, unitSystem, exercises: mapped }
}

// ─── Display helpers ─────────────────────────────────────────────────────────

/** Joins per-set values: "10" when all equal, "12/10/8" when they vary. */
function uniqueJoin(values: number[]): string {
   if (values.length === 0) return "0"
   const allSame = values.every((v) => v === values[0])
   return allSame ? String(values[0]) : values.join("/")
}

function planSummary(ex: RoutineExercise, t: TFunction): string {
   const unit = unitForExercise(ex)
   const sets = setsOf(ex)
   const count = sets.length
   const valueStr = uniqueJoin(sets.map((s) => setDisplayValue(s, ex.tracking, unit)))

   let tail = ""
   if (ex.usesWeight) {
      const weights = sets.map((s) => s.targetWeight).filter((w): w is number => w != null && w > 0)
      if (weights.length > 0) {
         const min = Math.min(...weights)
         const max = Math.max(...weights)
         tail += ` · ${min === max ? min : `${min}-${max}`} kg`
      }
   }
   const rirs = sets.map((s) => s.rir).filter((r): r is number => r != null)
   if (rirs.length > 0) tail += ` · RIR ${uniqueJoin(rirs)}`

   return t("training.plan_summary", {
      sets: count,
      value: valueStr,
      unit: t(`training.units.${unit}`),
      weight: tail,
   })
}

function completedSetsToInput(ex: RoutineExercise, doneSets: RoutineSet[]): WorkoutSetInput[] {
   return doneSets.map((set) => {
      const s: WorkoutSetInput = { completed: true }
      if (ex.tracking === "REPS" && set.targetReps) s.reps = set.targetReps
      else if (ex.tracking === "DURATION" && set.targetDurationSeconds) s.durationSeconds = set.targetDurationSeconds
      else if (ex.tracking === "DISTANCE" && set.targetDistanceMeters) s.distanceMeters = set.targetDistanceMeters
      if (ex.usesWeight && set.targetWeight) s.weight = set.targetWeight
      return s
   })
}

/** Stable session-progress key: routine id survives a PUT (only exercise ids are
 * regenerated), so keying by orderIndex preserves checks when editing/adding. */
function progressKey(routineId: string, orderIndex: number): string {
   return `${routineId}#${orderIndex}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TrainingPage() {
   const { trigger } = useWebHaptics()
   const { t, i18n } = useTranslation("common")
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

   // Ephemeral per-session set progress: `${routineId}#${orderIndex}` -> boolean[].
   const [progress, setProgress] = useState<Record<string, boolean[]>>({})
   const [showCelebration, setShowCelebration] = useState(false)
   const [saving, setSaving] = useState(false)
   // Saved-view UX: which exercise card is expanded (per-set detail) + image preview.
   const [expandedId, setExpandedId] = useState<string | null>(null)
   const [preview, setPreview] = useState<{ name: string; images: string[] } | null>(null)
   // Routines view vs workout history view (kept separate to avoid confusion).
   const [showHistory, setShowHistory] = useState(false)
   // Routines already logged this visit, so a saved routine can be reset without
   // immediately re-logging, and each routine is gated independently.
   const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

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

   // Reset session progress when switching routines or its shape changes. Keyed
   // by routineId#orderIndex so it survives saves that regenerate exercise ids.
   useEffect(() => {
      if (!activeRoutine) {
         setProgress({})
         return
      }
      setProgress((prev) => {
         const next: Record<string, boolean[]> = {}
         for (const ex of activeRoutine.exercises) {
            const key = progressKey(activeRoutine.id, ex.orderIndex)
            const len = setsOf(ex).length
            const existing = prev[key]
            if (existing) {
               // Preserve overlapping checks (e.g. when a set is added/removed).
               next[key] = Array.from({ length: len }, (_, i) => existing[i] ?? false)
            } else {
               next[key] = Array.from({ length: len }, () => false)
            }
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
      ? activeRoutine.exercises.reduce((acc, ex) => acc + (setsOf(ex).length), 0)
      : 0
   const completedSets = Object.values(progress).reduce(
      (acc, arr) => acc + arr.filter(Boolean).length,
      0,
   )
   const sessionProgress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0

   // ─── Session ──────────────────────────────────────────────────────────────

   // Logs only the sets the user actually checked, so a workout can be saved even
   // if it wasn't finished. Reads an explicit progress map (state may not have
   // flushed yet when called right after toggling a set).
   const logSession = async (routine: Routine, prog: Record<string, boolean[]>) => {
      const exercises = routine.exercises
         .map((ex) => {
            const flags = prog[progressKey(routine.id, ex.orderIndex)] ?? []
            const doneSets = setsOf(ex).filter((_, i) => flags[i])
            return { ex, doneSets }
         })
         .filter(({ doneSets }) => doneSets.length > 0)
         .map(({ ex, doneSets }) => ({
            exerciseId: ex.exerciseId ?? undefined,
            exerciseName: ex.exerciseId ? undefined : ex.exerciseName,
            sets: completedSetsToInput(ex, doneSets),
         }))

      if (exercises.length === 0) return

      const res = await apiCreateWorkoutSession({
         title: routine.name,
         unitSystem: routine.unitSystem,
         idempotencyKey: `routine-${routine.id}-${todayLocalISO()}`,
         exercises,
      })
      if (res.ok) {
         setSavedIds((prev) => new Set(prev).add(routine.id))
         setWorkoutCompleted(true)
         setShowCelebration(true)
         trigger("success")
         // Clear the routine's checks so it isn't left stuck "finished".
         setProgress((prev) => {
            const next = { ...prev }
            for (const ex of routine.exercises) {
               next[progressKey(routine.id, ex.orderIndex)] = Array.from(
                  { length: setsOf(ex).length },
                  () => false,
               )
            }
            return next
         })
      } else {
         toast.error(res.message)
      }
   }

   const toggleSet = (orderIndex: number, idx: number) => {
      if (!activeRoutine) return

      const key = progressKey(activeRoutine.id, orderIndex)
      const arr = [...(progress[key] ?? [])]
      arr[idx] = !arr[idx]
      const next = { ...progress, [key]: arr }
      setProgress(next)
      trigger("nudge")

      // Auto-save once everything is complete (the manual button covers partials).
      const done = activeRoutine.exercises.every((ex) => {
         const exKey = progressKey(activeRoutine.id, ex.orderIndex)
         const len = setsOf(ex).length
         return (next[exKey] ?? []).slice(0, len).length === len
            && (next[exKey] ?? []).slice(0, len).every(Boolean)
      })
      if (done && !savedIds.has(activeRoutine.id)) void logSession(activeRoutine, next)
   }

   const handleFinish = () => {
      if (!activeRoutine || savedIds.has(activeRoutine.id)) return
      void logSession(activeRoutine, progress)
   }

   const resetSession = () => {
      if (!activeRoutine) return
      setProgress(
         Object.fromEntries(
            activeRoutine.exercises.map((ex) => [
               progressKey(activeRoutine.id, ex.orderIndex),
               Array.from({ length: setsOf(ex).length }, () => false),
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
                  {
                     exerciseName: t("training.exercise_n", { n: 1 }),
                     tracking: "REPS",
                     usesWeight: false,
                     sets: [{ targetReps: 10 }, { targetReps: 10 }, { targetReps: 10 }],
                  },
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
   const updateDraftSet = (exKey: string, setKey: string, fields: Partial<DraftSet>) =>
      setDraft((d) => ({
         ...d,
         exercises: d.exercises.map((e) =>
            e.key === exKey
               ? { ...e, sets: e.sets.map((s) => (s.key === setKey ? { ...s, ...fields } : s)) }
               : e,
         ),
      }))
   const addDraftSet = (exKey: string) =>
      setDraft((d) => ({
         ...d,
         exercises: d.exercises.map((e) =>
            e.key === exKey ? { ...e, sets: [...e.sets, freshSet(e.sets[e.sets.length - 1])] } : e,
         ),
      }))
   const removeDraftSet = (exKey: string, setKey: string) =>
      setDraft((d) => ({
         ...d,
         exercises: d.exercises.map((e) =>
            e.key === exKey && e.sets.length > 1
               ? { ...e, sets: e.sets.filter((s) => s.key !== setKey) }
               : e,
         ),
      }))

   // Picker target: "add" appends a new exercise, "replace" swaps an existing row.
   const [picker, setPicker] = useState<{ mode: "add" } | { mode: "replace"; key: string } | null>(
      null,
   )
   const applyPicked = (draftEx: DraftExercise) => {
      setDraft((d) => {
         if (picker?.mode === "replace") {
            const key = picker.key
            return {
               ...d,
               exercises: d.exercises.map((e) =>
                  e.key === key
                     ? { ...e, name: draftEx.name, exerciseId: draftEx.exerciseId, imageUrl: draftEx.imageUrl, muscleGroup: draftEx.muscleGroup }
                     : e,
               ),
            }
         }
         return { ...d, exercises: [...d.exercises, draftEx] }
      })
   }
   const onPickerSelect = (ex: Exercise) => applyPicked(draftFromExercise(ex))
   const onPickerCustom = (name: string) => applyPicked(draftFromCustom(name))

   // Opens the looping image preview. Shows whatever images the routine already
   // carries instantly, then upgrades to the full catalog media (multiple frames
   // → animated) by resolving the linked catalog exercise on the fly.
   const openPreview = async (ex: RoutineExercise, fallbackImages: string[]) => {
      if (fallbackImages.length === 0 && !ex.exerciseId) return
      setPreview({ name: ex.exerciseName, images: fallbackImages })
      if (!ex.exerciseId) return
      const res = await apiListExercises({
         search: ex.exerciseName,
         locale: i18n.language,
         limit: 50,
      })
      if (!res.ok) return
      const match = res.data.exercises.find((e) => e.id === ex.exerciseId)
      const images = match?.media.map((m) => mediaUrl(m.url)).filter(Boolean) ?? []
      if (images.length > 0) {
         setPreview((prev) => (prev ? { ...prev, images } : prev))
      }
   }

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

            {/* Rutinas vs Historial — separate views to keep things clear. */}
            <div className="flex gap-2 w-full mt-1 mb-1">
               <button
                  onClick={() => {
                     setShowHistory(false)
                     setEditing(false)
                  }}
                  className={`flex-1 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${!showHistory ? "bg-primary text-white shadow-sm" : "bg-card-bg/40 text-subtle border border-card-border hover:bg-muted"}`}>
                  <Zap size={16} /> {t("training.tab_routines")}
               </button>
               <button
                  onClick={() => {
                     setShowHistory(true)
                     setEditing(false)
                  }}
                  className={`flex-1 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${showHistory ? "bg-primary text-white shadow-sm" : "bg-card-bg/40 text-subtle border border-card-border hover:bg-muted"}`}>
                  <History size={16} /> {t("training.tab_history")}
               </button>
            </div>

            {!showHistory && (
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
            )}
         </header>

         {showHistory ? (
            <WorkoutHistory />
         ) : !activeRoutine ? (
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
               onUpdateSet={updateDraftSet}
               onAddSet={addDraftSet}
               onRemoveSet={removeDraftSet}
               onAdd={() => setPicker({ mode: "add" })}
               onPick={(key) => setPicker({ mode: "replace", key })}
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
                     const key = progressKey(activeRoutine.id, ex.orderIndex)
                     const sets = progress[key] ?? []
                     const exSets = setsOf(ex)
                     const setCount = exSets.length
                     const done = sets.length > 0 && sets.slice(0, setCount).every(Boolean)
                     const unit = unitForExercise(ex)
                     // Prefer the full image set (animated preview); fall back to the
                     // single primary image so the preview still opens before the
                     // platform redeploy that adds imageUrls.
                     const allImages = (ex.imageUrls ?? []).map((u) => mediaUrl(u)).filter(Boolean)
                     const primary = mediaUrl(ex.imageUrl)
                     const images = allImages.length > 0 ? allImages : primary ? [primary] : []
                     const img = images[0] ?? ""
                     const isExpanded = expandedId === ex.id
                     return (
                        <div
                           key={ex.id}
                           className={`rounded-[32px] border-2 transition-all p-5 ${done ? "bg-muted dark:bg-white/5 opacity-70 border-transparent" : "bg-card-bg border-card-border"}`}>
                           <div className="flex items-start gap-3 mb-4">
                              <button
                                 onClick={() => void openPreview(ex, images)}
                                 disabled={images.length === 0 && !ex.exerciseId}
                                 aria-label={ex.exerciseName}
                                 className="w-12 h-12 shrink-0 rounded-2xl bg-muted dark:bg-white/5 overflow-hidden flex items-center justify-center relative group">
                                 {img ? (
                                    <>
                                       <img src={img} alt={ex.exerciseName} loading="lazy" className="w-full h-full object-cover" />
                                       <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center">
                                          <Eye size={16} className="text-white" />
                                       </span>
                                    </>
                                 ) : (
                                    <Dumbbell size={20} className="text-muted-foreground dark:text-white/20" />
                                 )}
                              </button>
                              <button
                                 onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                                 className="min-w-0 flex-1 text-left flex items-start gap-2">
                                 <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-lg text-foreground leading-tight">
                                       {ex.exerciseName}
                                    </h4>
                                    <p className="text-xs text-subtle font-bold mt-1 uppercase tracking-tight flex items-center gap-1.5">
                                       {planSummary(ex, t)}
                                       {ex.usesWeight && <Weight size={12} className="text-primary" />}
                                    </p>
                                 </div>
                                 <ChevronDown
                                    size={18}
                                    className={`text-subtle shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                 />
                              </button>
                           </div>

                           {/* Expanded read-only per-set detail */}
                           <AnimatePresence initial={false}>
                              {isExpanded && (
                                 <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                       {exSets.map((s, i) => (
                                          <div
                                             key={s.id}
                                             className="flex items-center gap-2 text-sm bg-muted/50 dark:bg-white/5 rounded-xl px-3 py-2">
                                             <span className="w-6 h-6 shrink-0 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                                {i + 1}
                                             </span>
                                             <span className="font-bold text-foreground">
                                                {setDisplayValue(s, ex.tracking, unit)} {t(`training.units.${unit}`)}
                                             </span>
                                             {ex.usesWeight && s.targetWeight != null && s.targetWeight > 0 && (
                                                <span className="font-bold text-primary">· {s.targetWeight} kg</span>
                                             )}
                                             <span className="flex-1" />
                                             {s.rir != null && (
                                                <SetTag label={t("training.field.rir")} value={s.rir} />
                                             )}
                                             {s.rpe != null && (
                                                <SetTag label={t("training.field.rpe")} value={s.rpe} />
                                             )}
                                             {s.tempo && (
                                                <SetTag label={t("training.field.tempo")} value={s.tempo} />
                                             )}
                                          </div>
                                       ))}
                                       {ex.restSeconds != null && ex.restSeconds > 0 && (
                                          <p className="text-xs text-subtle font-bold px-1 pt-1 flex items-center gap-1.5 uppercase tracking-tight">
                                             <Timer size={13} className="text-primary" />
                                             {t("training.field.rest")}: {ex.restSeconds}s
                                          </p>
                                       )}
                                       {ex.notes && (
                                          <p className="text-xs text-subtle font-medium px-1 pt-1 italic">
                                             {ex.notes}
                                          </p>
                                       )}
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>

                           <div className="flex flex-wrap gap-2">
                              {Array.from({ length: setCount }, (_, i) => {
                                 const checked = sets[i]
                                 return (
                                    <button
                                       key={i}
                                       onClick={() => toggleSet(ex.orderIndex, i)}
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

               {/* Save what you did — works even with sets left unfinished. */}
               {completedSets > 0 && (
                  <div className="sticky bottom-4 mt-4">
                     <Button
                        variant="primary"
                        onClick={handleFinish}
                        disabled={activeRoutine ? savedIds.has(activeRoutine.id) : true}
                        className="w-full flex items-center justify-center gap-2">
                        <Save size={18} />
                        {activeRoutine && savedIds.has(activeRoutine.id)
                           ? t("training.workout_saved")
                           : t("training.finish_workout", { done: completedSets, total: totalSets })}
                     </Button>
                  </div>
               )}
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

         <ExercisePicker
            isOpen={picker !== null}
            onClose={() => setPicker(null)}
            onSelect={onPickerSelect}
            onCustom={onPickerCustom}
         />

         {/* Animated image preview (the looping "gif") for a saved exercise. */}
         <AnimatePresence>
            {preview && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setPreview(null)}
                  className="fixed inset-0 z-50 bg-black/90 flex flex-col">
                  <div className="p-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                     <button
                        onClick={() => setPreview(null)}
                        aria-label={t("training.cancel")}
                        className="p-2 rounded-xl bg-white/10 text-white shrink-0">
                        <X size={20} />
                     </button>
                     <h3 className="text-white font-bold text-lg flex-1 truncate">{preview.name}</h3>
                  </div>
                  <div
                     className="flex-1 min-h-0 px-4 pb-4 flex flex-col items-center justify-center"
                     onClick={(e) => e.stopPropagation()}>
                     <ExerciseAnimation
                        contain
                        images={preview.images}
                        alt={preview.name}
                        className="w-full max-w-md h-full max-h-[70vh] rounded-2xl"
                     />
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   )
}

function SetTag({ label, value }: { label: string; value: string | number }) {
   return (
      <span className="text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-md bg-primary/10 text-primary shrink-0">
         {label} {value}
      </span>
   )
}

// ─── Editor ──────────────────────────────────────────────────────────────────

interface EditorProps {
   draft: { name: string; exercises: DraftExercise[] }
   saving: boolean
   onName: (name: string) => void
   onUpdate: (key: string, fields: Partial<DraftExercise>) => void
   onRemove: (key: string) => void
   onUpdateSet: (exKey: string, setKey: string, fields: Partial<DraftSet>) => void
   onAddSet: (exKey: string) => void
   onRemoveSet: (exKey: string, setKey: string) => void
   onAdd: () => void
   onPick: (key: string) => void
   onCancel: () => void
   onSave: () => void
}

const UNITS: { id: Unit }[] = [
   { id: "reps" },
   { id: "seg" },
   { id: "min" },
   { id: "m" },
   { id: "km" },
]

function RoutineEditor({
   draft,
   saving,
   onName,
   onUpdate,
   onRemove,
   onUpdateSet,
   onAddSet,
   onRemoveSet,
   onAdd,
   onPick,
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
                     <button
                        onClick={() => onPick(ex.key)}
                        className="flex-1 flex items-center gap-3 min-w-0 text-left rounded-xl hover:bg-muted/50 dark:hover:bg-white/5 transition-colors p-1 -m-1">
                        <div className="w-11 h-11 shrink-0 rounded-xl bg-muted dark:bg-white/5 overflow-hidden flex items-center justify-center">
                           {ex.imageUrl ? (
                              <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" />
                           ) : (
                              <Dumbbell size={18} className="text-muted-foreground dark:text-white/20" />
                           )}
                        </div>
                        <div className="min-w-0 flex-1">
                           <p className="font-bold text-base text-foreground truncate">{ex.name}</p>
                           <p className="text-[11px] text-subtle font-bold uppercase tracking-tight flex items-center gap-1">
                              {ex.muscleGroup
                                 ? t(`fitness.muscle.${ex.muscleGroup.toLowerCase()}`)
                                 : t("training.change_exercise")}
                              <Search size={11} />
                           </p>
                        </div>
                     </button>
                     <button
                        aria-label={t("training.remove_exercise")}
                        onClick={() => onRemove(ex.key)}
                        className="p-2 rounded-xl text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-colors shrink-0">
                        <Trash2 size={16} />
                     </button>
                  </div>

                  {/* Unit (tracking) selector */}
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

                  {/* Uses weight */}
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

                  {/* Per-set rows */}
                  <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-2 px-1 text-[10px] font-bold text-subtle uppercase tracking-wider">
                        <span className="w-7 shrink-0 text-center">#</span>
                        <span className="flex-1">{t(`training.unit_labels.${ex.unit}`)}</span>
                        {ex.usesWeight && <span className="flex-1">{t("training.field.weight")}</span>}
                        {ex.showAdvanced && (
                           <>
                              <span className="w-12 text-center">{t("training.field.rir")}</span>
                              <span className="w-12 text-center">{t("training.field.rpe")}</span>
                              <span className="w-16 text-center">{t("training.field.tempo")}</span>
                           </>
                        )}
                        <span className="w-7 shrink-0" />
                     </div>
                     {ex.sets.map((s, sIdx) => (
                        <div key={s.key} className="flex items-center gap-2">
                           <span className="w-7 h-7 shrink-0 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                              {sIdx + 1}
                           </span>
                           <div className="flex-1">
                              <CellInput
                                 value={s.value}
                                 min={1}
                                 onChange={(v) => onUpdateSet(ex.key, s.key, { value: parseNum(v, 1) })}
                              />
                           </div>
                           {ex.usesWeight && (
                              <div className="flex-1">
                                 <CellInput
                                    value={s.weight}
                                    min={0}
                                    step={0.5}
                                    onChange={(v) => onUpdateSet(ex.key, s.key, { weight: parseNum(v, 0) })}
                                 />
                              </div>
                           )}
                           {ex.showAdvanced && (
                              <>
                                 <div className="w-12">
                                    <CellInput
                                       value={s.rir ?? ""}
                                       min={0}
                                       placeholder="–"
                                       onChange={(v) => onUpdateSet(ex.key, s.key, { rir: v === "" ? null : Number(v) })}
                                    />
                                 </div>
                                 <div className="w-12">
                                    <CellInput
                                       value={s.rpe ?? ""}
                                       min={0}
                                       step={0.5}
                                       placeholder="–"
                                       onChange={(v) => onUpdateSet(ex.key, s.key, { rpe: v === "" ? null : Number(v) })}
                                    />
                                 </div>
                                 <div className="w-16">
                                    <TextCell
                                       value={s.tempo}
                                       placeholder="3-1-1"
                                       onChange={(v) => onUpdateSet(ex.key, s.key, { tempo: v })}
                                    />
                                 </div>
                              </>
                           )}
                           <button
                              aria-label={t("training.remove_set")}
                              onClick={() => onRemoveSet(ex.key, s.key)}
                              disabled={ex.sets.length <= 1}
                              className="w-7 h-7 shrink-0 rounded-lg text-subtle hover:text-red-500 disabled:opacity-30 flex items-center justify-center transition-colors">
                              <X size={14} />
                           </button>
                        </div>
                     ))}

                     <button
                        onClick={() => onAddSet(ex.key)}
                        className="mt-1 w-full py-2 border border-dashed border-card-border text-subtle font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-muted dark:hover:bg-white/5 transition-colors">
                        <Plus size={14} /> {t("training.add_set")}
                     </button>
                  </div>

                  {/* Advanced toggle */}
                  <button
                     onClick={() => onUpdate(ex.key, { showAdvanced: !ex.showAdvanced })}
                     className={`flex items-center justify-center gap-1.5 text-xs font-bold py-1.5 rounded-xl transition-colors ${ex.showAdvanced ? "text-primary" : "text-subtle hover:text-foreground"}`}>
                     <SlidersHorizontal size={13} />
                     {t("training.advanced")}
                     <ChevronDown size={13} className={`transition-transform ${ex.showAdvanced ? "rotate-180" : ""}`} />
                  </button>

                  {/* Advanced: rest + notes (per-set RIR/RPE/tempo live in the rows above) */}
                  {ex.showAdvanced && (
                     <div className="flex flex-col gap-3">
                        <Field label={t("training.field.rest")}>
                           <NumberInput
                              value={ex.rest}
                              min={0}
                              step={5}
                              onChange={(v) => onUpdate(ex.key, { rest: v })}
                           />
                        </Field>
                        <div className="bg-muted/50 dark:bg-white/5 rounded-xl px-3 py-2 flex flex-col">
                           <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">
                              {t("training.notes_label")}
                           </span>
                           <textarea
                              value={ex.notes}
                              onChange={(e) => onUpdate(ex.key, { notes: e.target.value })}
                              placeholder={t("training.notes_placeholder")}
                              rows={2}
                              className="w-full bg-transparent font-medium text-sm text-foreground outline-none mt-0.5 resize-none"
                           />
                        </div>
                     </div>
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

/** Compact boxed numeric cell used inside the per-set grid. */
function CellInput({
   value,
   onChange,
   min = 0,
   step = 1,
   placeholder,
}: {
   value: number | string
   onChange: (v: string) => void
   min?: number
   step?: number
   placeholder?: string
}) {
   return (
      <input
         type="number"
         min={min}
         step={step}
         value={value}
         placeholder={placeholder}
         onChange={(e) => onChange(e.target.value)}
         className="w-full bg-muted/50 dark:bg-white/5 border border-card-border rounded-lg px-2 py-1.5 font-bold text-sm text-center text-foreground outline-none focus:border-primary/40"
      />
   )
}

function TextCell({
   value,
   onChange,
   placeholder,
}: {
   value: string
   onChange: (v: string) => void
   placeholder?: string
}) {
   return (
      <input
         type="text"
         value={value}
         placeholder={placeholder}
         onChange={(e) => onChange(e.target.value)}
         className="w-full bg-muted/50 dark:bg-white/5 border border-card-border rounded-lg px-2 py-1.5 font-bold text-sm text-center text-foreground outline-none focus:border-primary/40"
      />
   )
}
