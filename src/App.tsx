import { useEffect, useRef, lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import Navigation from "@/components/Navigation"
import Onboarding from "@/pages/Onboarding"
import { useStore } from "@/store/useStore"
import { useBootstrap } from "@/hooks/useBootstrap"
import { useWebHaptics } from "web-haptics/react"
import { Toaster } from "@/components/ui/toast"

const Dashboard = lazy(() => import("@/pages/Dashboard"))
const Nutrition = lazy(() => import("@/pages/Nutrition"))
const Training = lazy(() => import("@/pages/Training"))
const Progress = lazy(() => import("@/pages/Progress"))
const Profile = lazy(() => import("@/pages/Profile"))

function PageLoader() {
   return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
         <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
   )
}

function Splash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <img src="/Logo.png" alt="MovEat" width={56} height={56} className="h-14 w-auto animate-pulse" />
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function AnimatedRoutes() {
   const location = useLocation()
   const isOnboarding = location.pathname === "/onboarding"
   const shouldReduceMotion = useReducedMotion()
   const animationsEnabled = useStore((state) => state.animationsEnabled)

   const disableAnimations = shouldReduceMotion || !animationsEnabled

   const pageVariants = {
      initial: { opacity: 0, y: 16, scale: 0.98 },
      animate: {
         opacity: 1,
         y: 0,
         scale: 1,
         transition: {
            duration: 0.25,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
            staggerChildren: 0.04,
            when: "beforeChildren",
         },
      },
      exit: {
         opacity: 0,
         y: -10,
         scale: 0.99,
         transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as const },
      },
   }

    const routes = (
       <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
             <Route path="/" element={<Dashboard />} />
             <Route path="/nutrition" element={<Nutrition />} />
             <Route path="/training" element={<Training />} />
             <Route path="/progress" element={<Progress />} />
             <Route path="/profile" element={<Profile />} />
             <Route path="/onboarding" element={<Onboarding />} />
          </Routes>
       </Suspense>
    )

   if (disableAnimations) {
      return routes
   }

   return (
      <AnimatePresence mode="wait">
         <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full">
            {routes}
         </motion.div>
      </AnimatePresence>
   )
}

function Layout() {
   const { pathname } = useLocation()
   const isOnboarding = pathname === "/onboarding"
   const ready = useBootstrap()
   const isDarkMode = useStore((state) => state.isDarkMode)
   const themeColor = useStore((state) => state.themeColor)
   const checkAndResetDaily = useStore((state) => state.checkAndResetDaily)
   const { trigger } = useWebHaptics({ debug: true })
   const isInitialTheme = useRef(true)

   useEffect(() => {
      checkAndResetDaily()
   }, [checkAndResetDaily])

   useEffect(() => {
      // Aplicamos la clase dark en el HTML siempre que cambie isDarkMode
      if (isDarkMode) {
         document.documentElement.classList.add("dark")
      } else {
         document.documentElement.classList.remove("dark")
      }

      // Si isInitialTheme.current es true, significa que es la primera carga (evitamos hacer transición aquí)
      if (isInitialTheme.current) {
         isInitialTheme.current = false
      }

      document.documentElement.setAttribute("data-theme", themeColor)
   }, [isDarkMode, themeColor])

   useEffect(() => {
      const handlePointerDown = (e: PointerEvent) => {
         const target = e.target as HTMLElement
         const btn = target.closest('button, a, [role="button"]')
         if (btn && !btn.hasAttribute("data-no-haptic")) {
            trigger("light")
         }
      }
      window.addEventListener("pointerdown", handlePointerDown)
      return () => window.removeEventListener("pointerdown", handlePointerDown)
   }, [trigger])

   if (!ready) return <Splash />

   return (
      <div
         className={`min-h-screen font-sans flex ${isOnboarding ? "bg-background" : "flex-col md:flex-row bg-background"}`}>
         {!isOnboarding && <Navigation />}
         <main
            className={`flex-1 w-full overflow-hidden ${isOnboarding ? "flex justify-center bg-background" : "overflow-y-auto pb-16 md:pb-0"}`}>
            {isOnboarding ? (
               // Onboarding: full-screen on all devices, slightly reduced max height
               <div
                  className="w-full max-w-md h-dvh max-h-fit md:my-auto flex flex-col overflow-hidden"
                  style={{
                     paddingTop: "env(safe-area-inset-top)",
                     paddingBottom: "env(safe-area-inset-bottom)",
                  }}>
                  <AnimatedRoutes />
               </div>
            ) : (
               <div className="w-full h-full">
                  <AnimatedRoutes />
               </div>
            )}
         </main>
      </div>
   )
}

export default function App() {
   return (
      <BrowserRouter>
         <Layout />
         <Toaster position="top-center" />
      </BrowserRouter>
   )
}
