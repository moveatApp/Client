import { useState } from "react"
import { useStore } from "@/store/useStore"
import { useTranslation } from "react-i18next"
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
} from "lucide-react"
import HabitsSection from "@/components/HabitsSection"
import PomodoroTimer from "@/components/PomodoroTimer"
import { CountUp } from "@/components/ui"
import { cardEnter, stagger } from "@/lib/motion"

export default function ProgressPage() {
   const {
      xp,
      level,
      streak,
      totalWorkouts,
      resetProgress,
      user,
      dailyCalories,
      targetCalories,
       workoutCompleted,
       waterLiters,
       waterGlasses,
       waterStreak,
       meals,
   } = useStore()
   const { t } = useTranslation("common")
   const nextLevelXp = level * 100
   const progressToNext = (xp / nextLevelXp) * 100

   const isPerfectDay = workoutCompleted && meals.length >= 3 && waterGlasses >= 10
    const isHydrationPro = waterStreak >= 5
   const isProfileComplete =
      !!user?.name && !!user?.goal && user.weight > 0 && user.height > 0
   const isHighBurn = dailyCalories < targetCalories - 500 && workoutCompleted

   // Stable i18n keys; name/description come from `progress.badges.<key>`.
   const badges = [
      { id: 1, key: "week", icon: Star, unlocked: streak >= 7 },
      { id: 2, key: "first_blood", icon: Zap, unlocked: totalWorkouts >= 1 },
      { id: 3, key: "perfect_day", icon: Target, unlocked: isPerfectDay },
      { id: 4, key: "hydration_pro", icon: Droplet, unlocked: isHydrationPro },
      {
         id: 5,
         key: "early_bird",
         icon: Clock,
         unlocked: totalWorkouts >= 5 && streak >= 3,
      },
      { id: 6, key: "warrior", icon: Shield, unlocked: totalWorkouts >= 10 },
      { id: 7, key: "all_in", icon: Rocket, unlocked: isHighBurn },
      { id: 8, key: "profile_complete", icon: Trophy, unlocked: isProfileComplete },
   ]

   return (
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-6 animate-fade-in font-sans w-full h-full min-h-screen flex flex-col">
         <header className="mb-6 shrink-0 flex justify-between items-center">
            <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight flex items-center gap-2">
               <Award size={32} className="text-primary" />
               {t("progress.header")}
            </h1>
             <button
                onClick={resetProgress}
                 className="text-caption text-subtle hover:text-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-button px-2 py-1">
                {t("progress.reset")}
             </button>
         </header>

         {/* Top Grid: Chart and Level */}
         <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
            <motion.section
               variants={cardEnter}
               className="md:col-span-2 xl:col-span-2 bg-card-bg/40 rounded-[32px] p-6 shadow-sm border border-card-border flex flex-col min-h-[280px]">
               <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Droplet size={20} className="text-water" /> {t("habits.title")}
               </h2>
               <HabitsSection />
            </motion.section>

            <motion.section
               variants={cardEnter}
               className="md:col-span-2 xl:col-span-1 bg-level-card-bg rounded-[32px] p-6 border border-card-border soft-raised relative overflow-hidden flex flex-col justify-between min-h-[280px]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
               <div className="flex justify-between items-center relative z-10 w-full mb-6">
                  <div>
                       <span className="text-caption text-foreground/60">
                         {t("progress.level")}
                      </span>
                      <h2 className="text-5xl font-display font-extrabold mt-1 text-foreground">
                        <CountUp value={level} />
                     </h2>
                  </div>
                  <div className="bg-primary/10 w-12 h-12 rounded-2xl border border-primary/10 flex items-center justify-center">
                     <Flame className="text-primary w-6 h-6" fill="currentColor" />
                  </div>
               </div>
               <div className="relative z-10 w-full mt-auto">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-subtle/80"><CountUp value={xp} /> XP</span>
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
                      {t("progress.xp_remaining", { xp: nextLevelXp - xp })}
                   </p>
               </div>
            </motion.section>

            <motion.section
               variants={cardEnter}
               className="md:col-span-2 xl:col-span-3 bg-card-bg/40 rounded-[32px] p-6 shadow-sm border border-card-border">
               <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-primary" /> {t("pomodoro.title")}
               </h2>
               <PomodoroTimer />
            </motion.section>
         </motion.div>

         {/* Stats + Badges Area: Reversed for Mobile ONLY using flex-col-reverse */}
         <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col-reverse xl:grid xl:grid-cols-4 gap-4 lg:gap-6 flex-1">
            {/* Achievements Section - Spans 3 columns on Desktop */}
            <motion.section
               variants={cardEnter}
               className="xl:col-span-3 bg-card-bg rounded-[32px] p-6 border border-card-border soft-raised">
               <h3 className="font-bold text-base mb-4 text-foreground flex items-center gap-2">
                  <Star fill="currentColor" size={18} className="text-accent" />
                  {t("progress.achievements")}
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
                                 {t(`progress.badges.${badge.key}.name`)}
                              </h4>
                               <p className="text-xs text-subtle font-medium leading-tight">
                                 {t(`progress.badges.${badge.key}.desc`)}
                              </p>
                           </div>
                        </div>
                     )
                  })}
               </div>
            </motion.section>

            {/* Stats (Streak/Workouts) - Above Logros on mobile */}
            <motion.div
               variants={cardEnter}
               className="grid grid-cols-2 xl:grid-cols-1 gap-4 lg:gap-6 h-full xl:col-span-1">
               <div className="bg-card-bg rounded-[32px] p-5 border border-card-border soft-raised flex flex-col justify-center items-center text-center flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-2">
                     <Flame size={24} fill="currentColor" />
                  </div>
                  <span className="text-3xl font-display font-bold text-foreground block leading-tight">
                     <CountUp value={streak} />
                  </span>
                   <span className="text-caption text-subtle">
                      {t("progress.streak")}
                   </span>
               </div>
               <div className="bg-card-bg rounded-[32px] p-5 border border-card-border soft-raised flex flex-col justify-center items-center text-center flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                     <Zap size={24} fill="currentColor" />
                  </div>
                  <span className="text-3xl font-display font-bold text-foreground block leading-tight">
                     <CountUp value={totalWorkouts} />
                  </span>
                   <span className="text-caption text-subtle">
                      {t("progress.workouts")}
                   </span>
               </div>
            </motion.div>
         </motion.div>
      </div>
   )
}
