

import { useStore } from '@/store/useStore';
import { Settings, LogOut, User, Activity, Dumbbell, Calendar, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, streak, xp, targetCalories, resetDaily, resetProgress, isDarkMode, toggleDarkMode } = useStore();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="p-6 pb-20 animate-fade-in font-sans h-full">
      <header className="mb-8 flex justify-between items-center">
         <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight">Perfil</h1>
         <div className="flex gap-2">
           <button 
             onClick={toggleDarkMode}
             className="p-2 text-gray-400 hover:text-foreground transition-colors bg-card-bg rounded-full shadow-sm border border-card-border"
           >
             {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
           </button>
           <button className="p-2 text-gray-400 hover:text-foreground transition-colors bg-card-bg rounded-full shadow-sm border border-card-border">
             <Settings size={20} />
           </button>
         </div>
      </header>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card-bg rounded-3xl p-6 shadow-sm border border-card-border flex items-center gap-6 mb-8"
      >
         <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary border-4 border-card-bg shadow-md relative">
            <User size={32} />
            <div className="absolute -bottom-2 -right-2 bg-accent text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 border-card-bg">
              {user.level || 1}
            </div>
         </div>
         <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">{user.name}</h2>
            <p className="text-sm text-gray-400 capitalize">{user.goal.replace('_', ' ')}</p>
         </div>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
         <h3 className="font-bold text-lg mb-4 text-foreground">Ajustes Rápidos</h3>
         
         <div className="bg-card-bg rounded-3xl overflow-hidden shadow-sm border border-card-border flex flex-col">
            <div className="p-5 flex items-center justify-between border-b border-card-border hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl flex items-center justify-center"><Activity size={20} /></div>
                 <span className="font-bold text-foreground">Mi Objetivo</span>
              </div>
              <span className="text-sm text-gray-400 capitalize">{user.goal.replace('_', ' ')}</span>
            </div>
            
            <div className="p-5 flex items-center justify-between border-b border-card-border hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl flex items-center justify-center"><Dumbbell size={20} /></div>
                 <span className="font-bold text-foreground">Nivel de Actividad</span>
              </div>
              <span className="text-sm text-gray-400 capitalize">{user.level}</span>
            </div>
            
            <div className="p-5 flex items-center justify-between border-b border-card-border hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl flex items-center justify-center"><Calendar size={20} /></div>
                 <span className="font-bold text-foreground">Tiempo disp.</span>
              </div>
              <span className="text-sm text-gray-400">{user.timePerSession} min</span>
            </div>
         </div>
      </motion.div>

      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={() => { resetProgress(); navigate('/onboarding'); }}
        className="w-full py-4 text-sm font-bold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-2xl flex justify-center items-center gap-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm active:scale-95 border border-transparent dark:border-red-500/20"
      >
        <LogOut size={16} /> Ver Onboarding (Demo)
      </motion.button>
    </div>
  );
}
