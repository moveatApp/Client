import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Dashboard from '@/pages/Dashboard';
import Nutrition from '@/pages/Nutrition';
import Training from '@/pages/Training';
import Progress from '@/pages/Progress';
import Profile from '@/pages/Profile';
import Onboarding from '@/pages/Onboarding';
import { useStore } from '@/store/useStore';
import { useBootstrap } from '@/hooks/useBootstrap';
import { useWebHaptics } from 'web-haptics/react';

function Splash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <img src="/Logo.png" alt="MovEat" width={56} height={56} className="h-14 w-auto animate-pulse" />
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const isOnboarding = location.pathname === '/onboarding';
  const shouldReduceMotion = useReducedMotion();

  const pageVariants = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 16, scale: shouldReduceMotion ? 1 : 0.98 },
    animate: {
      opacity: 1, y: 0, scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.45,
        ease: [0.25, 0.46, 0.45, 0.94] as const, // iOS spring-ish easing
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        when: 'beforeChildren',
      },
    },
    exit: {
      opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : -10, scale: shouldReduceMotion ? 1 : 0.99,
      transition: { duration: shouldReduceMotion ? 0 : 0.25, ease: [0.4, 0, 1, 1] as const },
    },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full h-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/training" element={<Training />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/onboarding" element={<Onboarding />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function Layout() {
  const { pathname } = useLocation();
  const isOnboarding = pathname === '/onboarding';
  const ready = useBootstrap();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const themeColor = useStore((state) => state.themeColor);
  const checkAndResetDaily = useStore((state) => state.checkAndResetDaily);
  const { trigger } = useWebHaptics({ debug: true });
  const isInitialTheme = useRef(true);

  useEffect(() => {
    checkAndResetDaily();
  }, [checkAndResetDaily]);

  useEffect(() => {
    // Aplicamos la clase dark en el HTML siempre que cambie isDarkMode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Si isInitialTheme.current es true, significa que es la primera carga (evitamos hacer transición aquí)
    if (isInitialTheme.current) {
      isInitialTheme.current = false;
    }
    
    document.documentElement.setAttribute('data-theme', themeColor);
  }, [isDarkMode, themeColor]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('button, a, [role="button"]');
      if (btn && !btn.hasAttribute('data-no-haptic')) {
        trigger('light');
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [trigger]);

  if (!ready) return <Splash />;

  return (
    <div className={`min-h-screen font-sans flex ${isOnboarding ? 'bg-background' : 'flex-col md:flex-row bg-background'}`}>
      {!isOnboarding && <Navigation />}
      <main className={`flex-1 w-full overflow-hidden ${isOnboarding ? 'flex justify-center bg-background' : 'overflow-y-auto pb-20 md:pb-0'}`}>
        {isOnboarding ? (
          // Onboarding: full-screen on all devices, slightly reduced max height
          <div
            className="w-full max-w-md h-dvh max-h-[820px] md:my-auto flex flex-col overflow-hidden"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <AnimatedRoutes />
          </div>
        ) : (
          <div className="w-full h-full">
            <AnimatedRoutes />
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
