import { useState, useEffect } from "react"
import { useStore } from "@/store/useStore"
import { motion, AnimatePresence } from "framer-motion"
import {
   CheckCircle2,
   Play,
   Circle,
   Clock,
   Flame,
   Dumbbell,
   Zap,
   Trash2,
   Settings2,
   Save,
   ChevronLeft,
   Plus,
   ChevronDown,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useWebHaptics } from "web-haptics/react"
import { Button, Modal } from "@/components/ui"

export default function TrainingPage() {
   const { trigger } = useWebHaptics()
   const {
      workouts,
      activeWorkoutId,
      setActiveWorkout,
      addWorkout,
      deleteWorkout,
      addExercise,
      updateExercise,
      deleteExercise,
      toggleExerciseCompletion,
      setWorkoutCompleted,
      workoutCompleted,
      resetWorkoutProgress,
   } = useStore()

   const [showCelebration, setShowCelebration] = useState(false)
   const [editingExId, setEditingExId] = useState<string | null>(null)
   const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null)

   const [modal, setModal] = useState<{
      isOpen: boolean
      type: "prompt" | "confirm"
      title: string
      message?: string
      defaultValue?: string
      onConfirm: (val?: string) => void
   }>({
      isOpen: false,
      type: "confirm",
      title: "",
      onConfirm: () => {},
   })
   const [modalInput, setModalInput] = useState("")

   const showPrompt = (
      title: string,
      defaultValue: string,
      onConfirm: (val: string) => void,
   ) => {
      setModalInput(defaultValue)
      setModal({
         isOpen: true,
         type: "prompt",
         title,
         defaultValue,
         onConfirm: (val) => {
            if (val) onConfirm(val)
            setModal((prev) => ({ ...prev, isOpen: false }))
         },
      })
   }

   const showConfirm = (title: string, message: string, onConfirm: () => void) => {
      setModal({
         isOpen: true,
         type: "confirm",
         title,
         message,
         onConfirm: () => {
            onConfirm()
            setModal((prev) => ({ ...prev, isOpen: false }))
         },
      })
   }

   const activeWorkout =
      workouts.find((w) => w.id === activeWorkoutId) || workouts[0]
   const exercises = activeWorkout?.exercises || []

   useEffect(() => {
      if (activeWorkout && !activeExerciseId && exercises.length > 0) {
         setActiveExerciseId(exercises[0].id)
      }
   }, [activeWorkout, exercises, activeExerciseId])

   const handleComplete = (exerciseId: string, idx: number) => {
      toggleExerciseCompletion(activeWorkout.id, exerciseId)

      const allCompleted = exercises.every((ex, i) =>
         i === idx ? !ex.completed : ex.completed,
      )

      if (!exercises[idx].completed) {
         // Si lo estamos completando ahora
         if (idx < exercises.length - 1) {
            setTimeout(() => setActiveExerciseId(exercises[idx + 1].id), 500)
         } else if (allCompleted) {
            setTimeout(() => setShowCelebration(true), 800)
            setWorkoutCompleted(true)
         }
      }
   }

   const handleAddWorkout = () => {
      showPrompt("Crear Rutina", "Nueva Rutina", (name) => {
         addWorkout(name)
      })
   }

   const completedCount = exercises.filter((e) => e.completed).length
   const progress =
      exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0

    useEffect(() => {
       if (showCelebration) {
          const timer = setTimeout(() => setShowCelebration(false), 4000)
          return () => clearTimeout(timer)
       }
    }, [showCelebration])

    return (
       <div className="p-4 md:p-6 pb-32 animate-fade-in font-sans flex flex-col min-h-screen relative">
          <AnimatePresence>
             {showCelebration && (
                <motion.div
                   initial={{ opacity: 0, y: -40, scale: 0.9 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: -20, scale: 0.95 }}
                   transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                   className="mb-4 w-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-[28px] p-4 flex items-center gap-4 shadow-lg shadow-green-100/50">
                   <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                      className="w-12 h-12 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 size={28} />
                   </motion.div>
                   <div className="flex-1">
                      <h3 className="font-bold text-green-800 dark:text-green-200 text-lg">¡Rutina completada!</h3>
                      <p className="text-green-700 dark:text-green-300/80 text-sm font-medium">Sigue así, puedes seguir editando o reiniciar cuando quieras.</p>
                   </div>
                   <button
                      onClick={() => setShowCelebration(false)}
                      className="p-2 rounded-xl hover:bg-green-100 dark:hover:bg-green-500/20 text-green-600 transition-colors">
                      <ChevronDown size={20} className="rotate-180" />
                   </button>
                </motion.div>
             )}
          </AnimatePresence>

          <header className="mb-6 flex flex-col items-start justify-between">
            <div className="flex items-center gap-2 mb-2">
               <Link
                  to="/"
                  aria-label="Volver al inicio"
                  className="p-2 bg-muted dark:bg-white-500/5 rounded-xl">
                  <ChevronLeft size={20} />
               </Link>
               <h1 className="text-3xl font-display font-extrabold text-foreground flex items-center gap-2">
                  <Zap size={32} className="text-primary" /> Rutinas
               </h1>
            </div>

            <div className="flex gap-2 overflow-x-auto w-full pb-2 [&::-webkit-scrollbar]:hidden mt-2 snap-x">
               <button
                  onClick={handleAddWorkout}
                  className="shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm bg-primary/10 text-primary flex items-center gap-2 hover:bg-primary/20 transition-colors snap-start border border-primary/20">
                  <Plus size={16} /> Crear
               </button>
               {workouts.map((w) => (
                  <button
                     key={w.id}
                     onClick={() => setActiveWorkout(w.id)}
                     className={`shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all snap-start ${activeWorkoutId === w.id ? "bg-gray-900 text-white dark:bg-white dark:text-black shadow-md" : "bg-card-bg text-gray-500 border border-card-border hover:bg-muted"}`}>
                     {w.name}
                  </button>
               ))}
            </div>
         </header>

         {activeWorkout ? (
            <>
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                     {activeWorkout.name}
                  </h2>
                   <div className="flex items-center gap-2">
                      {completedCount > 0 && (
                         <button
                            onClick={() => {
                               showConfirm(
                                  "Reiniciar Rutina",
                                  "¿Quieres marcar todos los ejercicios como pendientes?",
                                  () => resetWorkoutProgress(activeWorkout.id),
                               )
                            }}
                            className="text-primary p-2 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
                            title="Reiniciar rutina">
                            <Circle size={20} />
                         </button>
                      )}
                      <button
                         onClick={() => {
                            showConfirm(
                               "Eliminar Rutina",
                               "¿Seguro que quieres eliminar esta rutina completa?",
                               () => deleteWorkout(activeWorkout.id),
                            )
                         }}
                         className="text-red-500 p-2 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 transition-colors">
                         <Trash2 size={20} />
                      </button>
                   </div>
                </div>

               {/* Header Progress */}
               <div className="bg-card-bg rounded-[32px] p-5 shadow-sm border border-card-border mb-8 flex items-center gap-5">
                  <div className="w-14 h-14 relative shrink-0">
                     <svg
                        viewBox="0 0 36 36"
                        className="w-full h-full transform -rotate-90">
                        <path
                           className="text-muted dark:text-white-500/5"
                           strokeWidth="4"
                           stroke="currentColor"
                           fill="none"
                           d="M18 2.5 a 15.5 15.5 0 0 1 0 31.0 a 15.5 15.5 0 0 1 0 -31.0"
                        />
                        <motion.path
                           initial={{ pathLength: 0 }}
                           animate={{ pathLength: progress / 100 }}
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
                        Progreso de Sesión
                     </span>
                     <span className="text-sm font-bold text-primary">
                        {completedCount}/{exercises.length} ejercicios listos
                     </span>
                  </div>
               </div>

               {/* Exercises List */}
               <div className="space-y-4 flex-1">
                  {exercises.map((ex, idx) => {
                     const isActive = activeExerciseId === ex.id
                     const isEditing = editingExId === ex.id

                     const getSetsArray = () => {
                        if (ex.setDetails && ex.setDetails.length === ex.sets)
                           return ex.setDetails
                        return Array.from({ length: ex.sets }).map((_, i) => {
                           if (ex.setDetails && ex.setDetails[i])
                              return ex.setDetails[i]
                           return {
                              id: `${ex.id}-set-${i}`,
                              reps: ex.reps,
                              completed: false,
                           }
                        })
                     }

                     return (
                        <motion.div
                           layout
                           key={ex.id}
                           className={`rounded-[32px] border-2 transition-all ${
                              ex.completed
                                 ? "bg-muted dark:bg-white-500/5 opacity-60 border-transparent"
                                 : isActive
                                   ? "bg-card-bg border-primary shadow-lg ring-4 ring-primary/5"
                                   : "bg-card-bg border-card-border hover:border-gray-200"
                           }`}>
                           <div className="p-5 flex items-center gap-4">
                              <button
                                 onClick={(e) => {
                                    e.stopPropagation()
                                    handleComplete(ex.id, idx)
                                 }}
                                 className="shrink-0 transition-transform active:scale-90">
                                 {ex.completed ? (
                                    <CheckCircle2
                                       size={32}
                                       className="text-primary"
                                    />
                                 ) : (
                                    <Circle
                                       size={32}
                                       className={
                                          isActive
                                             ? "text-primary"
                                             : "text-gray-200 dark:text-white/10"
                                       }
                                    />
                                 )}
                              </button>

                              <button
                                 className="flex-1 text-left"
                                 onClick={() =>
                                    !ex.completed && setActiveExerciseId(ex.id)
                                 }>
                                 {isEditing ? (
                                    <input
                                       aria-label="Nombre del ejercicio"
                                       className="w-full bg-transparent font-bold text-lg text-primary border-b border-primary/20 outline-none pb-1"
                                       value={ex.name}
                                       onChange={(e) =>
                                          updateExercise(activeWorkout.id, ex.id, {
                                             name: e.target.value,
                                          })
                                       }
                                    />
                                 ) : (
                                    <h4
                                       className={`font-bold transition-all ${isActive ? "text-primary text-xl" : "text-foreground"}`}>
                                       {ex.name}
                                    </h4>
                                 )}

                                 {!isEditing && (
                                    <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-tight">
                                       {ex.sets} Sets •{" "}
                                       {ex.reps.replace(/[^0-9]/g, "")}{" "}
                                       {ex.reps.includes("s")
                                          ? "Segundos"
                                          : ex.reps.includes("m")
                                            ? "Minutos"
                                            : "Reps"}
                                    </p>
                                 )}
                              </button>

                              <div className="flex items-center gap-2">
                                 <button
                                    aria-label="Editar ejercicio"
                                    onClick={(e) => {
                                       e.stopPropagation()
                                       setEditingExId(isEditing ? null : ex.id)
                                    }}
                                    className={`p-2.5 rounded-xl transition-colors ${isEditing ? "bg-muted dark:bg-white-500/10 text-primary" : "bg-muted dark:bg-white-500/5 text-gray-400 hover:text-foreground"}`}>
                                    <Settings2 size={18} />
                                 </button>
                              </div>
                           </div>

                           <AnimatePresence>
                              {isActive && !isEditing && (
                                 <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-5 pb-5 overflow-hidden">
                                    <div className="flex flex-col gap-2 pt-2 border-t border-muted dark:border-white-500/5">
                                       {getSetsArray().map((setDetail, setIdx) => (
                                          <div
                                             key={setDetail.id}
                                             className="flex items-center gap-3">
                                             <div className="w-6 text-center text-xs font-bold text-gray-400">
                                                {setIdx + 1}
                                             </div>
                                             <div className="flex-1 bg-muted dark:bg-white-500/5 rounded-xl px-4 py-3 flex items-center gap-2 border border-transparent focus-within:border-primary/30">
                                                <input
                                                   type="number"
                                                   aria-label="Repeticiones"
                                                   className={`w-full bg-transparent font-bold outline-none text-sm ${setDetail.completed ? "text-gray-400 line-through" : "text-foreground"}`}
                                                   value={setDetail.reps.replace(
                                                      /[^0-9]/g,
                                                      "",
                                                   )}
                                                   onChange={(e) => {
                                                      const unit =
                                                         setDetail.reps.replace(
                                                            /[0-9]/g,
                                                            "",
                                                         )
                                                      const updatedSets = [
                                                         ...getSetsArray(),
                                                      ]
                                                      updatedSets[setIdx] = {
                                                         ...setDetail,
                                                         reps: e.target.value + unit,
                                                      }
                                                      updateExercise(
                                                         activeWorkout.id,
                                                         ex.id,
                                                         { setDetails: updatedSets },
                                                      )
                                                   }}
                                                />
                                                {setDetail.reps.replace(
                                                   /[0-9]/g,
                                                   "",
                                                ) && (
                                                   <span className="text-xs font-bold text-gray-400 shrink-0">
                                                      {setDetail.reps.includes("s")
                                                         ? "seg"
                                                         : "min"}
                                                   </span>
                                                )}
                                             </div>
                                             <button
                                                aria-label={
                                                   setDetail.completed
                                                      ? "Marcar serie como pendiente"
                                                      : "Completar serie"
                                                }
                                                onClick={(e) => {
                                                   e.stopPropagation()
                                                   trigger("nudge")
                                                   const updatedSets = [
                                                      ...getSetsArray(),
                                                   ]
                                                   updatedSets[setIdx] = {
                                                      ...setDetail,
                                                      completed:
                                                         !setDetail.completed,
                                                   }
                                                   const allCompleted =
                                                      updatedSets.every(
                                                         (s) => s.completed,
                                                      )
                                                   updateExercise(
                                                      activeWorkout.id,
                                                      ex.id,
                                                      {
                                                         setDetails: updatedSets,
                                                         completed: allCompleted,
                                                      },
                                                   )
                                                   if (
                                                      allCompleted &&
                                                      !ex.completed
                                                   ) {
                                                      trigger("success")
                                                      const allExCompleted =
                                                         exercises.every((e, i) =>
                                                            i === idx
                                                               ? true
                                                               : e.completed,
                                                         )
                                                      if (
                                                         idx <
                                                         exercises.length - 1
                                                      ) {
                                                         setTimeout(
                                                            () =>
                                                               setActiveExerciseId(
                                                                  exercises[idx + 1]
                                                                     .id,
                                                               ),
                                                            500,
                                                         )
                                                      } else if (allExCompleted) {
                                                         setTimeout(
                                                            () =>
                                                               setShowCelebration(
                                                                  true,
                                                               ),
                                                            800,
                                                         )
                                                         setWorkoutCompleted(true)
                                                      }
                                                   }
                                                }}
                                                className={`p-2 rounded-xl transition-colors ${setDetail.completed ? "bg-green-100 text-green-600" : "bg-muted dark:bg-white-500/10 text-gray-400 hover:text-foreground"}`}>
                                                <CheckCircle2 size={18} />
                                             </button>
                                          </div>
                                       ))}
                                    </div>
                                 </motion.div>
                              )}

                              {isEditing && (
                                 <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-6 pb-6 overflow-hidden">
                                     <div className="grid grid-cols-3 gap-3 mb-4 mt-2 items-start">
                                        <div className="bg-muted dark:bg-white-500/5 py-1 px-2 rounded-xl border border-muted dark:border-white-500/5 inline-flex flex-col">
                                           <span className="text-[10px] font-bold text-gray-400 uppercase block leading-none">
                                              Sets
                                           </span>
                                           <input
                                              type="number"
                                              aria-label="Sets"
                                              min="0"
                                              className="w-full bg-transparent font-bold text-base text-foreground outline-none leading-none mt-0.5"
                                              value={ex.sets}
                                              onChange={(e) => {
                                                 const newSets =
                                                    parseInt(e.target.value) || 0
                                                 const updatedSets = Array.from({
                                                    length: newSets,
                                                 }).map((_, i) => {
                                                    if (
                                                       ex.setDetails &&
                                                       ex.setDetails[i]
                                                    )
                                                       return ex.setDetails[i]
                                                    return {
                                                       id: `${ex.id}-set-${i}`,
                                                       reps: ex.reps,
                                                       completed: false,
                                                    }
                                                 })
                                                 updateExercise(
                                                    activeWorkout.id,
                                                    ex.id,
                                                    {
                                                       sets: newSets,
                                                       setDetails: updatedSets,
                                                    },
                                                 )
                                              }}
                                           />
                                        </div>
                                        <div className="bg-muted dark:bg-white-500/5 py-1 px-2 rounded-xl border border-muted dark:border-white-500/5 inline-flex flex-col">
                                           <span className="text-[10px] font-bold text-gray-400 uppercase block leading-none">
                                              Cantidad
                                           </span>
                                           <input
                                              type="number"
                                              aria-label="Cantidad"
                                              min="0"
                                              className="w-full bg-transparent font-bold text-base text-foreground outline-none leading-none mt-0.5"
                                              value={ex.reps.replace(/[^0-9]/g, "")}
                                              onChange={(e) => {
                                                 const val = e.target.value
                                                 const unit = ex.reps.includes("s")
                                                    ? "s"
                                                    : ex.reps.includes("m")
                                                      ? "m"
                                                      : ""
                                                 const newReps = val + unit
                                                 const updatedSets =
                                                    getSetsArray().map((s) => ({
                                                       ...s,
                                                       reps: newReps,
                                                    }))
                                                 updateExercise(
                                                    activeWorkout.id,
                                                    ex.id,
                                                    {
                                                       reps: newReps,
                                                       setDetails: updatedSets,
                                                    },
                                                 )
                                              }}
                                           />
                                        </div>
                                        <div className="rounded-xl border border-muted dark:border-white-500/5 overflow-hidden flex flex-col">
                                          {[
                                             { value: "reps", label: "Reps" },
                                             { value: "s", label: "Segundos" },
                                             { value: "m", label: "Minutos" },
                                          ].map((opt) => {
                                             const current = ex.reps.includes("s")
                                                ? "s"
                                                : ex.reps.includes("m")
                                                  ? "m"
                                                  : "reps"
                                             const isSelected = current === opt.value
                                             return (
                                                <button
                                                   key={opt.value}
                                                   type="button"
                                                   onClick={() => {
                                                      const num = ex.reps.replace(
                                                         /[^0-9]/g,
                                                         "",
                                                      )
                                                      const unit =
                                                         opt.value === "reps"
                                                            ? ""
                                                            : opt.value
                                                      const newReps = num + unit
                                                      const updatedSets =
                                                         getSetsArray().map((s) => ({
                                                            ...s,
                                                            reps:
                                                               s.reps.replace(
                                                                  /[^0-9]/g,
                                                                  "",
                                                               ) + unit,
                                                         }))
                                                      updateExercise(
                                                         activeWorkout.id,
                                                         ex.id,
                                                         {
                                                            reps: newReps,
                                                            setDetails: updatedSets,
                                                         },
                                                      )
                                                   }}
                                                   className={`px-3 py-2 font-bold text-xs text-left transition-all w-full border-t first:border-t-0 border-muted dark:border-white-500/5 ${
                                                      isSelected
                                                         ? "bg-primary text-white"
                                                         : "bg-muted/50 dark:bg-white-500/5 text-foreground hover:bg-muted dark:hover:bg-white-500/5"
                                                   }`}>
                                                   {opt.label}
                                                </button>
                                             )
                                          })}
                                       </div>
                                    </div>
                                    <div className="flex gap-3">
                                       <button
                                          onClick={() =>
                                             deleteExercise(activeWorkout.id, ex.id)
                                          }
                                          className="flex-1 py-4 bg-red-50 dark:bg-red-500/10 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                                          <Trash2 size={18} /> Eliminar
                                       </button>
                                       <button
                                          onClick={() => setEditingExId(null)}
                                          className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/95 transition-colors shadow-lg shadow-primary/20 animate-pulse-subtle">
                                          <Save size={18} /> Guardar
                                       </button>
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </motion.div>
                     )
                  })}

                  <button
                     onClick={() => addExercise(activeWorkout.id)}
                     className="w-full py-5 mt-4 border-2 border-dashed border-gray-200 dark:border-white/20 text-gray-400 font-bold rounded-[32px] flex items-center justify-center gap-2 hover:bg-muted dark:hover:bg-white-500/5 transition-colors active:scale-95">
                     <Plus size={20} /> Añadir Ejercicio
                  </button>
               </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
               <Dumbbell
                  size={64}
                  className="mb-4 text-gray-200 dark:text-white/10"
               />
               <p className="font-bold text-lg mb-1 text-foreground">
                  No hay rutinas creadas
               </p>
               <p className="text-sm mb-6 text-center max-w-xs">
                  Crea tu primera rutina de entrenamiento para empezar a añadir
                  ejercicios.
               </p>
               <Button
                  onClick={handleAddWorkout}
                  className="flex items-center gap-2">
                  <Plus size={20} /> Crear Rutina
               </Button>
            </div>
         )}

         {/* Custom Modal */}
         <Modal
            isOpen={modal.isOpen}
            onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
            title={modal.title}
            footer={
               <div className="flex gap-3 w-full">
                  <Button
                     variant="muted"
                     className="flex-1 border border-card-border"
                     onClick={() =>
                        setModal((prev) => ({ ...prev, isOpen: false }))
                     }>
                     Cancelar
                  </Button>
                  <Button
                     variant="primary"
                     className="flex-1"
                     onClick={() => {
                        if (modal.type === "prompt") {
                           modal.onConfirm(modalInput)
                        } else {
                           modal.onConfirm()
                        }
                     }}>
                     Aceptar
                  </Button>
               </div>
            }>
            {modal.type === "confirm" && (
               <p className="text-sm text-gray-500 font-medium mb-6">
                  {modal.message}
               </p>
            )}
            {modal.type === "prompt" && (
               <div className="bg-muted dark:bg-white-500/5 p-4 rounded-2xl border border-muted dark:border-white-500/5 mb-6">
                  <input
                     aria-label="Valor"
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
