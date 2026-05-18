import { useState } from "react"
import { useStore } from "@/store/useStore"
import { LogOut, User, Activity, Dumbbell, Calendar, Moon, Sun, ChevronDown, Utensils, Palette } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"

const GOALS = [
   { id: "baja_peso", label: "Bajar de peso" },
   { id: "gana_masa", label: "Ganar masa muscular" },
   { id: "mantiene", label: "Mantenerme sano" },
   { id: "bienestar", label: "Mejorar bienestar" }
];

const LEVELS = [
   { id: "principiante", label: "Principiante" },
   { id: "intermedio", label: "Intermedio" },
   { id: "avanzado", label: "Avanzado" }
];

const TIMES = [
   { id: 15, label: "15 min" },
   { id: 30, label: "30 min" },
   { id: 45, label: "45 min" },
   { id: 60, label: "60 min" }
];

const PREFERENCES = [
   { id: "ninguna", label: "Como de todo" },
   { id: "vegetariano", label: "Vegetariano" },
   { id: "vegano", label: "Vegano" },
   { id: "sintacc", label: "Sin TACC" }
];

const THEMES = [
   { id: "orange", label: "Naranja", color: "#F97316" },
   { id: "green", label: "Verde", color: "#5B6347" },
   { id: "blue", label: "Azul", color: "#3B82F6" },
   { id: "purple", label: "Morado", color: "#8B5CF6" }
];

