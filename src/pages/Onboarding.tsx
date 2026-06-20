import { useState, useRef, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useStore, type Goal, type Level } from "@/store/useStore"
import {
   apiSignup,
   apiLogin,
   apiGoogleLogin,
   apiPutOnboarding,
   buildSignupPayload,
   buildOnboardingPayload,
   ageFromBirthDate,
   suggestTargetWeight,
} from "@/api/auth"
import { apiGetContext } from "@/api/me"
import { tError } from "@/i18n"
import { useTranslation } from "react-i18next"
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
import { DatePicker, LanguageSelect } from "@/components/ui"
import { toast } from "@/components/ui/toast"
import {
   validateEmail,
   validateSignupPassword,
   validateLoginPassword,
   PASSWORD_RULES,
} from "@/components/onboarding/validation"
import { estimateMacros } from "@/lib/nutrition"

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** YYYY-MM-DD for a date `years` ago from today (local). */
function isoYearsAgo(years: number): string {
   const d = new Date()
   d.setFullYear(d.getFullYear() - years)
   return d.toISOString().split("T")[0]
}

/** Local today as YYYY-MM-DD. */
function todayISO(): string {
   return new Date().toISOString().split("T")[0]
}

// Date-of-birth bounds: not in the future and no more than 120 years ago.
const MAX_AGE = 120
const MAX_BIRTHDATE = todayISO()
const MIN_BIRTHDATE = isoYearsAgo(MAX_AGE)

