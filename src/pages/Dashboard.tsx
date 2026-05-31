import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useStore } from "@/store/useStore"
import { useWebHaptics } from "web-haptics/react"
import {
   CheckCircle,
   Flame,
   Plus,
   Play,
   Droplet,
   Sparkles,
   Save,
   CalendarDays,
   X,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import WeightChart from "@/components/WeightChart"

export default function Home() {
   const navigate = useNavigate()
   const {
      isOnboarded,
      user,
      targetWeight,
      targetCalories,
      dailyCalories,
      waterGlasses,
      addWater,
      workouts,
      activeWorkoutId,
      updateWeight,
      addWeightEntry,
      isDarkMode,
   } = useStore()
   const { trigger } = useWebHaptics({ debug: true })
   const [mounted, setMounted] = useState(false)
   const [showDashWeightForm, setShowDashWeightForm] = useState(false)
   const [dashWeight, setDashWeight] = useState("")
   const [dashWeightDate, setDashWeightDate] = useState(
      new Date().toISOString().split("T")[0],
   )

   useEffect(() => {
      setMounted(true)
      if (!isOnboarded) {
         navigate("/onboarding")
      }
   }, [isOnboarded, navigate])

   const handleDashWeightSave = () => {
      const parsed = parseFloat(dashWeight)
      if (!isNaN(parsed) && parsed > 0) {
         addWeightEntry(parsed, dashWeightDate)
         setDashWeight("")
         setDashWeightDate(new Date().toISOString().split("T")[0])
         setShowDashWeightForm(false)
      }
   }

   if (!mounted || !isOnboarded || !user) return null

   const todayProgress = Math.min((dailyCalories / targetCalories) * 100, 100)

   const handleWaterClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (waterGlasses >= 10) return
      const nextGlasses = waterGlasses + 1
      addWater()
      if (nextGlasses === 10) {
         trigger("success")
      }
   }

   return (
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-6 animate-fade-in flex flex-col w-full h-full min-h-screen">
         <header className="flex justify-between items-center mb-6 shrink-0">
            <div>
               <h1 className="text-3xl font-display font-extrabold text-foreground">
                  Hola, {user.name?.split(" ")[0] ?? ""}! 👋
               </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
               <img
                  src="/Logo.png"
                  alt="MovEat"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
               />
               <span className="font-display font-extrabold text-lg tracking-tight text-foreground hidden sm:inline">
                  MovEat
               </span>
            </div>
         </header>

         <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 flex-1 w-full shrink-0">
            {/* Chart card */}
            <motion.section
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="col-span-2 bg-card-bg rounded-[32px] p-6 shadow-sm border border-card-border flex flex-col justify-between min-h-[280px]">
               <div className="flex justify-between items-start mb-2">
                  <h2 className="text-4xl font-display font-bold text-foreground">
                     {user?.weight ?? "--"}{" "}
                     <span className="text-xl text-gray-400 font-normal">kg</span>
                  </h2>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-xs font-bold">
                     Objetivo: {targetWeight} kg
                  </div>
               </div>

               <div className="flex-1 w-full">
                  <WeightChart />
               </div>
               <div className="mt-3 flex justify-center items-center">
                  <AnimatePresence mode="wait">
                     {!showDashWeightForm ? (
                        <motion.button
                           key="btn"
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0, scale: 0.9 }}
                           transition={{ duration: 0.2 }}
                           onClick={() => setShowDashWeightForm(true)}
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
                           className="flex items-center gap-2 overflow-hidden">
                           <div className="flex items-center gap-2 bg-muted/50 dark:bg-white-500/5 px-3 py-2 rounded-2xl border border-black/5 shrink-0">
                              <input
                                 type="date"
                                 aria-label="Fecha del registro"
                                 className="bg-transparent text-sm font-bold text-foreground outline-none"
                                 style={{
                                    colorScheme: isDarkMode ? "dark" : "light",
                                 }}
                                 value={dashWeightDate}
                                 onChange={(e) => setDashWeightDate(e.target.value)}
                              />
                           </div>
                           <div className="flex items-center gap-2 bg-muted/50 dark:bg-white-500/5 px-3 py-2 rounded-2xl border border-black/5 shrink-0">
                              <input
                                 type="number"
                                 step="0.1"
                                 aria-label="Peso en kg"
                                 placeholder="70.5"
                                 className="bg-transparent text-sm font-bold text-foreground w-20 outline-none"
                                 value={dashWeight}
                                 onChange={(e) => setDashWeight(e.target.value)}
                                 onKeyDown={(e) =>
                                    e.key === "Enter" && handleDashWeightSave()
                                 }
                              />
                              <span className="text-[10px] font-bold text-gray-400">
                                 kg
                              </span>
                           </div>
                           <div className="flex gap-2 shrink-0">
                              <button
                                 aria-label="Guardar peso"
                                 onClick={handleDashWeightSave}
                                 className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
                                 <Save size={16} />
                              </button>
                              <button
                                 aria-label="Cancelar"
                                 onClick={() => setShowDashWeightForm(false)}
                                 className="p-2 bg-muted dark:bg-white-500/10 text-gray-400 rounded-xl hover:text-foreground transition-colors">
                                 <X size={16} />
                              </button>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </motion.section>

            {/* Daily circular progress — Apple Watch rings */}
            <motion.section
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.1 }}
               className="col-span-2 md:col-span-1 bg-card-bg rounded-[32px] p-6 shadow-sm border border-card-border flex flex-col justify-between items-center text-center min-h-[320px] md:min-h-[380px]">
               <div className="w-full flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                     Progreso de Hoy
                  </span>
               </div>

               <div className="relative w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 flex items-center justify-center flex-1">
                  <svg
                     viewBox="0 0 40 40"
                     className="w-full h-full transform -rotate-90 drop-shadow-md">
                     {/* Outer ring track — Calories */}
                     <circle
                        cx="20"
                        cy="20"
                        r="18"
                        fill="none"
                        stroke="var(--muted-foreground)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        opacity="0.15"
                     />
                     {/* Outer ring progress — Calories */}
                     <circle
                        cx="20"
                        cy="20"
                        r="18"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={`${todayProgress * 1.13}, 113.1`}
                        className="transition-all duration-700 ease-out"
                     />
                     {/* Inner ring track — Hydration */}
                     <circle
                        cx="20"
                        cy="20"
                        r="13"
                        fill="none"
                        stroke="var(--muted-foreground)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        opacity="0.15"
                     />
                     {/* Inner ring progress — Hydration */}
                     <circle
                        cx="20"
                        cy="20"
                        r="13"
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min((waterGlasses / 10) * 81.6, 81.6)}, 81.6`}
                        className="transition-all duration-700 ease-out"
                     />
                  </svg>

                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-2xl font-display font-extrabold text-foreground leading-none">
                        {dailyCalories}
                     </span>
                     <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                        / {targetCalories} kcal
                     </span>
                     <div className="flex items-center gap-1 mt-2">
                        <Droplet size={12} className="text-water fill-water" />
                        <span className="text-sm font-bold text-water">
                           {waterGlasses}
                        </span>
                        <span className="text-[10px] text-gray-400">/ 10</span>
                     </div>
                  </div>
               </div>

               <div className="flex gap-2 w-full mt-4">
                  <Link
                     to="/nutrition"
                     className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 active:scale-95 transition-colors">
                     <Plus size={14} /> Comida
                  </Link>
                  <button
                     onClick={handleWaterClick}
                     className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold bg-water/10 text-water border border-water/20 rounded-xl hover:bg-water/20 active:scale-95 transition-colors">
                     <Droplet size={14} /> Agua
                  </button>
               </div>
            </motion.section>

            {/* Entrenamiento card */}
            <Link
               to="/training"
               className="col-span-2 xl:col-span-3 bg-foreground rounded-[32px] p-5 shadow-sm flex flex-col justify-between group cursor-pointer relative overflow-hidden min-h-[140px]">
               <div className="absolute inset-0 right-0 bg-primary/10 z-0" />
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                     <Sparkles size={16} className="text-accent" />
                     <h3 className="font-bold text-sm text-background">Para hoy</h3>
                  </div>
                  <h4 className="text-lg font-display font-bold mb-0.5 line-clamp-1 text-background">
                     {workouts.find((w) => w.id === activeWorkoutId)?.name ??
                        (workouts[0]?.name || "Crear Rutina")}
                  </h4>
               </div>
               <div className="relative z-20 flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 text-accent">
                     <CheckCircle size={14} />
                     <span className="text-xs font-bold">
                        {((workouts.find((w) => w.id === activeWorkoutId)?.exercises
                           .length ??
                           workouts[0]?.exercises.length) ||
                           0) * 20 || 50}{" "}
                        XP
                     </span>
                  </div>
                  <button
                     aria-label="Iniciar rutina"
                     className="w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                     <Play size={18} fill="currentColor" className="ml-0.5" />
                  </button>
               </div>
            </Link>
         </div>
      </div>
   )
}
