import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useStore } from "@/store/useStore"
import { useWebHaptics } from "web-haptics/react"
import {
   Flame,
   Plus,
   Droplet,
   Save,
   X,
   UtensilsCrossed,
   ArrowRight,
   TrendingUp,
   Dumbbell,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import WeightChart from "@/components/WeightChart"
import { logWeight } from "@/lib/weightLog"
import { todayLocalISO } from "@/api/client"
import { DatePicker, CountUp } from "@/components/ui"
import { cardEnter, stagger } from "@/lib/motion"
import { localDateStr } from "@/lib/date"

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
      isDarkMode,
      meals,
      streak,
      routines,
      activeRoutineId,
   } = useStore()
   const { trigger } = useWebHaptics({ debug: true })
   const { t } = useTranslation("common")
   const [mounted, setMounted] = useState(false)
   const [showDashWeightForm, setShowDashWeightForm] = useState(false)
   const [dashWeight, setDashWeight] = useState("")
   const [dashWeightDate, setDashWeightDate] = useState(
      localDateStr(),
   )

   useEffect(() => {
      setMounted(true)
      if (!isOnboarded) {
         navigate("/onboarding")
      }
   }, [isOnboarded, navigate])

   const handleDashWeightSave = async () => {
      const parsed = parseFloat(dashWeight)
      if (!isNaN(parsed) && parsed > 0) {
         await logWeight(parsed, dashWeightDate)
         setDashWeight("")
         setDashWeightDate(todayLocalISO())
         setShowDashWeightForm(false)
      }
   }

   if (!mounted || !isOnboarded || !user) return null

   const todayProgress = Math.min((dailyCalories / targetCalories) * 100, 100)

   const suggestedWorkout =
      routines.length > 0
         ? routines.find((r) => r.id === activeRoutineId) || routines[0]
         : null

   const handleWaterClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (waterGlasses >= 10) return
      addWater()
      if (waterGlasses + 1 === 10) {
         trigger("success")
      }
   }

   return (
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-6 animate-fade-in flex flex-col w-full h-full min-h-screen">
         <header className="flex justify-between items-center mb-6 shrink-0">
            <div>
               <h1 className="text-3xl font-display font-extrabold text-foreground">
                  {t("dashboard.greeting", { name: user.name?.split(" ")[0] ?? "" })}
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

         <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 w-full">
            {/* Chart card */}
            <motion.section
               variants={cardEnter}
               className="col-span-1 sm:col-span-2 xl:col-span-2 bg-card-bg rounded-[32px] p-6 border border-card-border soft-raised flex flex-col justify-between min-h-[280px]">
               <div className="flex justify-between items-start mb-2">
                  <h2 className="text-4xl font-display font-bold text-foreground">
                     {user?.weight != null ? <CountUp value={user.weight} decimals={1} /> : "--"}{" "}
                     <span className="text-xl text-subtle font-normal">kg</span>
                  </h2>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-xs font-bold">
                     {t("dashboard.target", { weight: targetWeight })}
                  </div>
               </div>

               <div className="flex-1 w-full">
                  {/* Tapping a point only shows its tooltip (view the day's weight);
                      logging is done via the "Registrar peso" button below. */}
                  <WeightChart targetWeight={targetWeight} />
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
                           <Plus size={14} /> {t("dashboard.log_weight")}
                        </motion.button>
                     ) : (
                        <motion.div
                           key="form"
                           initial={{ opacity: 0, y: 4 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: 4 }}
                           transition={{ duration: 0.25, ease: "easeInOut" }}
                           className="flex flex-wrap items-center justify-center gap-2 w-full">
                           <DatePicker
                              variant="inline"
                              value={dashWeightDate}
                              onChange={setDashWeightDate}
                              minYear={new Date().getFullYear() - 10}
                              maxYear={new Date().getFullYear()}
                              maxDate={todayLocalISO()}
                              isDarkMode={isDarkMode}
                           />
                           <div className="flex items-center gap-2 bg-muted/50 dark:bg-white/5 px-3 py-2 rounded-2xl border border-card-border shrink-0">
                              <input
                                 type="number"
                                 step="0.1"
                                 aria-label={t("dashboard.weight_aria")}
                                 placeholder="70.5"
                                 className="bg-transparent text-sm font-bold text-foreground w-20 outline-none"
                                 value={dashWeight}
                                 onChange={(e) => setDashWeight(e.target.value)}
                                 onKeyDown={(e) =>
                                    e.key === "Enter" && handleDashWeightSave()
                                 }
                              />
                              <span className="text-[10px] font-bold text-subtle">
                                 kg
                              </span>
                           </div>
                           <div className="flex gap-2 shrink-0">
                              <button
                                 aria-label={t("dashboard.save_weight")}
                                 onClick={handleDashWeightSave}
                                 className="min-w-11 min-h-11 flex items-center justify-center bg-primary text-white rounded-2xl shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                                 <Save size={18} />
                              </button>
                              <button
                                 aria-label={t("dashboard.cancel")}
                                 onClick={() => setShowDashWeightForm(false)}
                                 className="min-w-11 min-h-11 flex items-center justify-center bg-muted text-subtle rounded-2xl hover:text-foreground active:scale-95 transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                                 <X size={18} />
                              </button>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </motion.section>

            {/* Daily circular progress — Apple Watch rings */}
            <motion.section
               variants={cardEnter}
               className="col-span-1 bg-card-bg rounded-[32px] p-6 border border-card-border soft-raised flex flex-col justify-between items-center text-center min-h-[320px] md:min-h-[380px]">
               <div className="w-full flex justify-between items-center mb-2">
                  <span className="text-caption text-subtle">{t("dashboard.today_progress")}</span>
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
                        stroke="var(--water)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min((waterGlasses / 10) * 81.6, 81.6)}, 81.6`}
                        className="transition-all duration-700 ease-out"
                     />
                  </svg>

                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-2xl font-display font-extrabold text-foreground leading-none">
                        <CountUp value={dailyCalories} />
                     </span>
                     <span className="text-xs text-subtle font-bold mt-0.5">
                        / {targetCalories} kcal
                     </span>
                     <div className="flex items-center gap-1 mt-2">
                        <Droplet size={12} className="text-water fill-water" />
                        <span className="text-sm font-bold text-water">
                           <CountUp value={waterGlasses * 200} />ml
                        </span>
                        <span className="text-xs text-subtle">/ 2000ml</span>
                     </div>
                  </div>
               </div>

               <div className="flex gap-2 w-full mt-4">
                  <Link
                     to="/nutrition"
                     className="flex-1 flex items-center justify-center gap-1.5 min-h-11 py-3 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 active:scale-95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                     <Plus size={14} /> {t("dashboard.food")}
                  </Link>
                  <button
                     onClick={handleWaterClick}
                     className="flex-1 flex items-center justify-center gap-1.5 min-h-11 py-3 text-xs font-bold bg-water/10 text-water border border-water/20 rounded-xl hover:bg-water/20 active:scale-95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-water/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                     <Droplet size={14} /> {t("dashboard.water")}
                  </button>
               </div>
            </motion.section>

            {/* Meal / Workout row */}
            <motion.div
               variants={cardEnter}
               className="col-span-1 sm:col-span-2 xl:col-span-3 grid grid-cols-2 gap-3 lg:gap-4">
               {/* Last meal card */}
               {(() => {
                  const lastMeal =
                     meals.length > 0
                        ? [...meals].sort(
                             (a, b) =>
                                new Date(b.date + "T" + b.time).getTime() -
                                new Date(a.date + "T" + a.time).getTime(),
                          )[0]
                        : null
                  return (
                     <div className="col-span-1 flex flex-col h-full bg-level-card-bg border border-card-border rounded-[32px] soft-raised overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
                        <Link
                           to="/nutrition"
                           className="flex-1 flex flex-col justify-between group cursor-pointer relative z-10 p-6">
                           <div className="flex flex-col items-center text-center">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                 <UtensilsCrossed
                                    size={20}
                                    className="text-primary"
                                 />
                                 <span className="text-xs font-bold uppercase tracking-widest text-subtle">
                                    {t("dashboard.last_meal")}
                                 </span>
                              </div>
                              <h3 className="text-lg font-display font-bold line-clamp-1 text-foreground">
                                 {lastMeal
                                    ? lastMeal.name.replace(/\b\w/g, (l) =>
                                         l.toUpperCase(),
                                      )
                                    : t("dashboard.no_meals")}
                              </h3>
                           </div>
                           <div className="flex flex-col items-center text-center mt-3 gap-1">
                              {lastMeal ? (
                                 <>
                                    <span className="text-xs font-bold uppercase tracking-wider text-subtle/80">
                                       {lastMeal.calories} KCAL
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-subtle">
                                       {lastMeal.grams}G
                                    </span>
                                 </>
                              ) : (
                                 <div className="flex items-center justify-center gap-2 text-subtle">
                                    <Plus size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">
                                       {t("dashboard.log")}
                                    </span>
                                 </div>
                              )}
                           </div>
                        </Link>
                        <Link
                           to="/nutrition"
                           className="relative z-10 bg-card-bg/40 text-primary border-t border-card-border py-3 flex items-center justify-center gap-2 hover:bg-card-bg/60 active:scale-95 transition-colors cursor-pointer">
                           <span className="text-xs font-bold uppercase tracking-wider">
                              {t("dashboard.see_more")}
                           </span>
                           <ArrowRight size={16} />
                        </Link>
                     </div>
                  )
               })()}

               {/* Suggested workout card */}
               <div className="col-span-1 flex flex-col h-full bg-level-card-bg border border-card-border rounded-[32px] soft-raised overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
                  <Link
                     to="/training"
                     className="flex-1 flex flex-col justify-between group cursor-pointer relative z-10 p-6">
                     <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                           <Dumbbell size={20} className="text-primary" />
                           <span className="text-xs font-bold uppercase tracking-widest text-subtle">
                              {t("dashboard.workout")}
                           </span>
                        </div>
                        <h3 className="text-lg font-display font-bold line-clamp-1 text-foreground">
                           {suggestedWorkout
                              ? suggestedWorkout.name
                              : t("dashboard.no_workouts")}
                        </h3>
                     </div>
                     <div className="flex flex-col items-center text-center mt-3 gap-1">
                        {suggestedWorkout ? (
                           <>
                              <span className="text-xs font-bold uppercase tracking-wider text-subtle/80">
                                 {t("dashboard.exercises", {
                                    count: suggestedWorkout.exercises.length,
                                 })}
                              </span>
                              <span className="text-xs font-bold uppercase tracking-wider text-subtle">
                                 {t("dashboard.sets", {
                                    count: suggestedWorkout.exercises.reduce(
                                       (sum, ex) => sum + ex.targetSets,
                                       0,
                                    ),
                                 })}
                              </span>
                           </>
                        ) : (
                           <div className="flex items-center justify-center gap-2 text-subtle">
                              <Plus size={16} />
                              <span className="text-xs font-bold uppercase tracking-wider">
                                 {t("dashboard.create")}
                              </span>
                           </div>
                        )}
                     </div>
                  </Link>
                  <Link
                     to="/training"
                     className="relative z-10 bg-card-bg/40 text-primary border-t border-card-border py-3 flex items-center justify-center gap-2 hover:bg-card-bg/60 active:scale-95 transition-colors cursor-pointer">
                     <span className="text-xs font-bold uppercase tracking-wider">
                        {t("dashboard.see_more")}
                     </span>
                     <ArrowRight size={16} />
                  </Link>
               </div>
            </motion.div>

            {/* Streak row */}
            <motion.div
               variants={cardEnter}
               className="col-span-1 sm:col-span-2 xl:col-span-3 bg-level-card-bg border border-card-border rounded-[32px] p-6 soft-raised flex flex-col justify-between min-h-[160px] relative overflow-hidden">
               <div className="absolute inset-0 bg-linear-to-br from-primary to-secondary dark:hidden" />
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 dark:hidden" />
               <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-white/25 via-white/5 to-transparent dark:hidden" />
               <div className="hidden dark:block absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
               <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                     <Flame size={20} className="text-white dark:text-primary" />
                     <span className="text-xs font-bold uppercase tracking-widest text-white/80 dark:text-subtle">
                        {t("dashboard.streak")}
                     </span>
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                     <span className="text-5xl font-display font-extrabold text-white dark:text-foreground leading-none">
                        <CountUp value={streak} />
                     </span>
                     <span className="text-base font-bold text-white/70 dark:text-subtle">
                        {t("dashboard.day", { count: streak })}
                     </span>
                  </div>
               </div>
               <div className="relative z-10 flex items-center justify-center gap-2 mt-3">
                  <TrendingUp size={16} className="text-white/70 dark:text-subtle" />
                  <span className="text-sm font-bold text-white/70 dark:text-subtle">
                     {streak > 0 ? t("dashboard.streak_keep") : t("dashboard.streak_start")}
                  </span>
               </div>
            </motion.div>
         </motion.div>
      </div>
   )
}
