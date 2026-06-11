import { useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useStore } from "@/store/useStore"
import {
   apiSignup,
   apiLogin,
   apiGoogleLogin,
   apiGetProfile,
   apiPutOnboarding,
   buildSignupPayload,
   buildOnboardingPayload,
} from "@/api/auth"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { useWebHaptics } from "web-haptics/react"
import { emojiBlast } from "emoji-blast"
import { GoogleLogin } from "@react-oauth/google"
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
   CheckCircle2,
   ChevronRight,
   Smile,
   Meh,
   Frown,
   BatteryLow,
   Mars,
   Venus,
   VenusAndMars,
   Sun,
   Moon,
} from "lucide-react"
import {
   StepHeader,
   OptionCard,
   SliderCard,
   AnimatedError,
   PrimaryButton,
} from "@/components/onboarding"
import {
   validateEmail,
   validateSignupPassword,
   validateLoginPassword,
   PASSWORD_RULES,
} from "@/components/onboarding/validation"
import { estimateMacros } from "@/lib/nutrition"

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
   name: string
   lastName: string
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
   "login",
   /* "name", */
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

// ─── Option data ─────────────────────────────────────────────────────────────

const GOAL_OPTIONS = [
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
]

const GENDER_OPTIONS = [
   { value: "male", label: "Hombre", icon: Mars },
   { value: "female", label: "Mujer", icon: Venus },
   { value: "other", label: "Otro", icon: VenusAndMars },
]

const LEVEL_OPTIONS = [
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
]

const TIME_OPTIONS = [
   { value: 10, label: "Express", sub: "10 minutos", icon: Timer },
   { value: 30, label: "Equilibrado", sub: "30 minutos", icon: Hourglass },
   { value: 60, label: "Intensivo", sub: "1 hora o más", icon: Clock },
]

const PREFERENCE_OPTIONS = [
   { value: "ninguna", label: "Como de todo", icon: Utensils },
   { value: "vegetariano", label: "Vegetariano", icon: Carrot },
   { value: "vegano", label: "Vegano", icon: Leaf },
   { value: "sintacc", label: "Sin TACC / Gluten Free", icon: WheatOff },
]

const VIBE_OPTIONS = [
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
]

