import { useState } from "react"
import { useStore } from "@/store/useStore"
import { motion, AnimatePresence } from "framer-motion"
import {
   Award,
   Flame,
   Star,
   Target,
   Zap,
   CheckCircle2,
   Droplet,
   Clock,
   Shield,
   Rocket,
   Trophy,
   Pencil,
   Save,
   Plus,
   CalendarDays,
   X,
} from "lucide-react"
import WeightChart from "@/components/WeightChart"
import { apiPutProfile } from "@/api/profile"

export default function ProgressPage() {
   const {
      xp,
      level,
      streak,
      totalWorkouts,
      resetProgress,
      user,
      targetWeight,
      dailyCalories,
      targetCalories,
       workoutCompleted,
       waterLiters,
       waterGlasses,
       waterStreak,
       meals,
      updateWeight,
      addWeightEntry,
      isDarkMode,
   } = useStore()
   const [editingWeight, setEditingWeight] = useState(false)
   const [weightInput, setWeightInput] = useState(String(user?.weight ?? ""))
   const [showWeightForm, setShowWeightForm] = useState(false)
   const [newWeight, setNewWeight] = useState("")
   const [newWeightDate, setNewWeightDate] = useState(
      new Date().toISOString().split("T")[0],
   )

   const handleSaveWeight = async () => {
      const parsed = parseFloat(weightInput)
      if (!isNaN(parsed) && parsed > 0) {
         updateWeight(parsed)
         await apiPutProfile({ currentWeight: parsed })
      }
      setEditingWeight(false)
   }

   const handleAddWeightEntry = async () => {
      const parsed = parseFloat(newWeight)
      if (!isNaN(parsed) && parsed > 0) {
         addWeightEntry(parsed, newWeightDate)
         if (newWeightDate === new Date().toISOString().split("T")[0]) {
            await apiPutProfile({ currentWeight: parsed })
         }
      }
      setNewWeight("")
      setNewWeightDate(new Date().toISOString().split("T")[0])
      setShowWeightForm(false)
   }
   const nextLevelXp = level * 100
   const progressToNext = (xp / nextLevelXp) * 100

   const isPerfectDay = workoutCompleted && meals.length >= 3 && waterGlasses >= 10
    const isHydrationPro = waterStreak >= 5
   const isProfileComplete =
      !!user?.name && !!user?.goal && user.weight > 0 && user.height > 0
   const isHighBurn = dailyCalories < targetCalories - 500 && workoutCompleted

   const badges = [
      {
         id: 1,
         name: "Semana completa",
         icon: Star,
         unlocked: streak >= 7,
         description: "7 días seguidos activo",
      },
      {
         id: 2,
         name: "First Blood",
         icon: Zap,
         unlocked: totalWorkouts >= 1,
         description: "Primer entreno completado",
      },
      {
         id: 3,
         name: "Día Perfecto",
         icon: Target,
         unlocked: isPerfectDay,
         description: "Dieta, hidratación y entreno logrados",
      },
      {
         id: 4,
         name: "Hidratación PRO",
         icon: Droplet,
          unlocked: isHydrationPro,
          description: "2L durante 5 días seguidos",
      },
      {
         id: 5,
         name: "Madrugador",
         icon: Clock,
         unlocked: totalWorkouts >= 5 && streak >= 3,
         description: "5 entrenos y racha de 3+ días",
      },
      {
         id: 6,
         name: "Guerrero",
         icon: Shield,
         unlocked: totalWorkouts >= 10,
         description: "10 entrenos totales",
      },
      {
         id: 7,
         name: "A tope",
         icon: Rocket,
         unlocked: isHighBurn,
         description: "Déficit de +500 kcal con entreno",
      },
      {
         id: 8,
         name: "Socialite",
         icon: Trophy,
         unlocked: isProfileComplete,
         description: "Perfil completado al 100%",
      },
   ]

   return (
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-6 animate-fade-in font-sans w-full h-full min-h-screen flex flex-col">
         <header className="mb-6 shrink-0 flex justify-between items-center">
            <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight flex items-center gap-2">
               <Award size={32} className="text-primary" />
               Tu Progreso
            </h1>
             <button
                onClick={resetProgress}
                 className="text-caption text-subtle hover:text-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-button px-2 py-1">
                Reiniciar Todo
             </button>
         </header>

         {/* Top Grid: Chart and Level */}
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
            <motion.section
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="md:col-span-2 xl:col-span-2 bg-card-bg/40 rounded-[32px] p-6 shadow-sm border border-card-border flex flex-col justify-between min-h-[280px]">
               <div className="flex justify-between items-start mb-2">
                  <div>
                     {editingWeight ? (
                        <div className="flex items-center gap-2">
                           <input
                              type="number"
                              aria-label="Peso en kg"
                              className="text-4xl font-display font-bold text-foreground w-24 bg-transparent border-b-2 border-primary outline-none"
                              value={weightInput}
                              onChange={(e) => setWeightInput(e.target.value)}
                              onKeyDown={(e) =>
                                 e.key === "Enter" && handleSaveWeight()
                              }
                           />
                            <span className="text-xl text-subtle font-normal">kg</span>
                            <button
                               aria-label="Guardar peso"
                               onClick={handleSaveWeight}
                               className="min-w-11 min-h-11 flex items-center justify-center p-1.5 bg-primary/10 rounded-lg text-primary hover:bg-primary/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                               <Save size={16} />
                            </button>
                        </div>
                     ) : (
                        <div className="flex items-center gap-2">
                           <h2 className="text-4xl font-display font-bold text-foreground">
                              {user?.weight ?? "--"}{" "}
                              <span className="text-xl text-subtle font-normal">
                                 kg
                              </span>
                           </h2>
                        </div>
                     )}
                  </div>
                   <div className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-xs font-bold">
                     Objetivo: {targetWeight} kg
                  </div>
               </div>
                <div className="flex-1 w-full -ml-4">
                    <WeightChart
                       targetWeight={targetWeight}
                       onPointClick={(date, weight) => {
                          setNewWeightDate(date)
                          setNewWeight(weight !== null ? String(weight) : "")
                          setShowWeightForm(true)
                       }}
                    />
                </div>

               <div className="mt-4 flex justify-center items-center">
                  <AnimatePresence mode="wait">
                     {!showWeightForm ? (
                        <motion.button
                           key="btn"
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0, scale: 0.9 }}
                           transition={{ duration: 0.2 }}
                           onClick={() => setShowWeightForm(true)}
                           className="flex items-center gap-2 py-2.5 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-4 rounded-xl hover:bg-primary/20 active:scale-95 transition-all">
                           <Plus size={14} /> Registrar peso
                        </motion.button>
                     ) : (
                         <motion.div
                            key="form"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                            className="flex flex-col gap-2 overflow-hidden">
                            <div className="flex items-center gap-2">
                               <div className="flex items-center gap-2 bg-muted/50 dark:bg-white/5 px-3 py-2 rounded-2xl border border-card-border flex-1">
                                  <input
                                     type="date"
                                     aria-label="Fecha del registro"
                                     className="bg-transparent text-sm font-bold text-foreground outline-none w-full"
                                     style={{
                                        colorScheme: isDarkMode ? "dark" : "light",
                                     }}
                                     value={newWeightDate}
                                     onChange={(e) => setNewWeightDate(e.target.value)}
                                  />
                               </div>
                                <button
                                   aria-label="Cancelar"
                                   onClick={() => setShowWeightForm(false)}
                                    className="min-w-11 min-h-11 flex items-center justify-center p-2 bg-muted text-subtle rounded-xl hover:text-foreground transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                                   <X size={16} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                               <div className="flex items-center gap-2 bg-muted/50 dark:bg-white/5 px-3 py-2 rounded-2xl border border-card-border flex-1">
                                  <input
                                     type="number"
                                     step="0.1"
                                     aria-label="Peso en kg"
                                     placeholder="70.5"
                                     className="bg-transparent text-sm font-bold text-foreground w-full outline-none"
                                     value={newWeight}
                                     onChange={(e) => setNewWeight(e.target.value)}
                                     onKeyDown={(e) =>
                                        e.key === "Enter" && handleAddWeightEntry()
                                     }
                                  />
                                    <span className="text-xs text-subtle font-bold">kg</span>
                               </div>
                                <button
                                   aria-label="Guardar peso"
                                   onClick={handleAddWeightEntry}
                                   className="min-w-11 min-h-11 flex items-center justify-center p-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                                   <Save size={16} />
                                </button>
                            </div>
                         </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </motion.section>

            <motion.section
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="md:col-span-2 xl:col-span-1 bg-level-card-bg rounded-[32px] p-6 shadow-sm border border-card-border relative overflow-hidden flex flex-col justify-between min-h-[280px]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
               <div className="flex justify-between items-center relative z-10 w-full mb-6">
                  <div>
                       <span className="text-caption text-foreground/60">
                         Nivel Actual
                      </span>
                      <h2 className="text-5xl font-display font-extrabold mt-1 text-foreground">
                        {level}
                     </h2>
                  </div>
                  <div className="bg-primary/10 w-12 h-12 rounded-2xl border border-primary/10 flex items-center justify-center">
                     <Flame className="text-primary w-6 h-6" fill="currentColor" />
                  </div>
               </div>
               <div className="relative z-10 w-full mt-auto">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-subtle/80">{xp} XP</span>
                      <span className="text-subtle">{nextLevelXp} XP</span>
                  </div>
                   <div className="h-3 bg-muted rounded-full overflow-hidden">
                     <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToNext}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-linear-to-r from-primary to-primary/60 rounded-full"
                     />
                  </div>
                    <p className="text-xs text-subtle mt-2 font-medium text-center">
                      Faltan {nextLevelXp - xp} XP
                   </p>
               </div>
            </motion.section>
         </div>

         {/* Stats + Badges Area: Reversed for Mobile ONLY using flex-col-reverse */}
         <div className="flex flex-col-reverse xl:grid xl:grid-cols-4 gap-4 lg:gap-6 flex-1">
            {/* Achievements Section - Spans 3 columns on Desktop */}
            <motion.section
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="xl:col-span-3 bg-card-bg/40 rounded-[32px] p-6 border border-card-border shadow-sm">
               <h3 className="font-bold text-base mb-4 text-foreground flex items-center gap-2">
                  <Star fill="currentColor" size={18} className="text-accent" />
                  Logros Obtenidos
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {badges.map((badge) => {
                     const Icon = badge.icon
                     return (
                        <div
                           key={badge.id}
                           className={`bg-muted rounded-2xl p-4 flex items-center gap-4 transition-all ${badge.unlocked ? "border-primary/20 shadow-sm opacity-100" : "border-card-border opacity-60 grayscale"} border`}>
                           <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${badge.unlocked ? "bg-primary/20 text-primary" : "bg-on-subtle text-subtle"}`}>
                              {badge.unlocked ? (
                                 <CheckCircle2 size={20} />
                              ) : (
                                 <Icon size={20} />
                              )}
                           </div>
                           <div>
                              <h4 className="font-bold text-foreground text-sm">
                                 {badge.name}
                              </h4>
                               <p className="text-xs text-subtle font-medium leading-tight">
                                 {badge.description}
                              </p>
                           </div>
                        </div>
                     )
                  })}
               </div>
            </motion.section>

            {/* Stats (Streak/Workouts) - Above Logros on mobile */}
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-4 lg:gap-6 h-full xl:col-span-1">
               <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card-bg/40 rounded-[32px] p-5 border border-card-border shadow-sm flex flex-col justify-center items-center text-center flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-2">
                     <Flame size={24} fill="currentColor" />
                  </div>
                  <span className="text-3xl font-display font-bold text-foreground block leading-tight">
                     {streak}
                  </span>
                   <span className="text-caption text-subtle">
                      Racha
                   </span>
               </motion.div>
               <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="bg-card-bg/40 rounded-[32px] p-5 border border-card-border shadow-sm flex flex-col justify-center items-center text-center flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                     <Zap size={24} fill="currentColor" />
                  </div>
                  <span className="text-3xl font-display font-bold text-foreground block leading-tight">
                     {totalWorkouts}
                  </span>
                   <span className="text-caption text-subtle">
                      Entrenos
                   </span>
               </motion.div>
            </div>
         </div>
      </div>
   )
}
