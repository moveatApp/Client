import { useStore } from "@/store/useStore"
import { motion } from "framer-motion"
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
   Trophy 
} from "lucide-react"
import WeightChart from "@/components/WeightChart"

export default function ProgressPage() {
   const { xp, level, streak, totalWorkouts, resetProgress } = useStore()
   const nextLevelXp = level * 100
   const progressToNext = (xp / nextLevelXp) * 100

   const badges = [
      { id: 1, name: "Seman completa", icon: Star, unlocked: streak >= 7, description: "7 días seguidos activo" },
      { id: 2, name: "First Blood", icon: Zap, unlocked: totalWorkouts >= 1, description: "Primer entreno completado" },
      { id: 3, name: "Día Perfecto", icon: Target, unlocked: false, description: "Dieta y entreno logrados" },
      { id: 4, name: "Hidratación PRO", icon: Droplet, unlocked: false, description: "3 litros en un solo día" },
      { id: 5, name: "Madrugador", icon: Clock, unlocked: false, description: "Entreno antes de las 8 AM" },
      { id: 6, name: "Guerrero", icon: Shield, unlocked: totalWorkouts >= 10, description: "10 entrenos totales" },
      { id: 7, name: "A tope", icon: Rocket, unlocked: false, description: "Quemaste +500 kcal extra" },
      { id: 8, name: "Socialite", icon: Trophy, unlocked: true, description: "Perfil completado al 100%" },
   ]

   return (
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-6 animate-fade-in font-sans w-full h-full min-h-screen flex flex-col">
         <header className="mb-6 shrink-0 flex justify-between items-center">
            <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight flex items-center gap-2">
               <Award size={32} className="text-primary" />
               Tu Progreso
            </h1>
            <button onClick={resetProgress} className="text-[10px] uppercase font-bold text-gray-400 hover:text-red-500 transition-colors">
               Reiniciar Todo
            </button>
         </header>

         {/* Top Grid: Chart and Level */}
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
            <motion.section
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="md:col-span-2 xl:col-span-2 bg-card-bg rounded-[32px] p-6 shadow-sm border border-card-border flex flex-col justify-between min-h-[280px]">
               <div className="flex justify-between items-start mb-2">
                  <div>
                     <h2 className="text-4xl font-display font-bold text-foreground">68.4 <span className="text-xl text-gray-400 font-normal">kg</span></h2>
                     <p className="text-sm font-bold text-primary flex items-center gap-2 mt-1">Evolución de Peso <Flame size={16} /></p>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-xs font-bold">Objetivo: 65 kg</div>
               </div>
               <div className="flex-1 w-full -ml-4"><WeightChart /></div>
            </motion.section>

            <motion.section
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="md:col-span-2 xl:col-span-1 bg-level-card-bg rounded-[32px] p-6 shadow-sm border border-card-border relative overflow-hidden flex flex-col justify-between min-h-[280px]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
               <div className="flex justify-between items-center relative z-10 w-full mb-6">
                  <div>
                     <span className="text-[10px] text-gray-700 font-bold uppercase tracking-wider">Nivel Actual</span>
                     <h2 className="text-5xl font-display font-extrabold mt-1 text-[#2C2C2C]">{level}</h2>
                  </div>
                  <div className="bg-primary/10 w-12 h-12 rounded-2xl border border-primary/10 flex items-center justify-center">
                     <Flame className="text-primary w-6 h-6" fill="currentColor" />
                  </div>
               </div>
               <div className="relative z-10 w-full mt-auto">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                     <span className="text-primary/80">{xp} XP</span>
                     <span className="text-gray-600">{nextLevelXp} XP</span>
                  </div>
                  <div className="h-3 bg-black/5 rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full" />
                  </div>
                  <p className="text-[10px] text-gray-600 mt-2 font-medium text-center">Faltan {nextLevelXp - xp} XP</p>
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
               className="xl:col-span-3 bg-card-bg rounded-[32px] p-6 border border-card-border shadow-sm">
               <h3 className="font-bold text-base mb-4 text-foreground flex items-center gap-2">
                  <Star fill="currentColor" size={18} className="text-accent" />
                  Logros Obtenidos
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {badges.map((badge) => {
                     const Icon = badge.icon
                     return (
                        <div key={badge.id} className={`bg-gray-50 dark:bg-white/5 rounded-2xl p-4 flex items-center gap-4 transition-all ${badge.unlocked ? "border-primary/20 shadow-sm opacity-100" : "border-gray-100 dark:border-white/5 opacity-60 grayscale"} border`}>
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${badge.unlocked ? "bg-primary/20 text-primary" : "bg-gray-200 dark:bg-white/10 text-gray-400"}`}>
                              {badge.unlocked ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                           </div>
                           <div>
                              <h4 className="font-bold text-foreground text-sm">{badge.name}</h4>
                              <p className="text-xs text-gray-400 font-medium leading-tight">{badge.description}</p>
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
                  className="bg-card-bg rounded-[32px] p-5 border border-card-border shadow-sm flex flex-col justify-center items-center text-center flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-2">
                     <Flame size={24} fill="currentColor" />
                  </div>
                  <span className="text-3xl font-display font-bold text-foreground block leading-tight">{streak}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Racha</span>
               </motion.div>
               <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="bg-card-bg rounded-[32px] p-5 border border-card-border shadow-sm flex flex-col justify-center items-center text-center flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                     <Zap size={24} fill="currentColor" />
                  </div>
                  <span className="text-3xl font-display font-bold text-foreground block leading-tight">{totalWorkouts}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Entrenos</span>
               </motion.div>
            </div>
         </div>
      </div>
   )
}
