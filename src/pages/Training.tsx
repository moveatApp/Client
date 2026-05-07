import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
   CheckCircle2, 
   Play, 
   Circle, 
   Clock, 
   Flame, 
   Dumbbell, 
   Zap, 
   Trash2, 
   Settings2, 
   Save, 
   ChevronLeft 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_WORKOUT = {
  id: 'w1',
  name: 'Full Body Express',
  duration: 10,
  calories: 120,
  exercises: [
    { id: 'e1', name: 'Jumping Jacks', sets: 3, reps: '45s', rest: '15s', completed: false },
    { id: 'e2', name: 'Squats', sets: 3, reps: '15', rest: '30s', completed: false },
    { id: 'e3', name: 'Push-ups', sets: 3, reps: '10', rest: '30s', completed: false },
    { id: 'e4', name: 'Plank', sets: 3, reps: '30s', rest: '30s', completed: false },
  ]
};

export default function TrainingPage() {
   const navigate = useNavigate();
   const { setWorkoutCompleted, workoutCompleted, user } = useStore();
   
   const [exercises, setExercises] = useState(DEFAULT_WORKOUT.exercises);
   const [activeExerciseId, setActiveExerciseId] = useState<string | null>(DEFAULT_WORKOUT.exercises[0].id);
   const [showCelebration, setShowCelebration] = useState(false);
   const [editingExId, setEditingExId] = useState<string | null>(null);

   const handleComplete = (id: string, idx: number) => {
      const updated = exercises.map(ex => 
         ex.id === id ? { ...ex, completed: true } : ex
      );
      setExercises(updated);

      if (idx < updated.length - 1) {
         setTimeout(() => setActiveExerciseId(updated[idx + 1].id), 500);
      } else {
         setTimeout(() => setShowCelebration(true), 800);
         setWorkoutCompleted(true);
      }
   };

   const deleteExercise = (id: string) => {
      const updated = exercises.filter(ex => ex.id !== id);
      setExercises(updated);
      if (activeExerciseId === id) setActiveExerciseId(updated[0]?.id || null);
   };

   const updateExercise = (id: string, fields: any) => {
      setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, ...fields } : ex));
   };

   const completedCount = exercises.filter(e => e.completed).length;
   const progress = exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;

   if (showCelebration || workoutCompleted) {
      return (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-6 h-[85vh] text-center">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-200">
               <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">¡Increíble!</h2>
            <p className="text-gray-500 mb-8">Haz completado tu rutina diaria.</p>
            <button onClick={() => navigate('/')} className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg">Finalizar</button>
         </motion.div>
      );
   }

   return (
      <div className="p-4 md:p-6 pb-24 animate-fade-in font-sans flex flex-col min-h-screen">
         <header className="mb-6 flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-display font-extrabold text-foreground flex items-center gap-2">
                  <Zap size={32} className="text-primary" /> Mi Rutina
               </h1>
               <p className="text-gray-400 text-sm font-medium mt-1">{DEFAULT_WORKOUT.name}</p>
            </div>
            <button onClick={() => navigate('/')} className="p-2 bg-gray-50 rounded-xl"><ChevronLeft size={20}/></button>
         </header>

         {/* Header Progress */}
         <div className="bg-card-bg rounded-[32px] p-5 shadow-sm border border-card-border mb-8 flex items-center gap-5">
            <div className="w-14 h-14 relative flex-shrink-0">
               <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path className="text-gray-100 dark:text-white/5" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.5 a 15.5 15.5 0 0 1 0 31.0 a 15.5 15.5 0 0 1 0 -31.0" />
                  <motion.path 
                     initial={{ pathLength: 0 }}
                     animate={{ pathLength: progress / 100 }}
                     className="text-primary" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" 
                     d="M18 2.5 a 15.5 15.5 0 0 1 0 31.0 a 15.5 15.5 0 0 1 0 -31.0" 
                   />
               </svg>
            </div>
            <div>
               <span className="block font-bold text-lg text-foreground">Progreso de Sesión</span>
               <span className="text-sm font-bold text-primary">{completedCount}/{exercises.length} ejercicios listos</span>
            </div>
         </div>

         {/* Exercises List */}
         <div className="space-y-4 flex-1">
            {exercises.map((ex, idx) => {
               const isActive = activeExerciseId === ex.id;
               const isEditing = editingExId === ex.id;

               return (
                  <motion.div 
                     layout
                     key={ex.id}
                     className={`rounded-[32px] border-2 transition-all ${
                        ex.completed ? 'bg-gray-50 opacity-60 border-transparent' : 
                        isActive ? 'bg-card-bg border-primary shadow-lg ring-4 ring-primary/5' : 'bg-card-bg border-card-border'
                     }`}
                  >
                     <div className="p-5 flex items-center gap-4">
                        <button onClick={() => handleComplete(ex.id, idx)} className="shrink-0 transition-transform active:scale-90">
                           {ex.completed ? <CheckCircle2 size={32} className="text-primary" /> : <Circle size={32} className={isActive ? 'text-primary' : 'text-gray-200'} />}
                        </button>

                        <div className="flex-1" onClick={() => !ex.completed && setActiveExerciseId(ex.id)}>
                           {isEditing ? (
                              <input 
                                 className="w-full bg-transparent font-bold text-lg text-primary border-b border-primary/20 outline-none"
                                 value={ex.name}
                                 onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
                              />
                           ) : (
                              <h4 className={`font-bold transition-all ${isActive ? 'text-primary text-xl' : 'text-foreground'}`}>{ex.name}</h4>
                           )}
                           
                           {!isEditing && (
                              <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-tight">
                                 {ex.sets} Sets • {ex.reps} {ex.reps.includes('s') ? 'Segundos' : 'Reps'}
                              </p>
                           )}
                        </div>

                        <div className="flex items-center gap-2">
                           <button onClick={(e) => { e.stopPropagation(); setEditingExId(isEditing ? null : ex.id) }} className={`p-2 rounded-xl transition-colors ${isEditing ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                              {isEditing ? <Save size={18} /> : <Settings2 size={18} />}
                           </button>
                        </div>
                     </div>

                     <AnimatePresence>
                        {isEditing && (
                           <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-6 pb-6 overflow-hidden">
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                 <div className="bg-gray-50 p-3 rounded-2xl">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Sets</span>
                                    <input type="number" className="w-full bg-transparent font-bold" value={ex.sets} onChange={(e) => updateExercise(ex.id, { sets: parseInt(e.target.value) })}/>
                                 </div>
                                 <div className="bg-gray-50 p-3 rounded-2xl">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Reps / Tiempo</span>
                                    <input className="w-full bg-transparent font-bold" value={ex.reps} onChange={(e) => updateExercise(ex.id, { reps: e.target.value })}/>
                                 </div>
                              </div>
                              <button onClick={() => deleteExercise(ex.id)} className="w-full py-3 bg-red-50 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2"><Trash2 size={18}/> Eliminar Ejercicio</button>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </motion.div>
               );
            })}
         </div>
      </div>
   );
}