/** Returns a localized error for an invalid date of birth, or null when valid. */
function validateBirthDate(birthDate: string): string | null {
   if (!birthDate) return tError("birthdate.required")
   const dob = new Date(`${birthDate}T00:00:00`)
   if (Number.isNaN(dob.getTime())) return tError("birthdate.invalid")
   const today = new Date()
   today.setHours(0, 0, 0, 0)
   if (dob.getTime() > today.getTime()) return tError("birthdate.future")
   if (dob.getTime() < new Date(`${MIN_BIRTHDATE}T00:00:00`).getTime()) {
      return tError("birthdate.max_age")
   }
   return null
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
   name: string
   lastName: string
   goal: string
   gender: string
   birthDate: string
   weight: number
   height: number
   targetWeight: number
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

// Option labels/subs are resolved from i18n by `value` at render time; these
// constants only carry the stable value + icon.
const GOAL_OPTIONS = [
   { value: "baja_peso", icon: TrendingDown },
   { value: "gana_masa", icon: Dumbbell },
   { value: "mantiene", icon: Scale },
   { value: "bienestar", icon: Heart },
]

const GENDER_OPTIONS = [
   { value: "male", icon: Mars },
   { value: "female", icon: Venus },
   { value: "other", icon: VenusAndMars },
]

const LEVEL_OPTIONS = [
   { value: "principiante", icon: BatteryLow },
   { value: "intermedio", icon: Zap },
   { value: "avanzado", icon: Flame },
]

const TIME_OPTIONS = [
   { value: 10, icon: Timer },
   { value: 30, icon: Hourglass },
   { value: 60, icon: Clock },
]

const PREFERENCE_OPTIONS = [
   { value: "ninguna", icon: Utensils },
   { value: "vegetariano", icon: Carrot },
   { value: "vegano", icon: Leaf },
   { value: "sintacc", icon: WheatOff },
]

const VIBE_OPTIONS = [
   { value: "great", icon: Smile },
   { value: "ok", icon: Meh },
   { value: "low", icon: Frown },
]

const WELCOME_FEATURES = [
   { key: "routines", icon: Flame },
   { key: "nutrition", icon: Utensils },
   { key: "progress", icon: Heart },
]

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
   const { t } = useTranslation("common", { keyPrefix: "onboarding" })
   const { completeOnboarding, hydrateFromContext, toggleDarkMode, isDarkMode } =
      useStore()
   const { trigger } = useWebHaptics({ debug: true })
   const [stepIdx, setStepIdx] = useState(0)
   const [dir, setDir] = useState(1)
   const [form, setForm] = useState<FormData>({
      name: "",
      lastName: "",
      goal: "",
      gender: "",
      birthDate: isoYearsAgo(25),
      weight: 70,
      height: 170,
      targetWeight: 0,
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

   // Seed the goal weight with a suggestion the first time the metrics step is
   // shown, then leave it fully under the user's control (independent of the
   // current weight slider).
   useEffect(() => {
      if (
         step === "metrics" &&
         !form.targetWeight &&
         (form.goal === "baja_peso" || form.goal === "gana_masa")
      ) {
         setForm((f) => ({
            ...f,
            targetWeight: suggestTargetWeight(f.goal, f.weight),
         }))
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [step])

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
         setAuthError(t("errors.fill_all"))
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
         toast.error(res.message)
         trigger("rigid")
      }
      setIsAuthenticating(false)
   }

   const processLoginSuccess = async (res: any) => {
      if (!res.ok) {
         toast.error(res.message)
         trigger("rigid")
         return
      }

      trigger("success")

      const loginUser = res.data.user
      const name =
         loginUser.displayName ||
         `${loginUser.firstName} ${loginUser.lastName}`.trim()

      // Backend is the source of truth: ask for the authoritative context.
      const ctxRes = await apiGetContext()
      if (ctxRes.ok && ctxRes.data.onboardingCompleted) {
         hydrateFromContext(ctxRes.data)
         navigate("/")
         return
      }

      // Authenticated but onboarding is not complete yet — continue the flow.
      setForm((prev) => ({ ...prev, name }))
      go(1)
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
         await finish()
      } catch (error) {
         console.error("Error guardando onboarding:", error)
         setOnboardingError(
            error instanceof Error ? error.message : t("errors.save_failed"),
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
         toast.error(tError("network.error"))
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
      if (step === "age") return validateBirthDate(form.birthDate) === null
      return true
   }

   const finish = async () => {
      // Seed local-only fields (diet preferences, session length) the platform
      // does not store, then let the backend context override the rest.
      completeOnboarding({
         name: form.name || "Usuario",
         email: email.trim() || undefined,
         goal: (form.goal || "bienestar") as Goal,
         level: (form.level || "principiante") as Level,
         weight: form.weight,
         height: form.height,
         targetWeight: form.targetWeight,
         workoutsPerWeek:
            form.level === "principiante" ? 2 : form.level === "intermedio" ? 3 : 5,
         timePerSession: form.timePerSession,
         preferences: form.preferences.length > 0 ? form.preferences : ["ninguna"],
      })

      const ctxRes = await apiGetContext()
      if (ctxRes.ok) hydrateFromContext(ctxRes.data)

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
         {/* Language selector — shown on the pre-auth steps (welcome + login),
             which have no back button to collide with in the top-left. */}
         {(step === "welcome" || step === "login") && (
            <div className="absolute top-6 left-6 z-50">
               <LanguageSelect />
            </div>
         )}

         {/* Theme Toggle for Onboarding */}
         <div className="absolute top-6 right-6 z-50">
            <button
               aria-label={t("aria.theme")}
               onClick={toggleDarkMode}
               className="w-10 h-10 rounded-full bg-card-bg/40 border border-card-border flex items-center justify-center text-foreground shadow-sm hover:bg-muted dark:hover:bg-white/5 transition-colors">
               {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
         </div>

         {/* ── Header ── */}
         {!isFirst && step !== "summary" && step !== "login" && (
            <div className="flex items-center px-6 pt-6 pb-2 gap-4 shrink-0 relative z-10">
               <button
                  aria-label={t("aria.back")}
                  onClick={() => go(-1)}
                  className="w-10 h-10 rounded-full border border-card-border bg-card-bg/40 flex items-center justify-center text-foreground shadow-sm">
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
                              {t("welcome.title")}
                           </h1>
                           <p className="text-subtle font-medium text-base max-w-[260px] mx-auto leading-relaxed">
                              {t("welcome.subtitle")}
                           </p>
                        </div>

                        <div className="flex flex-col gap-2 w-full max-w-[320px] mt-4">
                           {WELCOME_FEATURES.map(({ icon: Icon, key }) => (
                              <div
                                 key={key}
                                 className="flex items-center gap-3 bg-card-bg/40 border border-card-border rounded-2xl px-4 py-3 shadow-sm">
                                 <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Icon size={16} className="text-primary" />
                                 </div>
                                 <span className="text-sm font-semibold text-foreground">
                                    {t(`welcome.features.${key}`)}
                                 </span>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* ══ GOAL ═════════════════════════════════════════════════ */}
                  {step === "goal" && (
                     <div className="flex flex-col my-auto py-8 shrink-0 gap-6">
                        <StepHeader tag={t("goal.tag")} title={t("goal.title")} />
                        <div className="flex flex-col gap-3">
                           {GOAL_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 icon={opt.icon}
                                 label={t(`goal.options.${opt.value}.label`)}
                                 sub={t(`goal.options.${opt.value}.sub`)}
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
                           tag={t("gender.tag")}
                           title={t("gender.title")}
                           subtitle={t("gender.subtitle")}
                        />
                        <div className="grid grid-cols-3 gap-3">
                           {GENDER_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 icon={opt.icon}
                                 label={t(`gender.options.${opt.value}`)}
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
                        <StepHeader tag={t("age.tag")} title={t("age.title")} />
                        <div className="flex flex-col items-center gap-6">
                           <div className="text-8xl font-display font-extrabold text-primary tabular-nums">
                              {ageFromBirthDate(form.birthDate)}
                           </div>
                           <div className="text-subtle font-bold">
                              {t("age.years")}
                           </div>
                           <DatePicker
                              variant="card"
                              value={form.birthDate}
                              onChange={(iso) =>
                                 setForm({ ...form, birthDate: iso })
                              }
                              minYear={Number(MIN_BIRTHDATE.slice(0, 4))}
                              maxYear={Number(MAX_BIRTHDATE.slice(0, 4))}
                              maxDate={MAX_BIRTHDATE}
                              label={t("age.label")}
                              isDarkMode={isDarkMode}
                           />
                           <AnimatedError
                              message={validateBirthDate(form.birthDate) ?? ""}
                           />
                        </div>
                     </div>
                  )}

                  {/* ══ METRICS ══════════════════════════════════════════════ */}
                  {step === "metrics" && (
                     <div className="flex flex-col my-auto py-8 shrink-0 gap-8">
                        <StepHeader tag={t("metrics.tag")} title={t("metrics.title")} />
                        <div className="flex flex-col gap-6">
                           <SliderCard
                              label={t("metrics.weight")}
                              value={form.weight}
                              unit="kg"
                              min={30}
                              max={200}
                              onChange={(v) => setForm({ ...form, weight: v })}
                           />
                           <SliderCard
                              label={t("metrics.height")}
                              value={form.height}
                              unit="cm"
                              min={130}
                              max={220}
                              onChange={(v) => setForm({ ...form, height: v })}
                           />
                           {(form.goal === "baja_peso" ||
                              form.goal === "gana_masa") && (
                              <SliderCard
                                 label={t("metrics.target_weight")}
                                 value={
                                    form.targetWeight ||
                                    suggestTargetWeight(form.goal, form.weight)
                                 }
                                 // value falls back to the suggestion only on the
                                 // very first render before the seed effect runs.
                                 unit="kg"
                                 min={30}
                                 max={200}
                                 onChange={(v) =>
                                    setForm({ ...form, targetWeight: v })
                                 }
                              />
                           )}
                        </div>
                     </div>
                  )}

                  {/* ══ LEVEL ════════════════════════════════════════════════ */}
                  {step === "level" && (
                     <div className="flex flex-col my-auto py-8 shrink-0 gap-6">
                        <StepHeader tag={t("level.tag")} title={t("level.title")} />
                        <div className="flex flex-col gap-3">
                           {LEVEL_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 icon={opt.icon}
                                 label={t(`level.options.${opt.value}.label`)}
                                 sub={t(`level.options.${opt.value}.sub`)}
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
                        <StepHeader tag={t("time.tag")} title={t("time.title")} />
                        <div className="flex flex-col gap-3">
                           {TIME_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 icon={opt.icon}
                                 label={t(`time.options.${opt.value}.label`)}
                                 sub={t(`time.options.${opt.value}.sub`)}
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
                           tag={t("preferences.tag")}
                           title={t("preferences.title")}
                           subtitle={t("preferences.subtitle")}
                        />
                        <div className="flex flex-col gap-3">
                           {PREFERENCE_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 icon={opt.icon}
                                 label={t(`preferences.options.${opt.value}`)}
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
                           tag={t("vibe.tag")}
                           title={t("vibe.title")}
                           subtitle={t("vibe.subtitle")}
                        />
                        <div className="flex flex-col gap-4">
                           {VIBE_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 icon={opt.icon}
                                 label={t(`vibe.options.${opt.value}.label`)}
                                 sub={t(`vibe.options.${opt.value}.sub`)}
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
                           tag={t("fooddemo.tag")}
                           title={t("fooddemo.title")}
                           subtitle={t("fooddemo.subtitle")}
                        />

                        <div className="bg-card-bg/40 border border-card-border rounded-3xl p-5 shadow-sm">
                           <div className="flex items-center gap-3 bg-muted dark:bg-white/5 rounded-2xl px-4 mb-4">
                              <span className="text-2xl">🍽️</span>
                              <input
                                 type="text"
                                 aria-label={t("fooddemo.food_aria")}
                                 placeholder={t("fooddemo.placeholder")}
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
                                    <div className="text-xs text-subtle">
                                       {t("fooddemo.kcal_logged", {
                                          kcal: Math.round(
                                             estimateMacros(demoFood).baseCalories *
                                                2,
                                          ),
                                       })}
                                    </div>
                                 </div>
                              </motion.div>
                           ) : (
                              <PrimaryButton
                                 onClick={handleFoodDemo}
                                 disabled={!demoFood.trim()}>
                                 <span className="text-lg">+</span> {t("fooddemo.add")}
                              </PrimaryButton>
                           )}
                        </div>

                        {demoAdded && (
                           <p className="text-center text-sm text-subtle font-medium">
                              {t("fooddemo.success")}
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
                              {t("summary.title", {
                                 name: form.name.split(" ")[0],
                              })}
                           </h2>
                           <p className="text-subtle text-sm font-medium">
                              {t("summary.subtitle")}
                           </p>
                        </div>

                        <div className="bg-card-bg/40 border border-card-border rounded-3xl p-5 space-y-4 shadow-sm">
                           {[
                              {
                                 label: t("summary.rows.goal"),
                                 val: form.goal
                                    ? t(`summary.goals.${form.goal}`)
                                    : t("summary.empty"),
                              },
                              {
                                 label: t("summary.rows.level"),
                                 val: form.level
                                    ? t(`summary.levels.${form.level}`)
                                    : t("summary.empty"),
                              },
                              {
                                 label: t("summary.rows.weight_height"),
                                 val: t("summary.weight_height_value", {
                                    weight: form.weight,
                                    height: form.height,
                                 }),
                              },
                              {
                                 label: t("summary.rows.time"),
                                 val: t("summary.time_value", {
                                    minutes: form.timePerSession,
                                 }),
                              },
                              {
                                 label: t("summary.rows.vibe"),
                                 val: form.vibe
                                    ? t(`summary.vibes.${form.vibe}`)
                                    : t("summary.empty"),
                              },
                           ].map((row) => (
                              <div
                                 key={row.label}
                                 className="flex justify-between items-center py-1 border-b border-card-border/50 last:border-none">
                                 <span className="text-xs font-bold uppercase tracking-wider text-subtle">
                                    {row.label}
                                 </span>
                                 <span className="font-bold text-sm text-foreground text-right max-w-[160px]">
                                    {row.val}
                                 </span>
                              </div>
                           ))}
                        </div>

                        <p className="text-center text-xs text-subtle font-medium">
                           {t("summary.footer")}
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
                                 ? t("login.title_login")
                                 : t("login.title_signup")}
                           </h2>
                           <p className="text-subtle text-sm font-medium px-4">
                              {t("login.subtitle")}
                           </p>
                        </div>

                        <div className="w-full max-w-sm mt-6">
                           {/* Toggle registro/login */}
                           <div className="flex bg-muted dark:bg-white/5 rounded-2xl p-1 mb-5">
                              <button
                                 onClick={() => {
                                    setIsLoginMode(false)
                                    setAuthError("")
                                 }}
                                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                     !isLoginMode
                                        ? "bg-card-bg/40 text-foreground shadow-sm"
                                        : "text-subtle"
                                  }`}>
                                  {t("login.tab_signup")}
                               </button>
                               <button
                                  onClick={() => {
                                     setIsLoginMode(true)
                                     setAuthError("")
                                  }}
                                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                     isLoginMode
                                        ? "bg-card-bg/40 text-foreground shadow-sm"
                                      : "text-subtle"
                               }`}>
                                   {t("login.tab_login")}
                              </button>
                           </div>

                           <div className="flex flex-col gap-3 mb-4">
                              <AnimatedError
                                 message={emailError}
                                  className="text-xs font-bold text-danger px-1 -mt-1"
                              />
                              <input
                                 type="email"
                                 aria-label={t("login.email_aria")}
                                 placeholder={t("login.email_placeholder")}
                                 autoComplete="email"
                                 spellCheck={false}
                                 className="w-full bg-card-bg/40 border border-card-border text-foreground font-bold py-4 px-6 rounded-2xl shadow-sm outline-none focus:border-primary"
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
                                          aria-label={t("login.first_name")}
                                          placeholder={t("login.first_name")}
                                          autoComplete="given-name"
                                          className="w-full bg-card-bg/40 border border-card-border text-foreground font-bold py-4 px-5 rounded-2xl shadow-sm outline-none focus:border-primary"
                                          value={signupFirstName}
                                          onChange={(e) =>
                                             setSignupFirstName(e.target.value)
                                          }
                                       />
                                       <input
                                          type="text"
                                          aria-label={t("login.last_name")}
                                          placeholder={t("login.last_name")}
                                          autoComplete="family-name"
                                          className="w-full bg-card-bg/40 border border-card-border text-foreground font-bold py-4 px-5 rounded-2xl shadow-sm outline-none focus:border-primary"
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
                                 aria-label={t("login.password")}
                                 placeholder={t("login.password")}
                                 autoComplete={
                                    isLoginMode ? "current-password" : "new-password"
                                 }
                                 spellCheck={false}
                                 className="w-full bg-card-bg/40 border border-card-border text-foreground font-bold py-4 px-6 rounded-2xl shadow-sm outline-none focus:border-primary"
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
                                          {PASSWORD_RULES.map(({ test, key }) => {
                                             const ok = test(password)
                                             return (
                                                <p
                                                   key={key}
                                                    className={`text-xs font-bold flex items-center gap-1.5 transition-all ${ok ? "text-primary line-through" : "text-danger"}`}>
                                                    <span
                                                       className={`w-3 h-3 rounded-full border-2 shrink-0 transition-all ${ok ? "bg-primary border-primary" : "border-danger"}`}
                                                    />
                                                   {t(`password_rules.${key}`)}
                                                </p>
                                             )
                                          })}
                                       </div>
                                    </motion.div>
                                 )}
                              </AnimatePresence>

                              <AnimatedError
                                 message={authError}
                                  className="text-xs font-bold text-danger px-1 mb-2 text-center"
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
                                    ? t("login.connecting")
                                    : isLoginMode
                                      ? t("login.login")
                                      : t("login.signup")}
                              </PrimaryButton>
                           </div>

                           <div className="relative flex py-2 items-center mb-4">
                              <div className="grow border-t border-card-border"></div>
                              <span className="shrink-0 mx-4 text-subtle text-xs font-bold uppercase">
                                 {t("login.divider_or")}
                              </span>
                              <div className="grow border-t border-card-border"></div>
                           </div>

                           <div className="w-full flex justify-center">
                              <GoogleLogin
                                 onSuccess={handleGoogleSuccess}
                                 onError={() => {
                                    toast.error(tError("auth.google_failed"))
                                    trigger("rigid")
                                 }}
                                 theme={isDarkMode ? "filled_black" : "outline"}
                                 size="large"
                                 shape="pill"
                                 text={isLoginMode ? "signin_with" : "signup_with"}
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
                  label: t("footer.start"),
                  icon: <ChevronRight size={22} />,
                  disabled: false,
               }
            } else if (step === "summary") {
               btn = {
                  onClick: handleCompleteOnboarding,
                  label: isAuthenticating ? t("footer.saving") : t("footer.continue"),
                  icon: <ArrowRight size={20} />,
                  disabled: isAuthenticating,
               }
            } else if (step === "fooddemo") {
               btn = {
                  onClick: () => go(1),
                  label: t("footer.continue"),
                  icon: <ArrowRight size={20} />,
                  disabled: !demoAdded,
               }
            } else if (["age", "metrics", "preferences"].includes(step)) {
               btn = {
                  onClick: () => go(1),
                  label: t("footer.continue"),
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
