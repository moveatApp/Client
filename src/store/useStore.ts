import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Goal = 'baja_peso' | 'gana_masa' | 'mantiene' | 'bienestar';
type Level = 'principiante' | 'intermedio' | 'avanzado';

export interface UserProfile {
  name: string;
  goal: Goal;
  level: Level;
  weight: number;
  workoutsPerWeek: number;
  timePerSession: number;
  preferences: string[];
}

export interface Meal {
  id: string;
  name: string;
  // Base values per 100g or per base portion
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  baseSugar: number;
  grams: number; // Current portion size
  // Computed values
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  time: string;
}

export interface ExerciseSet {
  id: string;
  reps: string;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  completed: boolean;
  setDetails?: ExerciseSet[];
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
}

interface AppState {
  isOnboarded: boolean;
  user: UserProfile | null;
  xp: number;
  level: number;
  streak: number;
  dailyCalories: number;
  targetCalories: number;
  waterGlasses: number;
  waterLiters: number;
  meals: Meal[];
  workoutCompleted: boolean;
  isDarkMode: boolean;
  totalWorkouts: number;
  workouts: Workout[];
  activeWorkoutId: string | null;
  themeColor: string;
  
  // Actions
  completeOnboarding: (profile: UserProfile) => void;
  addXP: (amount: number) => void;
  addMeal: (meal: Meal) => void;
  updateMealGrams: (id: string, newGrams: number) => void;
  removeMeal: (id: string) => void;
  addWater: () => void;
  resetWater: () => void;
  setWorkoutCompleted: (completed: boolean) => void;
  resetDaily: () => void;
  toggleDarkMode: () => void;
  setThemeColor: (theme: string) => void;
  resetProgress: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  
  // Workout Actions
  addWorkout: (name: string) => void;
  deleteWorkout: (id: string) => void;
  setActiveWorkout: (id: string) => void;
  
