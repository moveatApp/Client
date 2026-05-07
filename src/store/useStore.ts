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

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  completed: boolean;
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
  resetProgress: () => void;
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
      resetDaily: () => set({ dailyCalories: 0, waterGlasses: 0, waterLiters: 0, meals: [], workoutCompleted: false }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      resetProgress: () => set({ xp: 0, level: 1, streak: 0, totalWorkouts: 0, workoutCompleted: false, waterGlasses: 0, waterLiters: 0, dailyCalories: 0, meals: [] }),
    }),
    {
      name: 'moveat-storage',
    }
  )
);
