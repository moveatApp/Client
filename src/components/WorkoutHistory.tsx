// ─── Past workout sessions list (separate from the routines view) ────────────

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CalendarDays, ChevronDown, Dumbbell, History } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
   apiListWorkoutSessions,
   type WorkoutSession,
   type WorkoutSessionExercise,
} from "@/api/workouts"

function sessionSetCount(session: WorkoutSession): number {
   return session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
}

function setLine(ex: WorkoutSessionExercise, t: ReturnType<typeof useTranslation>["t"]): string {
   return ex.sets
      .map((s) => {
         const value =
            s.reps != null
               ? `${s.reps}`
               : s.durationSeconds != null
                 ? `${s.durationSeconds}s`
                 : s.distanceMeters != null
                   ? `${s.distanceMeters}m`
                   : "—"
         const weight = s.weight != null && s.weight > 0 ? ` · ${s.weight}kg` : ""
         return `${value}${weight}`
      })
      .join("  |  ") || t("history.no_sets")
}

export default function WorkoutHistory() {
   const { t, i18n } = useTranslation("common")
   const [sessions, setSessions] = useState<WorkoutSession[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState(false)
   const [openId, setOpenId] = useState<string | null>(null)

   useEffect(() => {
      let active = true
      setLoading(true)
      setError(false)
      void apiListWorkoutSessions({ limit: 50 }).then((res) => {
         if (!active) return
         if (res.ok) {
            // Newest first, regardless of backend ordering.
            setSessions(
               [...res.data.workoutSessions].sort(
                  (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
               ),
            )
         } else setError(true)
         setLoading(false)
      })
      return () => {
         active = false
      }
   }, [])

   const formatDate = (iso: string) =>
      new Date(iso).toLocaleDateString(i18n.language, {
         weekday: "short",
         day: "numeric",
         month: "short",
      })

   if (loading) {
      return (
         <p className="text-center text-subtle text-sm py-12 font-medium">
            {t("history.loading")}
         </p>
      )
   }

   if (error) {
      return (
         <p className="text-center text-subtle text-sm py-12 font-medium">
            {t("history.error")}
         </p>
      )
   }

   if (sessions.length === 0) {
      return (
         <div className="flex-1 flex flex-col items-center justify-center text-subtle py-16">
            <History size={56} className="mb-4 text-muted-foreground dark:text-white/10" />
            <p className="font-bold text-lg mb-1 text-foreground">{t("history.empty_title")}</p>
            <p className="text-sm text-center max-w-xs">{t("history.empty_desc")}</p>
         </div>
      )
   }

   return (
      <div className="space-y-3 flex-1">
         {sessions.map((session) => {
            const isOpen = openId === session.id
            const sets = sessionSetCount(session)
            return (
               <div
                  key={session.id}
                  className="rounded-[28px] border border-card-border bg-card-bg overflow-hidden">
                  <button
                     onClick={() => setOpenId(isOpen ? null : session.id)}
                     className="w-full flex items-center gap-3 p-4 text-left">
                     <div className="w-11 h-11 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Dumbbell size={20} />
                     </div>
                     <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-base text-foreground truncate">
                           {session.title ?? t("history.untitled")}
                        </h4>
                        <p className="text-xs text-subtle font-bold uppercase tracking-tight mt-0.5 flex items-center gap-1.5">
                           <CalendarDays size={12} />
                           {formatDate(session.performedAt)}
                           {" · "}
                           {t("history.exercises", { count: session.exercises.length })}
                           {" · "}
                           {t("history.sets", { count: sets })}
                        </p>
                     </div>
                     <ChevronDown
                        size={18}
                        className={`text-subtle shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                     />
                  </button>

                  <AnimatePresence initial={false}>
                     {isOpen && (
                        <motion.div
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: "auto", opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           transition={{ duration: 0.2 }}
                           className="overflow-hidden">
                           <div className="px-4 pb-4 flex flex-col gap-2">
                              {session.exercises.map((ex) => (
                                 <div
                                    key={ex.id}
                                    className="bg-muted/50 dark:bg-white/5 rounded-2xl px-3 py-2.5">
                                    <p className="font-bold text-sm text-foreground">
                                       {ex.exerciseNameSnapshot}
                                    </p>
                                    <p className="text-xs text-subtle font-medium mt-0.5">
                                       {setLine(ex, t)}
                                    </p>
                                 </div>
                              ))}
                              {session.notes && (
                                 <p className="text-xs text-subtle font-medium italic px-1">
                                    {session.notes}
                                 </p>
                              )}
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            )
         })}
      </div>
   )
}