  // Exercise Actions
  addExercise: (workoutId: string) => void;
  updateExercise: (workoutId: string, exerciseId: string, fields: Partial<Exercise>) => void;
  deleteExercise: (workoutId: string, exerciseId: string) => void;
  toggleExerciseCompletion: (workoutId: string, exerciseId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isOnboarded: false,
      user: null,
      xp: 0,
      level: 1,
      streak: 0,
      dailyCalories: 0,
      targetCalories: 2000,
      waterGlasses: 0,
      waterLiters: 0,
      meals: [],
      workoutCompleted: false,
      isDarkMode: false,
      totalWorkouts: 0,
      workouts: [
        {
          id: 'w1',
          name: 'Full Body Express',
          exercises: [
            { id: 'e1', name: 'Jumping Jacks', sets: 3, reps: '45s', rest: '15s', completed: false },
            { id: 'e2', name: 'Squats', sets: 3, reps: '15', rest: '30s', completed: false },
            { id: 'e3', name: 'Push-ups', sets: 3, reps: '10', rest: '30s', completed: false },
            { id: 'e4', name: 'Plank', sets: 3, reps: '30s', rest: '30s', completed: false },
          ]
        }
      ],
      activeWorkoutId: 'w1',
      themeColor: 'orange',
      setThemeColor: (theme) => set({ themeColor: theme }),

      completeOnboarding: (profile) => set({ isOnboarded: true, user: profile, targetCalories: profile.goal === 'baja_peso' ? 1800 : profile.goal === 'gana_masa' ? 2500 : 2000 }),
      addXP: (amount) => set((state) => {
        const newXp = state.xp + amount;
        let newLevel = state.level;
        if (newXp >= state.level * 100) {
          newLevel += 1;
        }
        return { xp: newXp, level: newLevel };
      }),
      addMeal: (meal) => {
        const state = get();
        state.addXP(20);
        set({ 
          meals: [meal, ...state.meals],
          dailyCalories: state.dailyCalories + meal.calories
        });
      },
      updateMealGrams: (id, newGrams) => set((state) => {
        const updatedMeals = state.meals.map(m => {
          if (m.id === id) {
            const ratio = newGrams / 100; // Assuming base values are per 100g
            return {
              ...m,
              grams: newGrams,
              calories: Math.round(m.baseCalories * ratio),
              protein: Math.round(m.baseProtein * ratio),
              carbs: Math.round(m.baseCarbs * ratio),
              fat: Math.round(m.baseFat * ratio),
              sugar: Math.round(m.baseSugar * ratio)
            };
          }
          return m;
        });
        const newDailyCalories = updatedMeals.reduce((acc, current) => acc + current.calories, 0);
        return { meals: updatedMeals, dailyCalories: newDailyCalories };
      }),
      removeMeal: (id) => set((state) => {
        const updatedMeals = state.meals.filter(m => m.id !== id);
        const newDailyCalories = updatedMeals.reduce((acc, current) => acc + current.calories, 0);
        return { meals: updatedMeals, dailyCalories: newDailyCalories };
      }),
      addWater: () => set((state) => ({ waterGlasses: state.waterGlasses + 1 })),
      resetWater: () => set((state) => ({ 
        waterGlasses: 0, 
        waterLiters: state.waterLiters + 1 
      })),
      setWorkoutCompleted: (completed) => {
        const state = get();
        if (completed && !state.workoutCompleted) {
          state.addXP(50);
          set({ totalWorkouts: state.totalWorkouts + 1 });
        }
        set({ workoutCompleted: completed });
      },
      resetDaily: () => set((state) => ({ 
        dailyCalories: 0, waterGlasses: 0, waterLiters: 0, meals: [], workoutCompleted: false,
        workouts: state.workouts.map(w => ({ ...w, exercises: w.exercises.map(e => ({ ...e, completed: false })) }))
      })),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      resetProgress: () => set({ xp: 0, level: 1, streak: 0, totalWorkouts: 0, workoutCompleted: false, waterGlasses: 0, waterLiters: 0, dailyCalories: 0, meals: [] }),
      updateUser: (updates) => set((state) => ({ 
        user: state.user ? { ...state.user, ...updates } : null,
        // Update target calories if goal changed
        targetCalories: updates.goal 
          ? (updates.goal === 'baja_peso' ? 1800 : updates.goal === 'gana_masa' ? 2500 : 2000)
          : state.targetCalories
      })),

      // Workout Actions
      addWorkout: (name) => set((state) => {
        const newWorkout: Workout = {
          id: Date.now().toString(),
          name,
          exercises: []
        };
        return { workouts: [...state.workouts, newWorkout], activeWorkoutId: newWorkout.id };
      }),
      deleteWorkout: (id) => set((state) => {
        const remaining = state.workouts.filter(w => w.id !== id);
        return { 
          workouts: remaining,
          activeWorkoutId: state.activeWorkoutId === id ? (remaining[0]?.id || null) : state.activeWorkoutId
        };
      }),
      setActiveWorkout: (id) => set({ activeWorkoutId: id }),

      // Exercise Actions
      addExercise: (workoutId) => set((state) => ({
        workouts: state.workouts.map(w => {
          if (w.id === workoutId) {
            return {
              ...w,
              exercises: [...w.exercises, {
                id: Date.now().toString(),
                name: 'Nuevo Ejercicio',
                sets: 3,
                reps: '10',
                rest: '30s',
                completed: false
              }]
            };
          }
          return w;
        })
      })),
      updateExercise: (workoutId, exerciseId, fields) => set((state) => ({
        workouts: state.workouts.map(w => {
          if (w.id === workoutId) {
            return {
              ...w,
              exercises: w.exercises.map(e => e.id === exerciseId ? { ...e, ...fields } : e)
            };
          }
          return w;
        })
      })),
      deleteExercise: (workoutId, exerciseId) => set((state) => ({
        workouts: state.workouts.map(w => {
          if (w.id === workoutId) {
            return {
              ...w,
              exercises: w.exercises.filter(e => e.id !== exerciseId)
            };
          }
          return w;
        })
      })),
      toggleExerciseCompletion: (workoutId, exerciseId) => set((state) => ({
        workouts: state.workouts.map(w => {
          if (w.id === workoutId) {
            return {
              ...w,
              exercises: w.exercises.map(e => {
                if (e.id === exerciseId) {
                  const newCompleted = !e.completed;
                  return {
                    ...e,
                    completed: newCompleted,
                    setDetails: e.setDetails?.map(s => ({ ...s, completed: newCompleted }))
                  };
                }
                return e;
              })
            };
          }
          return w;
        })
      }))
    }),
    {
      name: 'moveat-storage',
    }
  )
);
