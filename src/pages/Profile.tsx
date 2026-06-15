import { useState, useEffect } from "react"
import { useStore, type Goal, type Level } from "@/store/useStore"
import { apiLogout } from "@/api/auth"
import { apiGetMeContext } from "@/api/me"
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
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui"

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
   { id: "orange", label: "Naranja", color: "#F97316" },
   { id: "green", label: "Verde", color: "#5B6347" },
   { id: "blue", label: "Azul", color: "#3B82F6" },
   { id: "purple", label: "Morado", color: "#8B5CF6" },
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
    } = useStore()
   const navigate = useNavigate()

   const [expandedSection, setExpandedSection] = useState<string | null>(null)
   const [isLoggingOut, setIsLoggingOut] = useState(false)

   useEffect(() => {
      if (user && !user.email) {
         apiGetMeContext().then((res) => {
            if (res.ok && res.data.user.email) {
               updateUser({ email: res.data.user.email })
            }
         })
      }
   }, [user, updateUser])

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
       })
    }

   return (
      <div className="p-6 pb-20 animate-fade-in font-sans h-full">
         <header className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight">
               Perfil
            </h1>
            <div className="flex items-center gap-2">
                <button
                   aria-label={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
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
                Visuales
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
                            Color del Tema
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm text-subtle font-medium">
                            {THEMES.find((t) => t.id === themeColor)?.label ||
                               "Naranja"}
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
                               {THEMES.map((t) => (
                                  <button
                                     key={t.id}
                                     onClick={() => {
                                        setThemeColor(t.id)
                                        setExpandedSection(null)
                                     }}
                                     className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border flex items-center gap-3 ${themeColor === t.id ? "bg-primary text-white" : "bg-muted/50 dark:bg-white/5 text-foreground hover:bg-muted dark:hover:bg-white/5"}`}>
                                     <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: t.color }}></div>
                                     {t.label}
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
                            Transiciones Animadas
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className={`text-sm font-medium ${animationsEnabled ? "text-primary" : "text-subtle"}`}>
                            {animationsEnabled ? "Activadas" : "Desactivadas"}
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
                Alimentación y Uso
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
                            Mi Objetivo
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm text-subtle font-medium">
                            {GOALS.find((g) => g.id === user.goal)?.label}
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
                                        setExpandedSection(null)
                                     }}
                                     className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border ${user.goal === g.id ? "bg-primary text-white" : "bg-muted/50 text-foreground hover:bg-muted"}`}>
                                     {g.label}
                                  </button>
                               ))}
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
                         <span className="font-bold text-foreground">Nivel</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm text-subtle font-medium">
                            {LEVELS.find((l) => l.id === user.level)?.label}
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
                                        setExpandedSection(null)
                                     }}
                                     className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border ${user.level === l.id ? "bg-primary text-white" : "bg-muted/50 text-foreground hover:bg-muted"}`}>
                                     {l.label}
                                  </button>
                               ))}
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
                         <span className="font-bold text-foreground">Tiempo</span>
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
                            Alimentación
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm text-subtle font-medium max-w-[120px] truncate text-right">
                            {user.preferences.length > 0 &&
                            !user.preferences.includes("ninguna")
                               ? user.preferences
                                    .map(
                                       (id) =>
                                          PREFERENCES.find((p) => p.id === id)?.label,
                                    )
                                    .join(", ")
                               : "Como de todo"}
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
                                      Puedes elegir múltiples opciones
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
                                     {p.label}
                                  </button>
                               ))}
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>
             </div>
          </motion.div>

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
            {isLoggingOut ? "Cerrando sesion..." : "Cerrar sesion"}
         </Button>
      </div>
   )
}
