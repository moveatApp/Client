import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import confetti from "canvas-confetti"
import { useStore } from "@/store/useStore"
import { useWebHaptics } from "web-haptics/react"
import {
   CheckCircle,
   CircleDashed,
   Flame,
   Plus,
   Play,
   Droplet,
   ListTodo,
   Sparkles,
   Check,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import WeightChart from "@/components/WeightChart"

export default function Home() {
   const navigate = useNavigate()
   const { isOnboarded, user, streak, targetCalories, dailyCalories, waterGlasses, resetWater, addWater } =
      useStore()
   const { trigger } = useWebHaptics({ debug: true })
   const hydrationButtonRef = useRef<HTMLButtonElement>(null)
   const [mounted, setMounted] = useState(false)
   const [isCompletingWater, setIsCompletingWater] = useState(false)

   useEffect(() => {
      setMounted(true)
      if (!isOnboarded) {
         navigate("/onboarding")
      }
   }, [isOnboarded, navigate])

   if (!mounted || !isOnboarded || !user) return null

   const todayProgress = Math.min((dailyCalories / targetCalories) * 100, 100)

   const handleWaterClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isCompletingWater) return

      const nextGlasses = waterGlasses + 1
      addWater()

      if (nextGlasses === 10) {
         setIsCompletingWater(true)
         
         const cardElement = hydrationButtonRef.current?.closest('section')
         if (cardElement) {
            const rect = cardElement.getBoundingClientRect()
            const x = (rect.left + rect.width / 2) / window.innerWidth
            const y = (rect.top + rect.height / 2) / window.innerHeight
            
            setTimeout(() => {
               trigger("success")
               confetti({
                  particleCount: 25,
                  spread: 45,
                  origin: { x, y },
                  colors: ["#38BDF8", "#7DD3FC", "#ffffff"],
                  gravity: 1.5,
                  scalar: 0.5,
                  zIndex: 1000
               })
            }, 150)
         }

         setTimeout(() => {
            setIsCompletingWater(false)
            resetWater()
         }, 1500)
      }
   }

   return (
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-6 animate-fade-in flex flex-col w-full h-full min-h-screen">
         <header className="flex justify-between items-center mb-6 shrink-0">
            <div>
               <div className="flex items-center gap-2 mb-1 md:hidden">
                  <img
                     src="/logo-manzana.png"
                     alt="MovEat"
                     className="h-15 w-auto"
                  />
                  <span className="font-display font-extrabold text-lg tracking-tight text-foreground">
                     MovEat
                  </span>
               </div>
               <h1 className="text-3xl font-display font-extrabold text-foreground mt-4 md:mt-0">
                  Hola, {user.name}! 👋
               </h1>
            </div>
         </header>

         <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 flex-1 w-full shrink-0">
            {/* Chart card - Always 2 columns (Full width on mobile) */}
            <motion.section
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="col-span-2 bg-card-bg rounded-[32px] p-6 shadow-sm border border-card-border flex flex-col justify-between min-h-[280px]">
               <div className="flex justify-between items-start mb-2">
                  <div>
                     <h2 className="text-4xl font-display font-bold text-foreground">
                        68.4{" "}
                        <span className="text-xl text-gray-400 font-normal">kg</span>
                     </h2>
                     <p className="text-sm font-bold text-primary flex items-center gap-1 mt-1">
                        Evolución de Peso <Flame size={14} />
                     </p>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-xs font-bold">
                     Objetivo: 65 kg
                  </div>
               </div>

               <div className="flex-1 w-full -ml-4">
                  <WeightChart />
               </div>
            </motion.section>

            {/* Daily circular progress - 1 column on mobile, Row same as hydration */}
            <motion.section
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.1 }}
               className="col-span-1 bg-card-bg rounded-[32px] p-6 shadow-sm border border-card-border flex flex-col justify-between items-center text-center min-h-[280px]">
               <div className="w-full flex justify-between items-center mb-2">
                  <h3 className="font-bold text-xl">
                     {Math.round(todayProgress)}
                     <span className="text-gray-400 text-sm">%</span>
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                     Resumen Diario
                  </span>
               </div>

               <div className="relative w-32 h-32 xl:w-40 xl:h-40 flex items-center justify-center flex-1 max-h-[160px]">
                  <svg
                     viewBox="0 0 36 36"
                     className="w-full h-full transform -rotate-90 drop-shadow-md">
                     <path
                        className="text-gray-100 dark:text-white/5"
                        strokeWidth="5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.5 a 15.5 15.5 0 0 1 0 31.0 a 15.5 15.5 0 0 1 0 -31.0"
                     />
                     <path
                        className="text-primary transition-all duration-1000"
                        strokeWidth="5"
                        strokeDasharray={`${todayProgress}, 100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.5 a 15.5 15.5 0 0 1 0 31.0 a 15.5 15.5 0 0 1 0 -31.0"
                     />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-[10px] font-bold text-gray-400 mb-0.5">
                        Calorías
                     </span>
                     <Flame className="text-primary" size={20} />
                  </div>
               </div>

               <div className="flex gap-2 w-full mt-2">
                  <button
                     onClick={() => navigate("/nutrition")}
                     className="flex-1 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-foreground">
                     <Plus size={14} /> Comida
                  </button>
               </div>
            </motion.section>

            {/* Hidratación card */}
            <motion.section
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="col-span-1 bg-water text-white rounded-[32px] p-5 shadow-sm flex flex-col justify-between group cursor-pointer relative overflow-hidden min-h-[140px] md:min-h-[140px]">
               <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm">
                     Hidratación
                  </h3>
                  {useStore.getState().waterLiters > 0 && (
                     <div className="text-xs font-bold opacity-80">
                        {useStore.getState().waterLiters}L
                     </div>
                  )}
               </div>

               <div className="flex gap-3 my-2 items-center justify-center relative">
               <AnimatePresence mode="wait">
                     {isCompletingWater ? (
                        <motion.div
                           key="complete"
                           initial={{ scale: 0, rotate: -180 }}
                           animate={{ scale: 1, rotate: 0 }}
                           exit={{ scale: 0 }}
                           className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-water shadow-xl"
                        >
                           <motion.div
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                           >
                              <Check size={24} strokeWidth={3} />
                           </motion.div>
                        </motion.div>
                     ) : (
                        <div className="grid grid-cols-5 gap-x-2 gap-y-2 justify-items-center mt-2">
                           {[...Array(10)].map((_, i) => (
                              <motion.div
                                 key={i}
                                 onClick={handleWaterClick}
                                 className={`cursor-pointer transition-all duration-300 flex items-center justify-center ${
                                    i < waterGlasses
                                       ? "text-white scale-110 drop-shadow-sm"
                                       : "text-white/30 scale-100 hover:text-white/50"
                                 }`}>
                                 <Droplet
                                    size={24}
                                    strokeWidth={i < waterGlasses ? 0 : 2}
                                    fill={i < waterGlasses ? "currentColor" : "none"}
                                 />
                              </motion.div>
                           ))}
                        </div>
                     )}
                  </AnimatePresence>
               </div>

               <div className="relative z-10 flex items-end justify-between w-full">
                  <div className="flex flex-col">
                     <span className="text-3xl font-display font-bold">
                        {waterGlasses * 100}
                        <span className="text-lg font-normal opacity-70 ml-1">ml</span>
                     </span>
                  </div>
                  <button
                     onClick={handleWaterClick}
                     ref={hydrationButtonRef}
                     disabled={isCompletingWater}
                     className={`w-10 h-10 bg-white text-water rounded-full flex items-center justify-center shadow-lg transition-all ${isCompletingWater ? 'opacity-0 scale-50' : 'group-hover:scale-110 active:scale-95'}`}>
                     <Plus size={20} />
                  </button>
               </div>
            </motion.section>

            {/* Entrenamiento card */}
            <motion.section
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.3 }}
               onClick={() => navigate("/training")}
               className="col-span-2 xl:col-span-1 bg-foreground rounded-[32px] p-5 shadow-sm flex flex-col justify-between group cursor-pointer relative overflow-hidden min-h-[140px]">
               <div className="absolute inset-0 right-0 bg-primary/10 z-0" />
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                     <Sparkles size={16} className="text-accent" />
                     <h3 className="font-bold text-sm text-background">Para hoy</h3>
                  </div>
                  <h4 className="text-lg font-display font-bold mb-0.5 line-clamp-1 text-background">
                     Express Postura y Fuerza
                  </h4>
               </div>
               <div className="relative z-20 flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 text-accent">
                     <CheckCircle size={14} />
                     <span className="text-xs font-bold">200 XP</span>
                  </div>
                  <button className="w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                     <Play size={18} fill="currentColor" className="ml-0.5" />
                  </button>
               </div>
            </motion.section>
         </div>
      </div>
   )
}
