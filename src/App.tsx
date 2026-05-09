import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Dashboard from '@/pages/Dashboard';
import Nutrition from '@/pages/Nutrition';
import Training from '@/pages/Training';
import Progress from '@/pages/Progress';
import Profile from '@/pages/Profile';
import Onboarding from '@/pages/Onboarding';
import { useStore } from '@/store/useStore';
import { useWebHaptics } from 'web-haptics/react';

// Premium iOS-like page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94], // iOS spring-ish easing
      staggerChildren: 0.08,
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0, y: -10, scale: 0.99,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  },
};

function AnimatedRoutes() {
  const location = useLocation();
  const isOnboarding = location.pathname === '/onboarding';

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
  const isDarkMode = useStore((state) => state.isDarkMode);
  const { trigger } = useWebHaptics({ debug: true });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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

  return (
    <div className={`min-h-screen font-sans flex ${isOnboarding ? 'bg-background' : 'flex-col md:flex-row bg-background'}`}>
      {!isOnboarding && <Navigation />}
      <main className={`flex-1 w-full overflow-hidden ${isOnboarding ? 'flex justify-center bg-background' : 'overflow-y-auto pb-20 md:pb-0'}`}>
        {isOnboarding ? (
          // Onboarding: full-screen on all devices, slightly reduced max height
          <div className="w-full max-w-md h-[100dvh] max-h-[820px] md:my-auto flex flex-col overflow-hidden">
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
