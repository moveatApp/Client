import { Link, useLocation } from "react-router-dom"
import { Home, Apple, Dumbbell, Award, User, Moon, Sun } from "lucide-react"
import { useStore } from "@/store/useStore"
import { useWebHaptics } from "web-haptics/react"

export default function Navigation() {
   const { pathname } = useLocation()
   const { isDarkMode, toggleDarkMode } = useStore()
   const { trigger } = useWebHaptics()

   if (pathname === "/onboarding") return null

   const tabs = [
      { name: "Inicio", path: "/", icon: Home },
      { name: "Nutrición", path: "/nutrition", icon: Apple },
      { name: "Entrenar", path: "/training", icon: Dumbbell },
      { name: "Progreso", path: "/progress", icon: Award },
      { name: "Perfil", path: "/profile", icon: User },
   ]

   return (
      <>
         {/* Mobile Bottom Navigation */}
         <nav className="md:hidden fixed bottom-0 w-full bg-card-bg/90 backdrop-blur-md border-t border-card-border px-6 py-3 pb-7 flex justify-around items-center z-50 transition-colors">
            {tabs.map((tab) => {
               const Icon = tab.icon
               const isActive = pathname === tab.path
               return (
                  <Link
                     key={tab.path}
                     to={tab.path}
                     onClick={() => trigger(isActive ? "selection" : "light")}
                     className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                        isActive
                           ? "text-primary"
                           : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                     }`}>
                     <div
                        className={`relative ${isActive ? "scale-110" : ""} transition-transform`}>
                        <Icon size={26} strokeWidth={isActive ? 2.5 : 1.8} />
                     </div>
                  </Link>
               )
            })}
         </nav>

         {/* Desktop Sidebar */}
         <nav className="hidden md:flex flex-col w-24 bg-card-bg border-r border-card-border h-screen sticky top-0 left-0 px-2 z-50 shrink-0 transition-colors">
            <div className="flex items-center justify-center pt-8 pb-4">
               <img src="/Logo.png" className="h-12 w-auto" alt="MovEat Logo" />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center gap-6">
               {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = pathname === tab.path
                  return (
                     <Link
                        key={tab.path}
                        to={tab.path}
                        onClick={() => trigger(isActive ? "selection" : "light")}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                           isActive
                              ? "text-primary"
                              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        }`}>
                        <div
                           className={`relative ${isActive ? "scale-110" : ""} transition-transform`}>
                           <Icon size={26} strokeWidth={isActive ? 2.5 : 1.8} />
                        </div>
                     </Link>
                  )
               })}
            </div>

            <div className="pb-8 flex justify-center">
               <button
                  onClick={() => {
                     trigger("light")
                     toggleDarkMode()
                  }}
                  className="w-12 h-12 bg-muted dark:bg-white/5 border border-card-border rounded-xl flex items-center justify-center text-gray-500 hover:text-primary transition-all">
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
               </button>
            </div>
         </nav>
      </>
   )
}
