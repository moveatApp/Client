import { useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useStore } from "@/store/useStore"
import { motion, AnimatePresence } from "framer-motion"
import { useWebHaptics } from "web-haptics/react"
import { emojiBlast } from "emoji-blast"
import {
   ArrowRight,
   ArrowLeft,
   TrendingDown,
   Dumbbell,
   Scale,
   Heart,
   Zap,
   Flame,
   Timer,
   Clock,
   Hourglass,
   Utensils,
   Carrot,
   Leaf,
   WheatOff,
   User,
   CheckCircle2,
   ChevronRight,
   Smile,
   Meh,
   Frown,
   Battery,
   BatteryLow,
   BatteryFull,
   Mars,
   Venus,
   VenusAndMars,
   Sun,
   Moon,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
   name: string
   goal: string
   gender: string
   age: number
   weight: number
   height: number
   level: string
   timePerSession: number
   preferences: string[]
   vibe: string
}

// ─── Step configs ─────────────────────────────────────────────────────────────

const STEPS = [
   "welcome",
   "name",
   "goal",
   "gender",
   "age",
   "metrics",
   "level",
   "time",
   "preferences",
   "vibe",
   "fooddemo",
   "summary",
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const goalLabels: Record<string, string> = {
   baja_peso: "Bajar de peso",
   gana_masa: "Ganar masa",
   mantiene: "Mantener peso",
   bienestar: "Bienestar",
}
const levelLabels: Record<string, string> = {
   principiante: "Principiante",
   intermedio: "Intermedio",
   avanzado: "Avanzado",
}
const vibeLabels: Record<string, string> = {
   great: "¡Con toda la energía!",
   ok: "Bien, puedo mejorar",
   low: "Necesito un empujón",
}

// ─── Slide wrapper ────────────────────────────────────────────────────────────

function Slide({ children, dir = 1 }: { children: React.ReactNode; dir?: number }) {
   return (
      <motion.div
         initial={{ x: dir * 40, opacity: 0 }}
         animate={{ x: 0, opacity: 1 }}
         exit={{ x: -dir * 40, opacity: 0 }}
         transition={{ duration: 0.3, ease: "easeInOut" }}
         className="flex flex-col h-full">
         {children}
      </motion.div>
   )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Onboarding() {
   const navigate = useNavigate()
   const { completeOnboarding, isDarkMode, toggleDarkMode } = useStore()
   const { trigger } = useWebHaptics()
   const [stepIdx, setStepIdx] = useState(0)
   const [dir, setDir] = useState(1)
   const [form, setForm] = useState<FormData>({
      name: "",
      goal: "",
      gender: "",
      age: 25,
      weight: 70,
      height: 170,
      level: "",
      timePerSession: 30,
      preferences: [],
      vibe: "",
   })
   // Food demo step state
   const [demoFood, setDemoFood] = useState("")
   const [demoAdded, setDemoAdded] = useState(false)
   const addBtnRef = useRef<HTMLButtonElement>(null)

   const step = STEPS[stepIdx]
   const isFirst = stepIdx === 0
   const isLast = stepIdx === STEPS.length - 1

   const go = (delta: number) => {
      trigger("light")
      setDir(delta)
      setStepIdx((s) => s + delta)
   }

   const fireFoodEmojis = useCallback(() => {
      const btnRect = addBtnRef.current?.getBoundingClientRect()
      const x = btnRect ? btnRect.left + btnRect.width / 2 : window.innerWidth / 2
      const y = btnRect ? btnRect.top : window.innerHeight - 100

      // Todos los haptics deben dispararse SINCRÓNICAMENTE en el user gesture
      // (los browsers bloquean vibrate() en callbacks async/setTimeout)
      if (window.navigator && window.navigator.vibrate) {
         window.navigator.vibrate([
            25, 80, 25, 80, 25, 80, 25, 80, 25, 80, 25, 80, 25, 80, 25, 80,
         ])
      }

      // Solo el efecto visual usa setTimeout
      for (let i = 0; i < 14; i++) {
         setTimeout(() => {
            emojiBlast({
               emojis: [
                  "🍎",
                  "🥑",
                  "🍗",
                  "🥦",
                  "🍳",
                  "🥗",
                  "🍌",
                  "🍇",
                  "🥕",
                  "🫐",
                  "🥩",
                  "🍚",
                  "🍕",
                  "🌮",
                  "🥐",
                  "🍜",
               ],
               emojiCount: 5,
               physics: {
                  gravity: 0.25,
                  initialVelocities: {
                     rotation: { min: -15, max: 15 },
                     x: { min: -10, max: 10 }, // Menos hacia los costados
                     y: { min: -40, max: -25 }, // Más hacia arriba
                  },
               },
               position: { x, y },
            })
         }, i * 90) // 120ms entre cada ráfaga
      }
   }, [trigger])

   const handleFoodDemo = () => {
      if (!demoFood.trim()) return
      fireFoodEmojis()
      setDemoAdded(true)
   }

   const canContinue = () => {
      if (step === "name") return form.name.trim().length > 0
      if (step === "goal") return !!form.goal
      if (step === "gender") return !!form.gender
      if (step === "level") return !!form.level
      if (step === "vibe") return !!form.vibe
      if (step === "preferences") return form.preferences.length > 0
      return true
   }

   const finish = () => {
      completeOnboarding({
         name: form.name || "Usuario",
         goal: (form.goal || "bienestar") as any,
         level: (form.level || "principiante") as any,
         weight: form.weight,
         workoutsPerWeek:
            form.level === "principiante" ? 2 : form.level === "intermedio" ? 3 : 5,
         timePerSession: form.timePerSession,
         preferences: form.preferences.length > 0 ? form.preferences : ["ninguna"],
      })
      navigate("/")
   }

   const togglePref = (val: string) => {
      if (val === "ninguna") {
         setForm({ ...form, preferences: ["ninguna"] })
         return
      }
      const filtered = form.preferences.filter((p) => p !== "ninguna")
      setForm({
         ...form,
         preferences: filtered.includes(val)
            ? filtered.filter((p) => p !== val)
            : [...filtered, val],
      })
   }

   // ─── Progress (excluding welcome + summary) ────────────────────────────────
   const progressSteps = STEPS.filter((s) => s !== "welcome" && s !== "summary")
   const progressIdx = progressSteps.indexOf(step)
   const showProgress = progressIdx >= 0

   return (
      <div className="flex flex-col h-full bg-background font-sans select-none relative">
         <button
            onClick={toggleDarkMode}
            className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full border border-card-border bg-card-bg flex items-center justify-center text-foreground shadow-sm"
         >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
         </button>

         {/* ── Header ── */}
         {!isFirst && step !== "summary" && (
            <div className="flex items-center px-6 pt-6 pb-2 gap-4 shrink-0 pr-16">
               <button
                  onClick={() => go(-1)}
                  className="w-10 h-10 rounded-full border border-card-border bg-card-bg flex items-center justify-center text-foreground shadow-sm">
                  <ArrowLeft size={18} />
               </button>

               {showProgress && (
                  <div className="flex-1 flex gap-1.5">
                     {progressSteps.map((_, i) => (
                        <div
                           key={i}
                           className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                              i <= progressIdx ? "bg-primary" : "bg-card-border"
                           }`}
                        />
                     ))}
                  </div>
               )}

               <span className="text-xs font-bold text-gray-400 w-10 text-right">
                  {progressIdx + 1}/{progressSteps.length}
               </span>
            </div>
         )}

         {/* ── Content ── */}
         <div className="flex-1 flex flex-col px-6 py-4 overflow-hidden">
            <AnimatePresence mode="wait">
               <Slide key={step} dir={dir}>
                  {/* ══ WELCOME ══════════════════════════════════════════════ */}
                  {step === "welcome" && (
                     <div className="flex flex-col items-center justify-center flex-1 text-center gap-6">
                        <motion.div
                           initial={{ scale: 0.8, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           transition={{
                              delay: 0.1,
                              type: "spring",
                              stiffness: 200,
                           }}
                           className="w-28 h-28 rounded-[36px] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-xl shadow-primary/10">
                           <img
                              src="/logo-manzana.png"
                              alt="MovEat"
                              className="w-20 h-20 object-contain"
                              onError={(e) => {
                                 ;(e.target as HTMLImageElement).style.display =
                                    "none"
                              }}
                           />
                           <Flame size={56} className="text-primary hidden" />
                        </motion.div>

                        <div>
                           <h1 className="text-5xl font-display font-extrabold text-foreground tracking-tight leading-none mb-3">
                              Bienvenido a MovEat
                           </h1>
                           <p className="text-gray-400 font-medium text-base max-w-[260px] mx-auto leading-relaxed">
                              Tu compañero de entrenamiento, nutrición y bienestar.
                              Vamos a personalizar tu experiencia.
                           </p>
                        </div>

                        <div className="flex flex-col gap-2 w-full max-w-[320px] mt-4">
                           {[
                              { icon: Flame, text: "Rutinas adaptadas a tu nivel" },
                              {
                                 icon: Utensils,
                                 text: "Seguimiento nutricional inteligente",
                              },
                              { icon: Heart, text: "Progreso visible cada día" },
                           ].map(({ icon: Icon, text }) => (
                              <div
                                 key={text}
                                 className="flex items-center gap-3 bg-card-bg border border-card-border rounded-2xl px-4 py-3 shadow-sm">
                                 <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Icon size={16} className="text-primary" />
                                 </div>
                                 <span className="text-sm font-semibold text-foreground">
                                    {text}
                                 </span>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* ══ NAME ═════════════════════════════════════════════════ */}
                  {step === "name" && (
                     <div className="flex flex-col flex-1 justify-center gap-8">
                        <div>
                           <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">
                              Paso 1
                           </p>
                           <h2 className="text-4xl font-display font-extrabold text-foreground leading-tight">
                              ¿Cómo te llamás?
                           </h2>
                        </div>

                        <div className="relative">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                              <User size={20} className="text-primary" />
                           </div>
                           <input
                              autoFocus
                              type="text"
                              placeholder="Tu nombre aquí"
                              className="w-full pl-16 pr-4 py-5 text-xl font-bold bg-card-bg border-2 border-card-border focus:border-primary rounded-2xl outline-none text-foreground placeholder-gray-300 transition-colors"
                              value={form.name}
                              onChange={(e) =>
                                 setForm({ ...form, name: e.target.value })
                              }
                              onKeyDown={(e) =>
                                 e.key === "Enter" && form.name && go(1)
                              }
                           />
                        </div>

                        <p className="text-gray-400 text-sm font-medium">
                           Usaremos tu nombre para personalizar la experiencia.
                        </p>
                     </div>
                  )}

                  {/* ══ GOAL ═════════════════════════════════════════════════ */}
                  {step === "goal" && (
                     <div className="flex flex-col flex-1 justify-center gap-6">
                        <div>
                           <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">
                              Objetivo
                           </p>
                           <h2 className="text-4xl font-display font-extrabold text-foreground leading-tight">
                              ¿Qué querés lograr?
                           </h2>
                        </div>

                        <div className="flex flex-col gap-3">
                           {[
                              {
                                 value: "baja_peso",
                                 label: "Bajar de peso",
                                 sub: "Déficit calórico y cardio",
                                 icon: TrendingDown,
                              },
                              {
                                 value: "gana_masa",
                                 label: "Ganar masa muscular",
                                 sub: "Superávit y fuerza",
                                 icon: Dumbbell,
                              },
                              {
                                 value: "mantiene",
                                 label: "Mantener mi peso",
                                 sub: "Balance energético",
                                 icon: Scale,
                              },
                              {
                                 value: "bienestar",
                                 label: "Bienestar y energía",
                                 sub: "Hábitos sostenibles",
                                 icon: Heart,
                              },
                           ].map((opt) => {
                              const Icon = opt.icon
                              const selected = form.goal === opt.value
                              return (
                                 <button
                                    key={opt.value}
                                    onClick={() => {
                                       setForm({ ...form, goal: opt.value })
                                       setTimeout(() => go(1), 180)
                                    }}
                                    className={`p-5 rounded-2xl text-left border-2 flex items-center gap-4 transition-all ${
                                       selected
                                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                          : "border-card-border bg-card-bg hover:border-primary/30"
                                    }`}>
                                    <div
                                       className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-primary text-white" : "bg-gray-100 text-gray-400 dark:bg-white/5"}`}>
                                       <Icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                       <div className="font-bold text-base text-foreground">
                                          {opt.label}
                                       </div>
                                       <div className="text-xs text-gray-400 font-medium">
                                          {opt.sub}
                                       </div>
                                    </div>
                                    {selected && (
                                       <CheckCircle2
                                          size={20}
                                          className="text-primary shrink-0"
                                       />
                                    )}
                                 </button>
                              )
                           })}
                        </div>
                     </div>
                  )}

                  {/* ══ GENDER ═══════════════════════════════════════════════ */}
                  {step === "gender" && (
                     <div className="flex flex-col flex-1 justify-center gap-8">
                        <div>
                           <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">
                              Perfil
                           </p>
                           <h2 className="text-4xl font-display font-extrabold text-foreground leading-tight">
                              ¿Con qué te identificás?
                           </h2>
                           <p className="text-gray-400 text-sm font-medium mt-2">
                              Esto ajusta tus parámetros metabólicos.
                           </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                           {[
                              { value: "male", label: "Hombre", icon: Mars },
                              { value: "female", label: "Mujer", icon: Venus },
                              { value: "other", label: "Otro", icon: VenusAndMars },
                           ].map((opt) => {
                              const Icon = opt.icon
                              const selected = form.gender === opt.value
                              return (
                                 <button
                                    key={opt.value}
                                    onClick={() => {
                                       setForm({ ...form, gender: opt.value })
                                       setTimeout(() => go(1), 180)
                                    }}
                                    className={`py-6 rounded-2xl flex flex-col items-center gap-3 border-2 transition-all ${
                                       selected
                                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                          : "border-card-border bg-card-bg hover:border-primary/30"
                                    }`}>
                                    <div
                                       className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-primary text-white" : "bg-gray-100 text-gray-400 dark:bg-white/5"}`}>
                                       <Icon size={24} />
                                    </div>
                                    <span className="font-bold text-sm text-foreground">
                                       {opt.label}
                                    </span>
                                 </button>
                              )
                           })}
                        </div>
                     </div>
                  )}

                  {/* ══ AGE ══════════════════════════════════════════════════ */}
                  {step === "age" && (
                     <div className="flex flex-col flex-1 justify-center gap-8">
                        <div>
                           <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">
                              Perfil
                           </p>
                           <h2 className="text-4xl font-display font-extrabold text-foreground leading-tight">
                              ¿Cuántos años tenés?
                           </h2>
                        </div>

                        <div className="flex flex-col items-center gap-6">
                           <div className="text-8xl font-display font-extrabold text-primary tabular-nums">
                              {form.age}
                           </div>
                           <div className="text-gray-400 font-bold">años</div>
                           <input
                              type="range"
                              min={13}
                              max={80}
                              value={form.age}
                              onChange={(e) =>
                                 setForm({ ...form, age: parseInt(e.target.value) })
                              }
                              className="w-full accent-primary h-2"
                           />
                           <div className="flex justify-between w-full text-xs text-gray-400 font-bold">
                              <span>13</span>
                              <span>80</span>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* ══ METRICS ══════════════════════════════════════════════ */}
                  {step === "metrics" && (
                     <div className="flex flex-col flex-1 justify-center gap-8">
                        <div>
                           <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">
                              Tu cuerpo
                           </p>
                           <h2 className="text-4xl font-display font-extrabold text-foreground leading-tight">
                              Peso y altura
                           </h2>
                        </div>

                        <div className="flex flex-col gap-6">
                           {/* Weight */}
                           <div className="bg-card-bg border border-card-border rounded-3xl p-6 shadow-sm">
                              <div className="flex justify-between items-center mb-4">
                                 <span className="font-bold text-sm text-gray-400 uppercase tracking-wider">
                                    Peso
                                 </span>
                                 <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-display font-extrabold text-primary tabular-nums">
                                       {form.weight}
                                    </span>
                                    <span className="text-gray-400 font-bold">
                                       kg
                                    </span>
                                 </div>
                              </div>
                              <input
                                 type="range"
                                 min={30}
                                 max={200}
                                 value={form.weight}
                                 onChange={(e) =>
                                    setForm({
                                       ...form,
                                       weight: parseInt(e.target.value),
                                    })
                                 }
                                 className="w-full accent-primary h-2"
                              />
                              <div className="flex justify-between mt-1 text-xs text-gray-300 font-bold">
                                 <span>30 kg</span>
                                 <span>200 kg</span>
                              </div>
                           </div>

                           {/* Height */}
                           <div className="bg-card-bg border border-card-border rounded-3xl p-6 shadow-sm">
                              <div className="flex justify-between items-center mb-4">
                                 <span className="font-bold text-sm text-gray-400 uppercase tracking-wider">
                                    Altura
                                 </span>
                                 <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-display font-extrabold text-primary tabular-nums">
                                       {form.height}
                                    </span>
                                    <span className="text-gray-400 font-bold">
                                       cm
                                    </span>
                                 </div>
                              </div>
                              <input
                                 type="range"
                                 min={130}
                                 max={220}
                                 value={form.height}
                                 onChange={(e) =>
                                    setForm({
                                       ...form,
                                       height: parseInt(e.target.value),
                                    })
                                 }
                                 className="w-full accent-primary h-2"
                              />
                              <div className="flex justify-between mt-1 text-xs text-gray-300 font-bold">
                                 <span>130 cm</span>
                                 <span>220 cm</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* ══ LEVEL ════════════════════════════════════════════════ */}
                  {step === "level" && (
                     <div className="flex flex-col flex-1 justify-center gap-6">
                        <div>
                           <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">
                              Actividad
                           </p>
                           <h2 className="text-4xl font-display font-extrabold text-foreground leading-tight">
                              ¿Cuál es tu nivel?
                           </h2>
                        </div>

                        <div className="flex flex-col gap-3">
                           {[
                              {
                                 value: "principiante",
                                 label: "Principiante",
                                 sub: "0-1 entrenamientos/sem",
                                 icon: BatteryLow,
                                 sessions: 2,
                              },
                              {
                                 value: "intermedio",
                                 label: "Intermedio",
                                 sub: "2-3 entrenamientos/sem",
                                 icon: Zap,
                                 sessions: 3,
                              },
                              {
                                 value: "avanzado",
                                 label: "Avanzado",
                                 sub: "+4 entrenamientos/sem",
                                 icon: Flame,
                                 sessions: 5,
                              },
                           ].map((opt) => {
                              const Icon = opt.icon
                              const selected = form.level === opt.value
                              return (
                                 <button
                                    key={opt.value}
                                    onClick={() => {
                                       setForm({ ...form, level: opt.value })
                                       setTimeout(() => go(1), 180)
                                    }}
                                    className={`p-5 rounded-2xl text-left border-2 flex items-center gap-4 transition-all ${
                                       selected
                                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                          : "border-card-border bg-card-bg hover:border-primary/30"
                                    }`}>
                                    <div
                                       className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-primary text-white" : "bg-gray-100 text-gray-400 dark:bg-white/5"}`}>
                                       <Icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                       <div className="font-bold text-base text-foreground">
                                          {opt.label}
                                       </div>
                                       <div className="text-xs text-gray-400 font-medium">
                                          {opt.sub}
                                       </div>
                                    </div>
                                    {selected && (
                                       <CheckCircle2
                                          size={20}
                                          className="text-primary shrink-0"
                                       />
                                    )}
                                 </button>
                              )
                           })}
                        </div>
                     </div>
                  )}

                  {/* ══ TIME ═════════════════════════════════════════════════ */}
                  {step === "time" && (
                     <div className="flex flex-col flex-1 justify-center gap-8">
                        <div>
                           <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">
                              Sesiones
                           </p>
                           <h2 className="text-4xl font-display font-extrabold text-foreground leading-tight">
                              ¿Cuánto tiempo por sesión?
                           </h2>
                        </div>

                        <div className="flex flex-col gap-3">
                           {[
                              {
                                 value: 10,
                                 label: "Express",
                                 sub: "10 minutos",
                                 icon: Timer,
                              },
                              {
                                 value: 30,
                                 label: "Equilibrado",
                                 sub: "30 minutos",
                                 icon: Hourglass,
                              },
                              {
                                 value: 60,
                                 label: "Intensivo",
                                 sub: "1 hora o más",
                                 icon: Clock,
                              },
                           ].map((opt) => {
                              const Icon = opt.icon
                              const selected = form.timePerSession === opt.value
                              return (
                                 <button
                                    key={opt.value}
                                    onClick={() => {
                                       setForm({
                                          ...form,
                                          timePerSession: opt.value,
                                       })
                                       setTimeout(() => go(1), 180)
                                    }}
                                    className={`p-5 rounded-2xl text-left border-2 flex items-center gap-4 transition-all ${
                                       selected
                                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                          : "border-card-border bg-card-bg hover:border-primary/30"
                                    }`}>
                                    <div
                                       className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-primary text-white" : "bg-gray-100 text-gray-400 dark:bg-white/5"}`}>
                                       <Icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                       <div className="font-bold text-base text-foreground">
                                          {opt.label}
                                       </div>
                                       <div className="text-xs text-gray-400 font-medium">
                                          {opt.sub}
                                       </div>
                                    </div>
                                    {selected && (
                                       <CheckCircle2
                                          size={20}
                                          className="text-primary shrink-0"
                                       />
                                    )}
                                 </button>
                              )
                           })}
                        </div>
                     </div>
                  )}

                  {/* ══ PREFERENCES ══════════════════════════════════════════ */}
                  {step === "preferences" && (
                     <div className="flex flex-col flex-1 justify-center gap-6">
                        <div>
                           <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">
                              Alimentación
                           </p>
                           <h2 className="text-4xl font-display font-extrabold text-foreground leading-tight">
                              ¿Alguna preferencia?
                           </h2>
                           <p className="text-gray-400 text-sm font-medium mt-2">
                              Podés elegir más de una.
                           </p>
                        </div>

                        <div className="flex flex-col gap-3">
                           {[
                              {
                                 value: "ninguna",
                                 label: "Como de todo",
                                 icon: Utensils,
                              },
                              {
                                 value: "vegetariano",
                                 label: "Vegetariano",
                                 icon: Carrot,
                              },
                              { value: "vegano", label: "Vegano", icon: Leaf },
                              {
                                 value: "sintacc",
                                 label: "Sin TACC / Gluten Free",
                                 icon: WheatOff,
                              },
                           ].map((opt) => {
                              const Icon = opt.icon
                              const selected = form.preferences.includes(opt.value)
                              return (
                                 <button
                                    key={opt.value}
                                    onClick={() => togglePref(opt.value)}
                                    className={`p-5 rounded-2xl text-left border-2 flex items-center gap-4 transition-all ${
                                       selected
                                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                          : "border-card-border bg-card-bg hover:border-primary/30"
                                    }`}>
                                    <div
                                       className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-primary text-white" : "bg-gray-100 text-gray-400 dark:bg-white/5"}`}>
                                       <Icon size={24} />
                                    </div>
                                    <span className="font-bold text-base text-foreground flex-1">
                                       {opt.label}
                                    </span>
                                    {selected && (
                                       <CheckCircle2
                                          size={20}
                                          className="text-primary shrink-0"
                                       />
                                    )}
                                 </button>
                              )
                           })}
                        </div>
                     </div>
                  )}

                  {/* ══ VIBE ═════════════════════════════════════════════════ */}
                  {step === "vibe" && (
                     <div className="flex flex-col flex-1 justify-center gap-8">
                        <div>
                           <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">
                              Check-in
                           </p>
                           <h2 className="text-4xl font-display font-extrabold text-foreground leading-tight">
                              ¿Cómo te sentís hoy?
                           </h2>
                           <p className="text-gray-400 text-sm font-medium mt-2">
                              Esto nos ayuda a adaptar tu rutina de inicio.
                           </p>
                        </div>

                        <div className="flex flex-col gap-4">
                           {[
                              {
                                 value: "great",
                                 label: "¡Con toda la energía!",
                                 sub: "Listo para ir al 100%",
                                 icon: Smile,
                              },
                              {
                                 value: "ok",
                                 label: "Bien, puedo mejorar",
                                 sub: "Motivado pero tranquilo",
                                 icon: Meh,
                              },
                              {
                                 value: "low",
                                 label: "Necesito un empujón",
                                 sub: "Empecemos suave",
                                 icon: Frown,
                              },
                           ].map((opt) => {
                              const Icon = opt.icon
                              const selected = form.vibe === opt.value
                              return (
                                 <button
                                    key={opt.value}
                                    onClick={() => {
                                       setForm({ ...form, vibe: opt.value })
                                       setTimeout(() => go(1), 180)
                                    }}
                                    className={`p-5 rounded-2xl text-left border-2 flex items-center gap-4 transition-all ${
                                       selected
                                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                          : "border-card-border bg-card-bg hover:border-primary/30"
                                    }`}>
                                    <div
                                       className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-primary text-white" : "bg-gray-100 text-gray-400 dark:bg-white/5"}`}>
                                       <Icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                       <div className="font-bold text-base text-foreground">
                                          {opt.label}
                                       </div>
                                       <div className="text-xs text-gray-400 font-medium">
                                          {opt.sub}
                                       </div>
                                    </div>
                                    {selected && (
                                       <CheckCircle2
                                          size={20}
                                          className="text-primary shrink-0"
                                       />
                                    )}
                                 </button>
                              )
                           })}
                        </div>
                     </div>
                  )}

                  {/* ══ FOOD DEMO ════════════════════════════════════════════ */}
                  {step === "fooddemo" && (
                     <div className="flex flex-col flex-1 justify-center gap-6 relative">
                        <div>
                           <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">
                              Demo
                           </p>
                           <h2 className="text-4xl font-display font-extrabold text-foreground leading-tight">
                              Así agregás una comida
                           </h2>
                           <p className="text-gray-400 text-sm font-medium mt-2">
                              Escribí algo y probá como funciona el registro.
                           </p>
                        </div>

                        <div className="bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm">
                           <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-2xl px-4 mb-4">
                              <span className="text-2xl">🍽️</span>
                              <input
                                 type="text"
                                 placeholder="Ej: Avena con banana..."
                                 className="flex-1 py-4 bg-transparent outline-none font-semibold text-base text-foreground placeholder-gray-300"
                                 value={demoFood}
                                 onChange={(e) => setDemoFood(e.target.value)}
                                 disabled={demoAdded}
                              />
                           </div>

                           {demoAdded ? (
                              <motion.div
                                 initial={{ scale: 0.8, opacity: 0 }}
                                 animate={{ scale: 1, opacity: 1 }}
                                 className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
                                 <CheckCircle2
                                    size={24}
                                    className="text-primary shrink-0"
                                 />
                                 <div>
                                    <div className="font-bold text-sm text-foreground capitalize">
                                       {demoFood}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                       ~{250 + Math.floor(Math.random() * 200)} kcal
                                       · registrada ✓
                                    </div>
                                 </div>
                              </motion.div>
                           ) : (
                              <button
                                 ref={addBtnRef}
                                 onClick={handleFoodDemo}
                                 disabled={!demoFood.trim()}
                                 className="relative z-[9999999] w-full bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-40">
                                 <span className="text-lg">+</span> Agregar Comida
                              </button>
                           )}
                        </div>

                        {demoAdded && (
                           <p className="text-center text-sm text-gray-400 font-medium">
                              ¡Exactamente así de fácil! 🎉
                           </p>
                        )}
                     </div>
                  )}

                  {/* ══ SUMMARY ══════════════════════════════════════════════ */}
                  {step === "summary" && (
                     <div className="flex flex-col flex-1 justify-center gap-6">
                        <div className="text-center">
                           <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                 type: "spring",
                                 stiffness: 200,
                                 delay: 0.1,
                              }}
                              className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle2 size={40} className="text-primary" />
                           </motion.div>
                           <h2 className="text-3xl font-display font-extrabold text-foreground mb-1">
                              ¡Todo listo, {form.name.split(" ")[0]}!
                           </h2>
                           <p className="text-gray-400 text-sm font-medium">
                              Confirmá tu perfil antes de empezar.
                           </p>
                        </div>

                        <div className="bg-card-bg border border-card-border rounded-3xl p-5 space-y-4 shadow-sm">
                           {[
                              {
                                 label: "Objetivo",
                                 val: goalLabels[form.goal] || "—",
                              },
                              {
                                 label: "Nivel",
                                 val: levelLabels[form.level] || "—",
                              },
                              {
                                 label: "Peso / Altura",
                                 val: `${form.weight} kg / ${form.height} cm`,
                              },
                              {
                                 label: "Tiempo por sesión",
                                 val: `${form.timePerSession} minutos`,
                              },
                              {
                                 label: "Cómo me siento",
                                 val: vibeLabels[form.vibe] || "—",
                              },
                           ].map((row) => (
                              <div
                                 key={row.label}
                                 className="flex justify-between items-center py-1 border-b border-card-border/50 last:border-none">
                                 <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    {row.label}
                                 </span>
                                 <span className="font-bold text-sm text-foreground text-right max-w-[160px]">
                                    {row.val}
                                 </span>
                              </div>
                           ))}
                        </div>

                        <p className="text-center text-xs text-gray-400 font-medium">
                           Podés actualizar todo esto más adelante en tu perfil.
                        </p>
                     </div>
                  )}
               </Slide>
            </AnimatePresence>
         </div>

         {/* ── Footer CTA ── */}
         <div className="shrink-0 h-[88px] relative w-full">
            <AnimatePresence mode="wait">
               {(() => {
                  let btn = null
                  if (step === "welcome") {
                     btn = {
                        onClick: () => go(1),
                        label: "Empezar",
                        icon: <ChevronRight size={22} />,
                        disabled: false,
                     }
                  } else if (step === "summary") {
                     btn = {
                        onClick: finish,
                        label: "Ir al Dashboard 🚀",
                        icon: null,
                        disabled: false,
                     }
                  } else if (step === "fooddemo") {
                     btn = {
                        onClick: () => go(1),
                        label: "Continuar",
                        icon: <ArrowRight size={20} />,
                        disabled: !demoAdded,
                     }
                  } else if (["age", "metrics", "preferences"].includes(step)) {
                     btn = {
                        onClick: () => go(1),
                        label: "Continuar",
                        icon: <ArrowRight size={20} />,
                        disabled: !canContinue(),
                     }
                  } else if (step === "name") {
                     btn = {
                        onClick: () => go(1),
                        label: "Continuar",
                        icon: <ArrowRight size={20} />,
                        disabled: !form.name.trim(),
                     }
                  }

                  if (!btn) return null

                  return (
                     <motion.button
                        key={step}
                        initial={{ scale: 0.8, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 15 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={btn.onClick}
                        disabled={btn.disabled}
                        className="absolute left-6 right-6 top-0 bg-primary text-white font-extrabold text-lg py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {btn.label}
                        {btn.icon}
                     </motion.button>
                  )
               })()}
            </AnimatePresence>
         </div>
      </div>
   )
}