const WELCOME_FEATURES = [
   { icon: Flame, text: "Rutinas adaptadas a tu nivel" },
   { icon: Utensils, text: "Seguimiento nutricional inteligente" },
   { icon: Heart, text: "Progreso visible cada día" },
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
   const shouldReduceMotion = useReducedMotion()
   return (
      <motion.div
         initial={{
            x: shouldReduceMotion ? 0 : dir * 40,
            opacity: shouldReduceMotion ? 1 : 0,
         }}
         animate={{ x: 0, opacity: 1 }}
         exit={{
            x: shouldReduceMotion ? 0 : -dir * 40,
            opacity: shouldReduceMotion ? 1 : 0,
         }}
         transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: "easeInOut" }}
         className="flex flex-col min-h-full">
         {children}
      </motion.div>
   )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Onboarding() {
   const navigate = useNavigate()
   const { completeOnboarding, toggleDarkMode, isDarkMode } = useStore()
   const { trigger } = useWebHaptics({ debug: true })
   const [stepIdx, setStepIdx] = useState(0)
   const [dir, setDir] = useState(1)
   const [form, setForm] = useState<FormData>({
      name: "",
      lastName: "",
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
   const [isAuthenticating, setIsAuthenticating] = useState(false)
   const [signupFirstName, setSignupFirstName] = useState("")
   const [signupLastName, setSignupLastName] = useState("")
   const [email, setEmail] = useState("")
   const [password, setPassword] = useState("")
   const [authError, setAuthError] = useState("")
   const [onboardingError, setOnboardingError] = useState("")
   const [isLoginMode, setIsLoginMode] = useState(false)
   const [emailError, setEmailError] = useState("")

   const step = STEPS[stepIdx]
   const isFirst = stepIdx === 0

   // ─── Navigation ───────────────────────────────────────────────────────────

   const go = (delta: number) => {
      trigger("light")
      setDir(delta)
      setStepIdx((s) => s + delta)
   }

   const selectAndAdvance = <K extends keyof FormData>(
      key: K,
      value: FormData[K],
   ) => {
      trigger("rigid")
      setForm({ ...form, [key]: value })
      setTimeout(() => go(1), 180)
   }

   // ─── Auth handlers ────────────────────────────────────────────────────────

   const handleEmailSignup = async () => {
      setAuthError("")
      setEmailError("")
      if (!signupFirstName.trim() || !signupLastName.trim() || !email || !password) {
         setAuthError("Completá todos los campos")
         return
      }

      const emailErr = validateEmail(email)
      if (emailErr) {
         setEmailError(emailErr)
         trigger("rigid")
         return
      }

      const pwErr = validateSignupPassword(password)
      if (pwErr) {
         setAuthError(pwErr)
         trigger("rigid")
         return
      }

      setIsAuthenticating(true)
      const res = await apiSignup(
         buildSignupPayload(email, password, signupFirstName, signupLastName),
      )
      if (res.ok) {
         setForm({
            ...form,
            name: `${signupFirstName.trim()} ${signupLastName.trim()}`,
         })
         trigger("success")
         go(1)
      } else {
         setAuthError(res.message)
         trigger("rigid")
      }
      setIsAuthenticating(false)
   }

   const processLoginSuccess = async (res: any) => {
      if (res.ok) {
         trigger("success")

         const loginUser = res.data.user
         const name =
            loginUser.displayName ||
            `${loginUser.firstName} ${loginUser.lastName}`.trim()

         const existing = useStore.getState().user
         const currentLastEmail = useStore.getState().lastUserEmail
         const isNewUser = loginUser.email !== currentLastEmail

         if (isNewUser) {
            useStore.setState({
               lastUserEmail: loginUser.email,
               xp: 0,
               level: 1,
               streak: 0,
               dailyCalories: 0,
               waterGlasses: 0,
               waterLiters: 0,
               meals: [],
               workoutCompleted: false,
               totalWorkouts: 0,
               workoutsCreated: 0,
               workouts: [],
               activeWorkoutId: null,
               weightHistory: [],
               lastWorkoutDate: null,
               lastResetDate: null,
            })
         }

         const profileRes = await apiGetProfile()

         let weight = existing?.weight ?? 70
         if (profileRes.ok) {
            weight = profileRes.data.profile.currentWeight || weight
         }

         useStore.setState({
            isOnboarded: true,
            user: existing
               ? { ...existing, name, weight, email: loginUser.email }
               : {
                    name,
                    email: loginUser.email,
                    goal: "mantiene" as any,
                    level: "principiante" as any,
                    weight,
                    height: 170,
                    workoutsPerWeek: 2,
                    timePerSession: 30,
                    preferences: ["ninguna"],
                 },
         })

         navigate("/")
      } else {
         setAuthError(res.message)
         trigger("rigid")
      }
   }

   const handleEmailLogin = async () => {
      setAuthError("")
      setEmailError("")
      if (!email || !password) return

      const emailErr = validateEmail(email)
      if (emailErr) {
         setEmailError(emailErr)
         trigger("rigid")
         return
      }

      const pwErr = validateLoginPassword(password)
      if (pwErr) {
         setAuthError(pwErr)
         trigger("rigid")
         return
      }

      setIsAuthenticating(true)
      const res = await apiLogin({ email: email.trim(), password })
      await processLoginSuccess(res)
      setIsAuthenticating(false)
   }

   const handleCompleteOnboarding = async () => {
      setOnboardingError("")
      setIsAuthenticating(true)

      try {
         const payload = buildOnboardingPayload(form)
         const res = await apiPutOnboarding(payload)
         if (!res.ok) throw new Error(res.message)
         trigger("success")
         finish()
      } catch (error) {
         console.error("Error guardando onboarding:", error)
         setOnboardingError(
            error instanceof Error
               ? error.message
               : "Error al guardar el onboarding",
         )
         trigger("rigid")
      } finally {
         setIsAuthenticating(false)
      }
   }

   const handleGoogleSuccess = async (credentialResponse: any) => {
      setIsAuthenticating(true)
      try {
         const res = await apiGoogleLogin({ idToken: credentialResponse.credential })
         await processLoginSuccess(res)
      } catch (error) {
         console.error("Error conectando con el backend:", error)
         setAuthError("Error de conexión")
         trigger("rigid")
      } finally {
         setIsAuthenticating(false)
      }
   }

   // ─── Helpers ──────────────────────────────────────────────────────────────

   const fireFoodEmojis = useCallback(() => {
      const btnRect = addBtnRef.current?.getBoundingClientRect()
      const x = btnRect ? btnRect.left + btnRect.width / 2 : window.innerWidth / 2
      const y = btnRect ? btnRect.top : window.innerHeight - 100

      trigger([{ duration: 750 }], { intensity: 0.64 })

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
                     x: { min: -10, max: 10 },
                     y: { min: -40, max: -25 },
                  },
               },
               position: { x, y },
            })
         }, i * 90)
      }
   }, [trigger])

   const handleFoodDemo = () => {
      if (!demoFood.trim()) return
      fireFoodEmojis()
      setDemoAdded(true)
   }

   const canContinue = () => {
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
         email: email.trim() || undefined,
         goal: (form.goal || "bienestar") as any,
         level: (form.level || "principiante") as any,
         weight: form.weight,
         height: form.height,
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
   const progressSteps = STEPS.filter(
      (s) => s !== "welcome" && s !== "summary" && s !== "login",
   )
   const progressIdx = progressSteps.indexOf(step)
   const showProgress = progressIdx >= 0

   const isAuthBtnDisabled =
      isAuthenticating ||
      !email ||
      !password ||
      (!isLoginMode && (!signupFirstName.trim() || !signupLastName.trim()))

   return (
      <div className="flex flex-col h-full bg-background font-sans select-none relative">
         {/* Theme Toggle for Onboarding */}
         <div className="absolute top-6 right-6 z-50">
            <button
               aria-label="Alternar tema"
               onClick={toggleDarkMode}
               className="w-10 h-10 rounded-full bg-card-bg border border-card-border flex items-center justify-center text-foreground shadow-sm hover:bg-muted dark:hover:bg-white-500/5 transition-colors">
               {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
         </div>

         {/* ── Header ── */}
         {!isFirst && step !== "summary" && step !== "login" && (
            <div className="flex items-center px-6 pt-6 pb-2 gap-4 shrink-0 relative z-10">
               <button
                  aria-label="Volver"
                  onClick={() => go(-1)}
                  className="w-10 h-10 rounded-full border border-card-border bg-card-bg flex items-center justify-center text-foreground shadow-sm">
                  <ArrowLeft size={18} />
               </button>

               {showProgress && (
                  <div className="flex-1 flex gap-1.5 mr-12">
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
            </div>
         )}

         {/* ── Content ── */}
         <div className="flex-1 flex flex-col px-6 overflow-y-auto relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
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
                           className="flex items-center justify-center">
                           <img
                              src="/Logo.png"
                              alt="MovEat"
                              className="w-24 h-24 object-contain mx-auto drop-shadow-sm"
                           />
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
                           {WELCOME_FEATURES.map(({ icon: Icon, text }) => (
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

                  {/* ══ GOAL ═════════════════════════════════════════════════ */}
                  {step === "goal" && (
                     <div className="flex flex-col my-auto py-8 shrink-0 gap-6">
                        <StepHeader tag="Objetivo" title="¿Qué querés lograr?" />
                        <div className="flex flex-col gap-3">
                           {GOAL_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 icon={opt.icon}
                                 label={opt.label}
                                 sub={opt.sub}
                                 selected={form.goal === opt.value}
                                 onClick={() => selectAndAdvance("goal", opt.value)}
                              />
                           ))}
                        </div>
                     </div>
                  )}

                  {/* ══ GENDER ═══════════════════════════════════════════════ */}
                  {step === "gender" && (
                     <div className="flex flex-col my-auto py-8 shrink-0 gap-8">
                        <StepHeader
                           tag="Perfil"
                           title="¿Con qué te identificás?"
                           subtitle="Esto ajusta tus parámetros metabólicos."
                        />
                        <div className="grid grid-cols-3 gap-3">
                           {GENDER_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 icon={opt.icon}
                                 label={opt.label}
                                 selected={form.gender === opt.value}
                                 onClick={() =>
                                    selectAndAdvance("gender", opt.value)
                                 }
                                 layout="col"
                              />
                           ))}
                        </div>
                     </div>
                  )}

                  {/* ══ AGE ══════════════════════════════════════════════════ */}
                  {step === "age" && (
                     <div className="flex flex-col my-auto py-8 shrink-0 gap-8">
                        <StepHeader tag="Perfil" title="¿Cuántos años tenés?" />
                        <div className="flex flex-col items-center gap-6">
                           <div className="text-8xl font-display font-extrabold text-primary tabular-nums">
                              {form.age}
                           </div>
                           <div className="text-gray-400 font-bold">años</div>
                           <input
                              type="range"
                              aria-label="Edad"
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
                     <div className="flex flex-col my-auto py-8 shrink-0 gap-8">
                        <StepHeader tag="Tu cuerpo" title="Peso y altura" />
                        <div className="flex flex-col gap-6">
                           <SliderCard
                              label="Peso"
                              value={form.weight}
                              unit="kg"
                              min={30}
                              max={200}
                              onChange={(v) => setForm({ ...form, weight: v })}
                           />
                           <SliderCard
                              label="Altura"
                              value={form.height}
                              unit="cm"
                              min={130}
                              max={220}
                              onChange={(v) => setForm({ ...form, height: v })}
                           />
                        </div>
                     </div>
                  )}

                  {/* ══ LEVEL ════════════════════════════════════════════════ */}
                  {step === "level" && (
                     <div className="flex flex-col my-auto py-8 shrink-0 gap-6">
                        <StepHeader tag="Actividad" title="¿Cuál es tu nivel?" />
                        <div className="flex flex-col gap-3">
                           {LEVEL_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 icon={opt.icon}
                                 label={opt.label}
                                 sub={opt.sub}
                                 selected={form.level === opt.value}
                                 onClick={() => selectAndAdvance("level", opt.value)}
                              />
                           ))}
                        </div>
                     </div>
                  )}

                  {/* ══ TIME ═════════════════════════════════════════════════ */}
                  {step === "time" && (
                     <div className="flex flex-col my-auto py-8 shrink-0 gap-8">
                        <StepHeader
                           tag="Sesiones"
                           title="¿Cuánto tiempo por sesión?"
                        />
                        <div className="flex flex-col gap-3">
                           {TIME_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 icon={opt.icon}
                                 label={opt.label}
                                 sub={opt.sub}
                                 selected={form.timePerSession === opt.value}
                                 onClick={() =>
                                    selectAndAdvance("timePerSession", opt.value)
                                 }
                              />
                           ))}
                        </div>
                     </div>
                  )}

                  {/* ══ PREFERENCES ══════════════════════════════════════════ */}
                  {step === "preferences" && (
                     <div className="flex flex-col my-auto py-8 shrink-0 gap-6">
                        <StepHeader
                           tag="Alimentación"
                           title="¿Alguna preferencia?"
                           subtitle="Podés elegir más de una."
                        />
                        <div className="flex flex-col gap-3">
                           {PREFERENCE_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 icon={opt.icon}
                                 label={opt.label}
                                 selected={form.preferences.includes(opt.value)}
                                 onClick={() => {
                                    trigger("rigid")
                                    togglePref(opt.value)
                                 }}
                              />
                           ))}
                        </div>
                     </div>
                  )}

                  {/* ══ VIBE ═════════════════════════════════════════════════ */}
                  {step === "vibe" && (
                     <div className="flex flex-col my-auto py-8 shrink-0 gap-8">
                        <StepHeader
                           tag="Check-in"
                           title="¿Cómo te sentís hoy?"
                           subtitle="Esto nos ayuda a adaptar tu rutina de inicio."
                        />
                        <div className="flex flex-col gap-4">
                           {VIBE_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 icon={opt.icon}
                                 label={opt.label}
                                 sub={opt.sub}
                                 selected={form.vibe === opt.value}
                                 onClick={() => selectAndAdvance("vibe", opt.value)}
                              />
                           ))}
                        </div>
                     </div>
                  )}

                  {/* ══ FOOD DEMO ════════════════════════════════════════════ */}
                  {step === "fooddemo" && (
                     <div className="flex flex-col my-auto py-8 shrink-0 gap-6 relative">
                        <StepHeader
                           tag="Demo"
                           title="Así agregás una comida"
                           subtitle="Escribí algo y probá como funciona el registro."
                        />

                        <div className="bg-card-bg border border-card-border rounded-3xl p-5 shadow-sm">
                           <div className="flex items-center gap-3 bg-muted dark:bg-white-500/5 rounded-2xl px-4 mb-4">
                              <span className="text-2xl">🍽️</span>
                              <input
                                 type="text"
                                 aria-label="Nombre de la comida"
                                 placeholder="Ej: Avena con banana…"
                                 autoComplete="off"
                                 spellCheck={false}
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
                                       ~
                                       {Math.round(
                                          estimateMacros(demoFood).baseCalories * 2,
                                       )}{" "}
                                       kcal · registrada ✓
                                    </div>
                                 </div>
                              </motion.div>
                           ) : (
                              <PrimaryButton
                                 onClick={handleFoodDemo}
                                 disabled={!demoFood.trim()}>
                                 <span className="text-lg">+</span> Agregar Comida
                              </PrimaryButton>
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
                     <div className="flex flex-col my-auto py-8 shrink-0 gap-6">
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
                        <AnimatedError message={onboardingError} />
                     </div>
                  )}

                  {/* ══ LOGIN ═════════════════════════════════════════════════ */}
                  {step === "login" && (
                     <div className="flex flex-col my-auto shrink-0 gap-6 items-center text-center">
                        <motion.div
                           initial={{ scale: 0.8, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           transition={{ type: "spring", stiffness: 200 }}
                           className="mb-4">
                           <img
                              src="/Logo.png"
                              alt="MovEat"
                              className="w-24 h-24 object-contain mx-auto drop-shadow-sm"
                           />
                        </motion.div>

                        <div>
                           <h2 className="text-3xl font-display font-extrabold text-foreground mb-2 leading-tight">
                              {isLoginMode
                                 ? "Bienvenido de nuevo"
                                 : "Crea tu cuenta"}
                           </h2>
                           <p className="text-gray-400 text-sm font-medium px-4">
                              Guardá tu progreso y conectá tu perfil con la nube para
                              no perder nunca tus datos.
                           </p>
                        </div>

                        <div className="w-full max-w-sm mt-6">
                           {/* Toggle registro/login */}
                           <div className="flex bg-muted dark:bg-white-500/5 rounded-2xl p-1 mb-5">
                              <button
                                 onClick={() => {
                                    setIsLoginMode(false)
                                    setAuthError("")
                                 }}
                                 className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                    !isLoginMode
                                       ? "bg-white dark:bg-white-500/10 text-muted shadow-sm"
                                       : "text-gray-400"
                                 }`}>
                                 Registrarse
                              </button>
                              <button
                                 onClick={() => {
                                    setIsLoginMode(true)
                                    setAuthError("")
                                 }}
                                 className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                    isLoginMode
                                       ? "bg-white dark:bg-white-500/10 text-muted shadow-sm"
                                       : "text-gray-400"
                                 }`}>
                                 Iniciar sesión
                              </button>
                           </div>

                           <div className="flex flex-col gap-3 mb-4">
                              <AnimatedError
                                 message={emailError}
                                 className="text-xs font-bold text-red-500 px-1 -mt-1"
                              />
                              <input
                                 type="email"
                                 aria-label="Correo electrónico"
                                 placeholder="Tu correo electrónico"
                                 autoComplete="email"
                                 spellCheck={false}
                                 className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 px-6 rounded-2xl shadow-sm outline-none focus:border-primary"
                                 value={email}
                                 onChange={(e) => {
                                    setEmail(e.target.value)
                                    setEmailError("")
                                 }}
                              />

                              <AnimatePresence>
                                 {!isLoginMode && (
                                    <motion.div
                                       initial={{ height: 0, opacity: 0 }}
                                       animate={{ height: "auto", opacity: 1 }}
                                       exit={{ height: 0, opacity: 0 }}
                                       className="overflow-hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
                                       <input
                                          type="text"
                                          aria-label="Nombre"
                                          placeholder="Nombre"
                                          autoComplete="given-name"
                                          className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 px-5 rounded-2xl shadow-sm outline-none focus:border-primary"
                                          value={signupFirstName}
                                          onChange={(e) =>
                                             setSignupFirstName(e.target.value)
                                          }
                                       />
                                       <input
                                          type="text"
                                          aria-label="Apellido"
                                          placeholder="Apellido"
                                          autoComplete="family-name"
                                          className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 px-5 rounded-2xl shadow-sm outline-none focus:border-primary"
                                          value={signupLastName}
                                          onChange={(e) =>
                                             setSignupLastName(e.target.value)
                                          }
                                       />
                                    </motion.div>
                                 )}
                              </AnimatePresence>

                              <input
                                 type="password"
                                 aria-label="Contraseña"
                                 placeholder="Contraseña"
                                 autoComplete={
                                    isLoginMode ? "current-password" : "new-password"
                                 }
                                 spellCheck={false}
                                 className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 px-6 rounded-2xl shadow-sm outline-none focus:border-primary"
                                 value={password}
                                 onChange={(e) => setPassword(e.target.value)}
                              />
                              <AnimatePresence>
                                 {!isLoginMode && (
                                    <motion.div
                                       initial={{ height: 0, opacity: 0 }}
                                       animate={{ height: "auto", opacity: 1 }}
                                       exit={{ height: 0, opacity: 0 }}
                                       className="overflow-hidden">
                                       <div className="flex flex-col gap-1 px-1 pt-1">
                                          {PASSWORD_RULES.map(({ test, label }) => {
                                             const ok = test(password)
                                             return (
                                                <p
                                                   key={label}
                                                   className={`text-xs font-bold flex items-center gap-1.5 transition-all ${ok ? "text-green-500 line-through" : "text-red-500"}`}>
                                                   <span
                                                      className={`w-3 h-3 rounded-full border-2 shrink-0 transition-all ${ok ? "bg-green-500 border-green-500" : "border-red-500"}`}
                                                   />
                                                   {label}
                                                </p>
                                             )
                                          })}
                                       </div>
                                    </motion.div>
                                 )}
                              </AnimatePresence>

                              <AnimatedError
                                 message={authError}
                                 className="text-xs font-bold text-red-500 px-1 mb-2 text-center"
                              />

                              <PrimaryButton
                                 onClick={
                                    isLoginMode
                                       ? handleEmailLogin
                                       : handleEmailSignup
                                 }
                                 disabled={isAuthBtnDisabled}
                                 className={
                                    isAuthBtnDisabled
                                       ? "opacity-50"
                                       : "hover:bg-primary/90"
                                 }>
                                 {isAuthenticating
                                    ? "Conectando…"
                                    : isLoginMode
                                      ? "Iniciar sesión"
                                      : "Registrarse con Email"}
                              </PrimaryButton>
                           </div>

                           <div className="relative flex py-2 items-center mb-4">
                              <div className="grow border-t border-gray-200"></div>
                              <span className="shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">
                                 o
                              </span>
                              <div className="grow border-t border-gray-200"></div>
                           </div>

                           <div className="w-full flex justify-center">
                              <GoogleLogin
                                 onSuccess={handleGoogleSuccess}
                                 onError={() => {
                                    console.log("Google Login Failed")
                                    setAuthError("Fallo el inicio de sesión con Google")
                                    trigger("rigid")
                                 }}
                                 theme={isDarkMode ? "filled_black" : "outline"}
                                 size="large"
                                 text={isLoginMode ? "signin_with" : "signup_with"}
                                 width="100%"
                              />
                           </div>
                        </div>
                     </div>
                  )}
               </Slide>
            </AnimatePresence>
         </div>

         {/* ── Footer CTA ── */}
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
                  onClick: handleCompleteOnboarding,
                  label: isAuthenticating ? "Guardando…" : "Continuar",
                  icon: <ArrowRight size={20} />,
                  disabled: isAuthenticating,
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
            }

            return (
               <div
                  className={`shrink-0 relative w-full transition-all duration-300 ease-in-out ${btn ? "h-[116px]" : "h-0"}`}>
                  <AnimatePresence mode="wait">
                     {btn && (
                        <motion.button
                           key={step}
                           initial={{ scale: 0.8, opacity: 0, y: 15 }}
                           animate={{ scale: 1, opacity: 1, y: 0 }}
                           exit={{ scale: 0.8, opacity: 0, y: 15 }}
                           transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                           }}
                           whileTap={{ scale: 0.95 }}
                           onClick={btn.onClick}
                           disabled={btn.disabled}
                           className="absolute left-6 right-6 top-4 bg-primary text-white font-extrabold text-lg py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                           {btn.label}
                           {btn.icon}
                        </motion.button>
                     )}
                  </AnimatePresence>
               </div>
            )
         })()}
      </div>
   )
}
