import { Link, useLocation } from "react-router-dom"
import { Home, Apple, Dumbbell, Award, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useWebHaptics } from "web-haptics/react"

export default function Navigation() {
    const { pathname } = useLocation()
    const { t } = useTranslation("common")
    const { trigger } = useWebHaptics()

    if (pathname === "/onboarding") return null

    const tabs = [
       { name: t("nav.home"), path: "/", icon: Home },
       { name: t("nav.nutrition"), path: "/nutrition", icon: Apple },
       { name: t("nav.training"), path: "/training", icon: Dumbbell },
       { name: t("nav.progress"), path: "/progress", icon: Award },
       { name: t("nav.profile"), path: "/profile", icon: User },
    ]

    // Mobile: reorder so Home is in the center
    const mobileTabs = [
       tabs[1], // Nutrición
       tabs[2], // Entrenar
       tabs[0], // Inicio (center)
       tabs[3], // Progreso
       tabs[4], // Perfil
    ]

    return (
       <>
          {/* Mobile Bottom Navigation — floating glass */}
          <nav
             className="md:hidden fixed bottom-4 left-4 right-4 bg-card-bg/40 backdrop-blur-xl border border-card-border/50 rounded-card-lg px-4 py-3 flex justify-around items-center z-50 shadow-lg transition-colors"
             style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
             {mobileTabs.map((tab, idx) => {
                const Icon = tab.icon
                const isActive = pathname === tab.path
                const isCenter = idx === 2
                return (
                   <Link
                      key={tab.path}
                      to={tab.path}
                      aria-label={tab.name}
                      onClick={() => trigger(isActive ? "selection" : "light")}
                       className={`flex items-center justify-center transition-all duration-200 w-12 h-12 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                          isActive
                             ? "relative -top-3 bg-primary text-white shadow-lg shadow-primary/30"
                             : "text-subtle hover:text-foreground"
                       }`}>
                      <div
                         className={`relative transition-transform active:scale-90 ${isActive ? "scale-110" : ""}`}>
                         <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
                      </div>
                   </Link>
                )
             })}
          </nav>

          {/* Desktop Sidebar */}
          <nav className="hidden md:flex flex-col w-24 bg-card-bg/40 border-r border-card-border h-screen sticky top-0 left-0 px-2 z-50 shrink-0 transition-colors">
             <div className="flex items-center justify-center pt-8 pb-4">
                 <img src="/Logo.png" className="h-12 w-auto" alt="MovEat Logo" width="48" height="48" loading="eager" />
             </div>

             <div className="flex-1 flex flex-col justify-center items-center gap-6">
                {tabs.map((tab) => {
                   const Icon = tab.icon
                   const isActive = pathname === tab.path
                   return (
                      <Link
                         key={tab.path}
                         to={tab.path}
                         aria-label={tab.name}
                         onClick={() => trigger(isActive ? "selection" : "light")}
                          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                             isActive
                                ? "text-primary"
                                : "text-subtle hover:text-foreground"
                          }`}>
                         <div
                            className={`relative ${isActive ? "scale-110" : ""} transition-transform`}>
                            <Icon size={26} strokeWidth={isActive ? 2.5 : 1.8} />
                         </div>
                      </Link>
                   )
                })}
             </div>
          </nav>
       </>
    )
}
