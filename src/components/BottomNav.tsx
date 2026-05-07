/* "use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Apple, Dumbbell, Award, User } from "lucide-react"

export default function BottomNav() {
   const pathname = usePathname()

   // Hide nav on onboarding
   if (pathname === "/onboarding") return null

   const tabs = [
      { name: "Inicio", path: "/", icon: Home },
      { name: "Nutrición", path: "/nutrition", icon: Apple },
      { name: "Entrenar", path: "/training", icon: Dumbbell },
      { name: "Progreso", path: "/progress", icon: Award },
      { name: "Perfil", path: "/profile", icon: User },
   ]

   return (
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 px-4 py-2 pb-6 flex justify-between items-center z-50">
         {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.path
            return (
               <Link
                  key={tab.path}
                  href={tab.path}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                     isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
                  }`}>
                  <div
                     className={`relative ${isActive ? "scale-110 mb-1" : ""} transition-transform`}>
                     <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                     {isActive && (
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                     )}
                  </div>
                  {isActive && (
                     <span className="text-[10px] font-medium mt-1.5">
                        {tab.name}
                     </span>
                  )}
               </Link>
            )
         })}
      </nav>
   )
}
 */