export default function ProfilePage() {
   const {
      user,
      themeColor,
      setThemeColor,
      resetProgress,
      isDarkMode,
      toggleDarkMode,
      updateUser,
   } = useStore()
   const navigate = useNavigate()

   const [expandedSection, setExpandedSection] = useState<string | null>(null);

   if (!user) return null

   const toggleSection = (section: string) => {
      setExpandedSection(prev => prev === section ? null : section);
   };

   return (
      <div className="p-6 pb-20 animate-fade-in font-sans h-full">
         <header className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight">
               Perfil
            </h1>
            <div className="flex items-center gap-2">
               <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-400 hover:text-foreground transition-colors bg-card-bg rounded-full shadow-sm border border-card-border">
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
               </button>
            </div>
         </header>

         <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card-bg rounded-3xl p-6 shadow-sm border border-card-border flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary border-4 border-card-bg shadow-md relative">
               <User size={32} />
            </div>
            <div>
               <h2 className="text-2xl font-bold text-foreground mb-1">
                  {user.name}
               </h2>
            </div>
         </motion.div>

         <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8">
            <h3 className="font-bold text-lg mb-4 text-foreground">
               Ajustes Rápidos
            </h3>

            <div className="bg-card-bg rounded-3xl overflow-hidden shadow-sm border border-card-border flex flex-col">
               
               {/* Goal */}
               <div className="border-b border-card-border">
                  <div 
                     onClick={() => toggleSection("goal")}
                     className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl flex items-center justify-center">
                           <Activity size={20} />
                        </div>
                        <span className="font-bold text-foreground">Mi Objetivo</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-medium">
                           {GOALS.find(g => g.id === user.goal)?.label}
                        </span>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedSection === "goal" ? "rotate-180" : ""}`} />
                     </div>
                  </div>
                  <AnimatePresence>
                     {expandedSection === "goal" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                           <div className="flex flex-col">
                              {GOALS.map(g => (
                                 <button 
                                    key={g.id}
                                    onClick={() => { updateUser({ goal: g.id as any }); setExpandedSection(null); }}
                                    className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border ${user.goal === g.id ? 'bg-primary text-white' : 'bg-gray-50/50 dark:bg-white/[0.02] text-foreground hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                 >
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
                  <div 
                     onClick={() => toggleSection("level")}
                     className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl flex items-center justify-center">
                           <Dumbbell size={20} />
                        </div>
                        <span className="font-bold text-foreground">Nivel</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-medium">
                           {LEVELS.find(l => l.id === user.level)?.label}
                        </span>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedSection === "level" ? "rotate-180" : ""}`} />
                     </div>
                  </div>
                  <AnimatePresence>
                     {expandedSection === "level" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                           <div className="flex flex-col">
                              {LEVELS.map(l => (
                                 <button 
                                    key={l.id}
                                    onClick={() => { updateUser({ level: l.id as any }); setExpandedSection(null); }}
                                    className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border ${user.level === l.id ? 'bg-primary text-white' : 'bg-gray-50/50 dark:bg-white/[0.02] text-foreground hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                 >
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
                  <div 
                     onClick={() => toggleSection("time")}
                     className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl flex items-center justify-center">
                           <Calendar size={20} />
                        </div>
                        <span className="font-bold text-foreground">Tiempo</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-medium">
                           {TIMES.find(t => t.id === user.timePerSession)?.label || `${user.timePerSession} min`}
                        </span>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedSection === "time" ? "rotate-180" : ""}`} />
                     </div>
                  </div>
                  <AnimatePresence>
                     {expandedSection === "time" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                           <div className="flex flex-col">
                              {TIMES.map(t => (
                                 <button 
                                    key={t.id}
                                    onClick={() => { updateUser({ timePerSession: t.id }); setExpandedSection(null); }}
                                    className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border ${user.timePerSession === t.id ? 'bg-primary text-white' : 'bg-gray-50/50 dark:bg-white/[0.02] text-foreground hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                 >
                                    {t.label}
                                 </button>
                              ))}
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>

               {/* Diet */}
               <div className="border-b border-card-border">
                  <div 
                     onClick={() => toggleSection("diet")}
                     className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl flex items-center justify-center">
                           <Utensils size={20} />
                        </div>
                        <span className="font-bold text-foreground">Alimentación</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-medium max-w-[120px] truncate text-right">
                           {user.preferences.length > 0 && !user.preferences.includes("ninguna") 
                              ? user.preferences.map(id => PREFERENCES.find(p => p.id === id)?.label).join(", ")
                              : "Como de todo"}
                        </span>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedSection === "diet" ? "rotate-180" : ""}`} />
                     </div>
                  </div>
                  <AnimatePresence>
                     {expandedSection === "diet" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                           <div className="flex flex-col">
                              <div className="px-5 py-2 bg-gray-50/50 dark:bg-white/[0.02] border-t border-card-border">
                                 <p className="text-xs text-gray-400 font-medium">Puedes elegir múltiples opciones</p>
                              </div>
                              {PREFERENCES.map(p => (
                                 <button 
                                    key={p.id}
                                    onClick={() => {
                                       const isSelected = user.preferences.includes(p.id);
                                       let newPrefs;
                                       if (p.id === "ninguna") {
                                          newPrefs = ["ninguna"];
                                       } else {
                                          newPrefs = isSelected ? user.preferences.filter(id => id !== p.id) : [...user.preferences.filter(id => id !== "ninguna"), p.id];
                                          if (newPrefs.length === 0) newPrefs = ["ninguna"];
                                       }
                                       updateUser({ preferences: newPrefs });
                                    }}
                                    className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border ${user.preferences.includes(p.id) ? 'bg-primary text-white' : 'bg-gray-50/50 dark:bg-white/[0.02] text-foreground hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                 >
                                    {p.label}
                                 </button>
                              ))}
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>

               {/* Theme */}
               <div>
                  <div 
                     onClick={() => toggleSection("theme")}
                     className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl flex items-center justify-center">
                           <Palette size={20} />
                        </div>
                        <span className="font-bold text-foreground">Color del Tema</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-medium">
                           {THEMES.find(t => t.id === themeColor)?.label || "Naranja"}
                        </span>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedSection === "theme" ? "rotate-180" : ""}`} />
                     </div>
                  </div>
                  <AnimatePresence>
                     {expandedSection === "theme" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                           <div className="flex flex-col">
                              {THEMES.map(t => (
                                 <button 
                                    key={t.id}
                                    onClick={() => { setThemeColor(t.id); setExpandedSection(null); }}
                                    className={`px-5 py-4 font-bold text-sm text-left transition-all w-full border-t border-card-border flex items-center gap-3 ${themeColor === t.id ? 'bg-primary text-white' : 'bg-gray-50/50 dark:bg-white/[0.02] text-foreground hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                 >
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }}></div>
                                    {t.label}
                                 </button>
                              ))}
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </div>
         </motion.div>

         <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => {
               resetProgress()
               navigate("/onboarding")
            }}
            className="w-full py-4 text-sm font-bold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-2xl flex justify-center items-center gap-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm active:scale-95 border border-transparent dark:border-red-500/20">
            <LogOut size={16} /> Ver Onboarding (Demo)
         </motion.button>
      </div>
   )
}
