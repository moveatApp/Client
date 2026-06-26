import { useState, useEffect } from "react"
import { useStore, type Goal, type Level } from "@/store/useStore"
import {
   apiLogout,
   mapPrimaryGoal,
   mapActivityLevel,
   trainingDaysFromLevel,
} from "@/api/auth"
import {
   apiGetContext,
   apiPutGoals,
   apiGetNutritionSettings,
   apiPutNutritionSettings,
   apiUpdatePreferences,
   type NutritionSettings,
} from "@/api/me"
import { toast } from "@/components/ui/toast"
import {
   LogOut,
   User,
   Activity,
   Dumbbell,
   Calendar,
   Moon,
   Sun,
   ChevronDown,
   Utensils,
   Palette,
   Eye,
   Zap,
   Languages,
   Flame,
   Target,
   Save,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui"
import ChannelsSection from "@/components/ChannelsSection"
import { SUPPORTED_LANGUAGES } from "@/i18n"

const GOALS: { id: Goal; label: string }[] = [
   { id: "baja_peso", label: "Bajar de peso" },
   { id: "gana_masa", label: "Ganar masa muscular" },
   { id: "mantiene", label: "Mantenerme sano" },
   { id: "bienestar", label: "Mejorar bienestar" },
]

const LEVELS: { id: Level; label: string }[] = [
   { id: "principiante", label: "Principiante" },
   { id: "intermedio", label: "Intermedio" },
   { id: "avanzado", label: "Avanzado" },
]

const TIMES = [
   { id: 15, label: "15 min" },
   { id: 30, label: "30 min" },
   { id: 45, label: "45 min" },
   { id: 60, label: "60 min" },
]

const PREFERENCES = [
   { id: "ninguna", label: "Como de todo" },
   { id: "vegetariano", label: "Vegetariano" },
   { id: "vegano", label: "Vegano" },
   { id: "sintacc", label: "Sin TACC" },
]

const THEMES = [
   { id: "neutral", label: "Neutro", color: "#52525B" },
   { id: "orange", label: "Naranja", color: "#F97316" },
   { id: "green", label: "Verde", color: "#5B6347" },
   { id: "blue", label: "Azul", color: "#3B82F6" },
   { id: "purple", label: "Morado", color: "#8B5CF6" },
   { id: "red", label: "Rojo", color: "#EF4444" },
   { id: "teal", label: "Teal", color: "#14B8A6" },
   { id: "rose", label: "Rosa", color: "#F43F5E" },
   { id: "amber", label: "Ámbar", color: "#D97706" },
   { id: "indigo", label: "Índigo", color: "#6366F1" },
]

export default function ProfilePage() {
    const {
       user,
       themeColor,
       setThemeColor,
       resetProgress,
       isDarkMode,
       toggleDarkMode,
       animationsEnabled,
       toggleAnimations,
       updateUser,
       hydrateFromContext,
    } = useStore()
   const navigate = useNavigate()
   const { t, i18n } = useTranslation("common")

   const [expandedSection, setExpandedSection] = useState<string | null>(null)
   const [isLoggingOut, setIsLoggingOut] = useState(false)

   // Calorie target settings (backend-authoritative: CALCULATED vs MANUAL).
   const [nutrition, setNutrition] = useState<NutritionSettings | null>(null)
   const [manualInput, setManualInput] = useState("")
   const [savingCalories, setSavingCalories] = useState(false)

   useEffect(() => {
      if (user && !user.email) {
         apiGetContext().then((res) => {
            if (res.ok && res.data.user.email) {
               updateUser({ email: res.data.user.email })
            }
         })
      }
   }, [user, updateUser])

   useEffect(() => {
      apiGetNutritionSettings().then((res) => {
         if (res.ok && res.data.nutrition) {
            setNutrition(res.data.nutrition)
            setManualInput(String(res.data.nutrition.manualCalorieTarget ?? res.data.nutrition.dailyCalorieTarget))
         }
      })
   }, [])

   const applyNutrition = (next: NutritionSettings) => {
      setNutrition(next)
      useStore.setState({ targetCalories: next.dailyCalorieTarget })
   }

   const saveCalorieMode = async (mode: "CALCULATED" | "MANUAL") => {
      if (savingCalories) return
      const manual = Math.round(Number(manualInput))
      if (mode === "MANUAL" && (!Number.isFinite(manual) || manual < 800 || manual > 8000)) {
         toast.error(t("profile.calories.invalid"))
         return
      }
      setSavingCalories(true)
      const res = await apiPutNutritionSettings(
         mode === "MANUAL" ? { targetMode: "MANUAL", manualCalorieTarget: manual } : { targetMode: "CALCULATED" },
      )
      if (res.ok && res.data.nutrition) applyNutrition(res.data.nutrition)
      else if (!res.ok) toast.error(res.message)
      setSavingCalories(false)
   }

   // Persists goal/activity changes to the platform, then re-hydrates targets.
   const persistGoals = async (next: { goal?: string; level?: string; targetWeight?: number }) => {
      const goal = next.goal ?? user?.goal ?? "mantiene"
      const level = next.level ?? user?.level ?? "principiante"
      // Preserve existing target weight on goal/level changes; an explicit edit
      // overrides it. Backend recomputes calorie targets from this.
      const targetWeight = next.targetWeight ?? user?.targetWeight
      const res = await apiPutGoals({
         primaryGoal: mapPrimaryGoal(goal),
         activityLevel: mapActivityLevel(level),
         trainingDaysPerWeek: trainingDaysFromLevel(level),
         ...(targetWeight != null && targetWeight > 0 ? { targetWeight } : {}),
      })
      if (res.ok) {
         const ctx = await apiGetContext()
         if (ctx.ok) hydrateFromContext(ctx.data)
      } else {
         toast.error(res.message)
      }
   }

   const [targetWeightInput, setTargetWeightInput] = useState("")
   const saveTargetWeight = () => {
      const n = parseFloat(targetWeightInput)
      if (Number.isNaN(n) || n <= 0) return
      updateUser({ targetWeight: n })
      useStore.setState({ targetWeight: n })
      void persistGoals({ targetWeight: n })
      setExpandedSection(null)
   }

   if (!user) return null

   const toggleSection = (section: string) => {
      setExpandedSection((prev) => (prev === section ? null : section))
   }

    const handleToggleDarkMode = () => {
       const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
       const doc = document as Document & { startViewTransition?: (callback: () => void) => void }
       if (!doc.startViewTransition || !animationsEnabled || prefersReducedMotion) {
          toggleDarkMode()
          return
       }
       const next = !isDarkMode
       doc.startViewTransition(() => {
          if (next) {
             document.documentElement.classList.add("dark")
          } else {
             document.documentElement.classList.remove("dark")
          }
          useStore.setState({ isDarkMode: next })
          void apiUpdatePreferences({ darkMode: next })
       })
    }

   return (
      <div className="p-6 pb-20 animate-fade-in font-sans h-full">
         <header className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight">
               {t("profile.header")}
            </h1>
            <div className="flex items-center gap-2">
                <button
                   aria-label={isDarkMode ? t("profile.darkmode.to_light") : t("profile.darkmode.to_dark")}
                   onClick={handleToggleDarkMode}
                   className="p-2 text-subtle hover:text-foreground transition-colors bg-card-bg/40 rounded-full shadow-sm border border-card-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                   {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
         </header>

         <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card-bg/40 rounded-3xl p-6 shadow-sm border border-card-border flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary border-4 border-card-bg shadow-md relative">
               <User size={32} />
            </div>
            <div>
               <h2 className="text-2xl font-bold text-foreground mb-1">
                  {user.name}
               </h2>
               {user.email && (
               <p className="text-sm text-subtle font-medium">{user.email}</p>
               )}
            </div>
         </motion.div>

          <motion.div
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.1 }}
             className="mb-8">
             <h3 className="font-bold text-lg mb-4 text-foreground">
                {t("profile.sections.visuals")}
             </h3>

             <div className="bg-card-bg/40 rounded-3xl overflow-hidden shadow-sm border border-card-border flex flex-col">
                {/* Theme */}
                <div className="border-b border-card-border">
                   <button
                      aria-expanded={expandedSection === "theme"}
                      onClick={() => toggleSection("theme")}
                      className="w-full text-left p-5 flex items-center justify-between hover:bg-muted dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-muted dark:bg-white/5 text-subtle rounded-xl flex items-center justify-center">
                            <Palette size={20} />
                         </div>
                         <span className="font-bold text-foreground">
                            {t("profile.theme.label")}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm text-subtle font-medium">
                            {t(`profile.theme.options.${themeColor}`)}
                         </span>
                         <ChevronDown
                            size={16}
                            className={`text-subtle transition-transform ${expandedSection === "theme" ? "rotate-180" : ""}`}
                         />
                      </div>
                   </button>
                   <AnimatePresence>
                      {expandedSection === "theme" && (
                         <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <div className="flex flex-col">
                               {THEMES.map((th) => (
                                  <button
                                     key={th.id}
                                     onClick={() => {
                                        setThemeColor(th.id)
                                        setExpandedSection(null)
                                     }}
                                     className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border flex items-center gap-3 ${themeColor === th.id ? "bg-primary text-white" : "bg-muted/50 dark:bg-white/5 text-foreground hover:bg-muted dark:hover:bg-white/5"}`}>
                                     <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: th.color }}></div>
                                     {t(`profile.theme.options.${th.id}`)}
                                  </button>
                               ))}
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                {/* Language */}
                <div className="border-b border-card-border">
                   <button
                      aria-expanded={expandedSection === "language"}
                      onClick={() => toggleSection("language")}
                      className="w-full text-left p-5 flex items-center justify-between hover:bg-muted dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-muted dark:bg-white/5 text-subtle rounded-xl flex items-center justify-center">
                            <Languages size={20} />
                         </div>
                         <span className="font-bold text-foreground">
                            {t("language.label")}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm text-subtle font-medium">
                            {t(`language.${i18n.resolvedLanguage ?? i18n.language}`)}
                         </span>
                         <ChevronDown
                            size={16}
                            className={`text-subtle transition-transform ${expandedSection === "language" ? "rotate-180" : ""}`}
                         />
                      </div>
                   </button>
                   <AnimatePresence>
                      {expandedSection === "language" && (
                         <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <div className="flex flex-col">
                               {SUPPORTED_LANGUAGES.map((lng) => (
                                  <button
                                     key={lng}
                                     onClick={() => {
                                        void i18n.changeLanguage(lng)
                                        useStore.setState({ locale: lng })
                                        void apiUpdatePreferences({ locale: lng })
                                        setExpandedSection(null)
                                     }}
                                     className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border ${(i18n.resolvedLanguage ?? i18n.language) === lng ? "bg-primary text-white" : "bg-muted/50 dark:bg-white/5 text-foreground hover:bg-muted dark:hover:bg-white/5"}`}>
                                     {t(`language.${lng}`)}
                                  </button>
                               ))}
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                {/* Animations Toggle */}
                <div className="border-b border-card-border">
                   <button
                      onClick={() => toggleAnimations()}
                      className="w-full text-left p-5 flex items-center justify-between hover:bg-muted dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-muted dark:bg-white/5 text-subtle rounded-xl flex items-center justify-center">
                            <Zap size={20} />
                         </div>
                         <span className="font-bold text-foreground">
                            {t("profile.animations.label")}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className={`text-sm font-medium ${animationsEnabled ? "text-primary" : "text-subtle"}`}>
                            {animationsEnabled ? t("profile.animations.on") : t("profile.animations.off")}
                         </span>
                          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${animationsEnabled ? "bg-primary" : "bg-muted-foreground"}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${animationsEnabled ? "translate-x-4" : "translate-x-0"}`} />
                         </div>
                      </div>
                   </button>
                </div>
             </div>
          </motion.div>

          <motion.div
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.15 }}
             className="mb-8">
             <h3 className="font-bold text-lg mb-4 text-foreground">
                {t("profile.sections.nutrition_usage")}
             </h3>

             <div className="bg-card-bg/40 rounded-3xl overflow-hidden shadow-sm border border-card-border flex flex-col">
                {/* Goal */}
                <div className="border-b border-card-border">
                   <button
                      aria-expanded={expandedSection === "goal"}
                      onClick={() => toggleSection("goal")}
                      className="w-full text-left p-5 flex items-center justify-between hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-muted text-subtle rounded-xl flex items-center justify-center">
                            <Activity size={20} />
                         </div>
                         <span className="font-bold text-foreground">
                            {t("profile.goal.label")}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm text-subtle font-medium">
                            {t(`profile.goals.${user.goal}`)}
                         </span>
                         <ChevronDown
                            size={16}
                            className={`text-subtle transition-transform ${expandedSection === "goal" ? "rotate-180" : ""}`}
                         />
                      </div>
                   </button>
                   <AnimatePresence>
                      {expandedSection === "goal" && (
                         <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <div className="flex flex-col">
                               {GOALS.map((g) => (
                                  <button
                                     key={g.id}
                                     onClick={() => {
                                         updateUser({ goal: g.id })
                                         void persistGoals({ goal: g.id })
                                        setExpandedSection(null)
                                     }}
                                     className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border ${user.goal === g.id ? "bg-primary text-white" : "bg-muted/50 text-foreground hover:bg-muted"}`}>
                                     {t(`profile.goals.${g.id}`)}
                                  </button>
                               ))}
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                {/* Calorie target */}
                <div className="border-b border-card-border">
                   <button
                      aria-expanded={expandedSection === "calories"}
                      onClick={() => toggleSection("calories")}
                      className="w-full text-left p-5 flex items-center justify-between hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-muted text-subtle rounded-xl flex items-center justify-center">
                            <Flame size={20} />
                         </div>
                         <span className="font-bold text-foreground">
                            {t("profile.calories.label")}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm text-subtle font-medium">
                            {nutrition ? `${nutrition.dailyCalorieTarget} kcal` : "…"}
                         </span>
                         <ChevronDown
                            size={16}
                            className={`text-subtle transition-transform ${expandedSection === "calories" ? "rotate-180" : ""}`}
                         />
                      </div>
                   </button>
                   <AnimatePresence>
                      {expandedSection === "calories" && (
                         <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <div className="flex flex-col gap-3 p-5 border-t border-card-border">
                               {/* Auto / Manual toggle */}
                               <div className="flex rounded-2xl border border-card-border overflow-hidden">
                                  <button
                                     onClick={() => void saveCalorieMode("CALCULATED")}
                                     disabled={savingCalories}
                                     className={`flex-1 px-4 py-3 font-bold text-sm transition-colors ${nutrition?.targetMode === "CALCULATED" ? "bg-primary text-white" : "bg-muted/50 text-foreground hover:bg-muted"}`}>
                                     {t("profile.calories.auto")}
                                  </button>
                                  <button
                                     onClick={() => void saveCalorieMode("MANUAL")}
                                     disabled={savingCalories}
                                     className={`flex-1 px-4 py-3 font-bold text-sm transition-colors ${nutrition?.targetMode === "MANUAL" ? "bg-primary text-white" : "bg-muted/50 text-foreground hover:bg-muted"}`}>
                                     {t("profile.calories.manual")}
                                  </button>
                               </div>

                               <p className="text-xs text-subtle font-medium">
                                  {t("profile.calories.calculated_hint", { value: nutrition?.calculatedCalorieTarget ?? nutrition?.dailyCalorieTarget ?? "—" })}
                               </p>

                               {/* Manual value + save — only in Manual mode (Auto saves itself). */}
                               {nutrition?.targetMode === "MANUAL" && (
                                  <div className="flex items-center gap-2">
                                     <div className="flex-1 flex items-center gap-2 bg-muted/50 dark:bg-white/5 rounded-2xl px-4 py-3 border border-card-border">
                                        <input
                                           type="number"
                                           min={800}
                                           max={8000}
                                           step={10}
                                           value={manualInput}
                                           onChange={(e) => setManualInput(e.target.value)}
                                           onKeyDown={(e) => e.key === "Enter" && void saveCalorieMode("MANUAL")}
                                           aria-label={t("profile.calories.manual")}
                                           className="flex-1 bg-transparent font-bold text-foreground outline-none w-full"
                                        />
                                        <span className="text-subtle text-sm font-medium">kcal</span>
                                     </div>
                                     <Button
                                        variant="primary"
                                        disabled={savingCalories}
                                        onClick={() => void saveCalorieMode("MANUAL")}
                                        className="shrink-0 flex items-center justify-center gap-2">
                                        <Save size={16} /> {t("profile.calories.save")}
                                     </Button>
                                  </div>
                               )}
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                {/* Activity Level */}
                <div className="border-b border-card-border">
                   <button
                      aria-expanded={expandedSection === "level"}
                      onClick={() => toggleSection("level")}
                      className="w-full text-left p-5 flex items-center justify-between hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-muted text-subtle rounded-xl flex items-center justify-center">
                            <Dumbbell size={20} />
                         </div>
                         <span className="font-bold text-foreground">
                            {t("profile.level.label")}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm text-subtle font-medium">
                            {t(`profile.levels.${user.level}`)}
                         </span>
                         <ChevronDown
                            size={16}
                            className={`text-subtle transition-transform ${expandedSection === "level" ? "rotate-180" : ""}`}
                         />
                      </div>
                   </button>
                   <AnimatePresence>
                      {expandedSection === "level" && (
                         <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <div className="flex flex-col">
                               {LEVELS.map((l) => (
                                  <button
                                     key={l.id}
                                     onClick={() => {
                                         updateUser({ level: l.id })
                                         void persistGoals({ level: l.id })
                                        setExpandedSection(null)
                                     }}
                                     className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border ${user.level === l.id ? "bg-primary text-white" : "bg-muted/50 text-foreground hover:bg-muted"}`}>
                                     {t(`profile.levels.${l.id}`)}
                                  </button>
                               ))}
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                {/* Target weight */}
                <div className="border-b border-card-border">
                   <button
                      aria-expanded={expandedSection === "targetWeight"}
                      onClick={() => {
                         setTargetWeightInput(user.targetWeight ? String(user.targetWeight) : "")
                         toggleSection("targetWeight")
                      }}
                      className="w-full text-left p-5 flex items-center justify-between hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-muted text-subtle rounded-xl flex items-center justify-center">
                            <Target size={20} />
                         </div>
                         <span className="font-bold text-foreground">
                            {t("profile.target_weight.label")}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm text-subtle font-medium">
                            {user.targetWeight ? `${user.targetWeight} kg` : "—"}
                         </span>
                         <ChevronDown
                            size={16}
                            className={`text-subtle transition-transform ${expandedSection === "targetWeight" ? "rotate-180" : ""}`}
                         />
                      </div>
                   </button>
                   <AnimatePresence>
                      {expandedSection === "targetWeight" && (
                         <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <div className="p-5 border-t border-card-border flex items-center gap-3">
                               <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-2xl px-4 py-3 border border-card-border">
                                  <input
                                     type="number"
                                     min={20}
                                     max={400}
                                     step={0.5}
                                     inputMode="decimal"
                                     value={targetWeightInput}
                                     onChange={(e) => setTargetWeightInput(e.target.value)}
                                     onKeyDown={(e) => e.key === "Enter" && saveTargetWeight()}
                                     aria-label={t("profile.target_weight.label")}
                                     className="flex-1 w-full bg-transparent outline-none font-bold text-foreground"
                                  />
                                  <span className="text-subtle font-medium text-sm">kg</span>
                               </div>
                               <Button variant="primary" onClick={saveTargetWeight}>
                                  {t("profile.target_weight.save")}
                               </Button>
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                {/* Time */}
                <div className="border-b border-card-border">
                   <button
                      aria-expanded={expandedSection === "time"}
                      onClick={() => toggleSection("time")}
                      className="w-full text-left p-5 flex items-center justify-between hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-muted text-subtle rounded-xl flex items-center justify-center">
                            <Calendar size={20} />
                         </div>
                         <span className="font-bold text-foreground">
                            {t("profile.time.label")}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm text-subtle font-medium">
                            {TIMES.find((t) => t.id === user.timePerSession)?.label ||
                               `${user.timePerSession} min`}
                         </span>
                         <ChevronDown
                            size={16}
                            className={`text-subtle transition-transform ${expandedSection === "time" ? "rotate-180" : ""}`}
                         />
                      </div>
                   </button>
                   <AnimatePresence>
                      {expandedSection === "time" && (
                         <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <div className="flex flex-col">
                               {TIMES.map((t) => (
                                  <button
                                     key={t.id}
                                     onClick={() => {
                                        updateUser({ timePerSession: t.id })
                                        setExpandedSection(null)
                                     }}
                                     className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border ${user.timePerSession === t.id ? "bg-primary text-white" : "bg-muted/50 text-foreground hover:bg-muted"}`}>
                                     {t.label}
                                  </button>
                               ))}
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                {/* Diet */}
                <div>
                   <button
                      aria-expanded={expandedSection === "diet"}
                      onClick={() => toggleSection("diet")}
                      className="w-full text-left p-5 flex items-center justify-between hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-muted text-subtle rounded-xl flex items-center justify-center">
                            <Utensils size={20} />
                         </div>
                         <span className="font-bold text-foreground">
                            {t("profile.diet.label")}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm text-subtle font-medium max-w-[120px] truncate text-right">
                            {user.preferences.length > 0 &&
                            !user.preferences.includes("ninguna")
                               ? user.preferences
                                    .map((id) => t(`profile.preferences.${id}`))
                                    .join(", ")
                               : t("profile.diet.eat_all")}
                         </span>
                         <ChevronDown
                            size={16}
                            className={`text-subtle transition-transform ${expandedSection === "diet" ? "rotate-180" : ""}`}
                         />
                      </div>
                   </button>
                   <AnimatePresence>
                      {expandedSection === "diet" && (
                         <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <div className="flex flex-col">
                                <div className="px-5 py-2 bg-muted border-t border-card-border">
                                   <p className="text-xs text-subtle font-medium">
                                      {t("profile.diet.multi_hint")}
                                   </p>
                                </div>
                               {PREFERENCES.map((p) => (
                                  <button
                                     key={p.id}
                                     onClick={() => {
                                        const isSelected = user.preferences.includes(
                                           p.id,
                                        )
                                        let newPrefs
                                        if (p.id === "ninguna") {
                                           newPrefs = ["ninguna"]
                                        } else {
                                           newPrefs = isSelected
                                              ? user.preferences.filter(
                                                   (id) => id !== p.id,
                                                )
                                              : [
                                                   ...user.preferences.filter(
                                                      (id) => id !== "ninguna",
                                                   ),
                                                   p.id,
                                                ]
                                           if (newPrefs.length === 0)
                                              newPrefs = ["ninguna"]
                                        }
                                        updateUser({ preferences: newPrefs })
                                     }}
                                     className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border ${user.preferences.includes(p.id) ? "bg-primary text-white" : "bg-muted/50 dark:bg-white/5 text-foreground hover:bg-muted dark:hover:bg-white/5"}`}>
                                     {t(`profile.preferences.${p.id}`)}
                                  </button>
                               ))}
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>
             </div>
          </motion.div>

          <ChannelsSection />

         <Button
            variant="danger"
            disabled={isLoggingOut}
            onClick={async () => {
               setIsLoggingOut(true)
               try {
                  await apiLogout()
               } catch {
                  // ignore: always clear local state even if server fails
               }
                useStore.setState({
                   user: null,
                   isOnboarded: false,
                   themeColor: 'orange',
                   isDarkMode: false,
                   animationsEnabled: true,
                })
               navigate("/onboarding")
            }}
            className="w-full flex justify-center items-center gap-2">
            <LogOut size={16} />
            {isLoggingOut ? t("profile.logout.loading") : t("profile.logout.label")}
         </Button>
      </div>
   )
}
