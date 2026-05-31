import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Goal = 'baja_peso' | 'gana_masa' | 'mantiene' | 'bienestar';
type Level = 'principiante' | 'intermedio' | 'avanzado';

export interface UserProfile {
  name: string;
  email?: string;
  goal: Goal;
  level: Level;
  weight: number;
  height: number;
  workoutsPerWeek: number;
  timePerSession: number;
  preferences: string[];
}

export interface WeightEntry {
  date: string; // ISO date string
  weight: number;
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
  date: string; // ISO date string (YYYY-MM-DD)
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

function getTargetWeight(goal: Goal, currentWeight: number): number {
  if (goal === 'baja_peso') return Math.round((currentWeight - 5) * 10) / 10;
  if (goal === 'gana_masa') return Math.round((currentWeight + 3) * 10) / 10;
  return currentWeight;
}

function getTargetCalories(goal: Goal): number {
  if (goal === 'baja_peso') return 1800;
  if (goal === 'gana_masa') return 2500;
  return 2000;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function todayCalories(meals: Meal[]): number {
  const today = todayISO();
  return meals.filter(m => m.date === today).reduce((sum, m) => sum + m.calories, 0);
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
  workoutsCreated: number;
  workouts: Workout[];
  activeWorkoutId: string | null;
  themeColor: string;
  weightHistory: WeightEntry[];
  targetWeight: number;
   lastWorkoutDate: string | null;
   lastResetDate: string | null;
   lastUserEmail: string | null;

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
  checkAndResetDaily: () => void;
  toggleDarkMode: () => void;
  setThemeColor: (theme: string) => void;
  resetProgress: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  updateWeight: (weight: number) => void;
  addWeightEntry: (weight: number, dateStr?: string) => void;
  updateStreak: () => void;

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
      workoutsCreated: 0,
      workouts: [],
      activeWorkoutId: null,
      themeColor: 'orange',
      weightHistory: [],
      targetWeight: 65,
      lastWorkoutDate: null,
      lastResetDate: null,
      lastUserEmail: null,
      setThemeColor: (theme) => set({ themeColor: theme }),

      completeOnboarding: (profile) => {
         const state = get();
         const newEmail = profile.email || null;
         const isNewUser = newEmail && newEmail !== state.lastUserEmail;
         const today = new Date().toISOString().split('T')[0];

         if (isNewUser) {
           set({
             isOnboarded: true,
             user: profile,
             lastUserEmail: newEmail,
             targetCalories: getTargetCalories(profile.goal),
             targetWeight: getTargetWeight(profile.goal, profile.weight),
             weightHistory: [{ date: today, weight: profile.weight }],
             xp: 0,
             level: 1,
             streak: 0,
             dailyCalories: 0,
             waterGlasses: 0,
             waterLiters: 0,
             meals: [],
             workoutCompleted: false,
             totalWorkouts: 0,
             workoutsCreated: 0,
             workouts: [],
             activeWorkoutId: null,
             lastWorkoutDate: null,
             lastResetDate: null,
           });
         } else {
           set({
             isOnboarded: true,
             user: profile,
             lastUserEmail: newEmail,
             targetCalories: getTargetCalories(profile.goal),
             targetWeight: getTargetWeight(profile.goal, profile.weight),
             weightHistory: [{ date: today, weight: profile.weight }],
           });
         }
       },
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
        const mealWithDate = { ...meal, date: meal.date || todayISO() };
        const newMeals = [mealWithDate, ...state.meals];
        set({
          meals: newMeals,
          dailyCalories: todayCalories(newMeals),
        });
      },
      updateMealGrams: (id, newGrams) => set((state) => {
        const updatedMeals = state.meals.map(m => {
          if (m.id === id) {
            const ratio = newGrams / 100;
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
        return { meals: updatedMeals, dailyCalories: todayCalories(updatedMeals) };
      }),
      removeMeal: (id) => set((state) => {
        const updatedMeals = state.meals.filter(m => m.id !== id);
        return { meals: updatedMeals, dailyCalories: todayCalories(updatedMeals) };
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
          const today = new Date().toISOString().split('T')[0];
          // Check if last workout was yesterday to maintain streak
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          let newStreak = state.streak;
          if (state.lastWorkoutDate === yesterdayStr || state.lastWorkoutDate === today) {
            // Streak continues or already counted today
          } else if (state.lastWorkoutDate !== today) {
            newStreak = state.streak + 1;
          }

          set({
            totalWorkouts: state.totalWorkouts + 1,
            streak: newStreak,
            lastWorkoutDate: today,
          });
        }
        set({ workoutCompleted: completed });
      },
      resetDaily: () => set((state) => ({
        dailyCalories: 0, waterGlasses: 0, waterLiters: 0, workoutCompleted: false,
        workouts: state.workouts.map(w => ({ ...w, exercises: w.exercises.map(e => ({ ...e, completed: false })) })),
        lastResetDate: todayISO(),
      })),
      checkAndResetDaily: () => {
        const state = get();
        const today = todayISO();
        if (state.lastResetDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = state.streak;
        if (state.lastWorkoutDate && state.lastWorkoutDate !== today && state.lastWorkoutDate !== yesterdayStr) {
          newStreak = 0;
        }

        set({
          dailyCalories: todayCalories(state.meals),
          waterGlasses: 0,
          waterLiters: 0,
          workoutCompleted: false,
          workouts: state.workouts.map(w => ({ ...w, exercises: w.exercises.map(e => ({ ...e, completed: false })) })),
          streak: newStreak,
          lastResetDate: today,
        });
      },
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      resetProgress: () => set({ xp: 0, level: 1, streak: 0, totalWorkouts: 0, workoutCompleted: false, waterGlasses: 0, waterLiters: 0, dailyCalories: 0, meals: [], workouts: [], workoutsCreated: 0, activeWorkoutId: null, weightHistory: [], lastWorkoutDate: null, lastResetDate: null }),
      updateUser: (updates) => set((state) => {
        const newUser = state.user ? { ...state.user, ...updates } : null;
        let newTargetWeight = state.targetWeight;
        let newTargetCalories = state.targetCalories;
        if (newUser) {
          if (updates.goal) {
            newTargetCalories = getTargetCalories(newUser.goal);
            newTargetWeight = getTargetWeight(newUser.goal, newUser.weight);
          }
          if (updates.weight && !updates.goal) {
            newTargetWeight = getTargetWeight(newUser.goal, newUser.weight);
          }
        }
        return {
          user: newUser,
          targetCalories: newTargetCalories,
          targetWeight: newTargetWeight,
        };
      }),
      updateWeight: (weight) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const existingIndex = state.weightHistory.findIndex(e => e.date === today);
        let newHistory;
        if (existingIndex >= 0) {
          newHistory = state.weightHistory.map((e, i) => i === existingIndex ? { ...e, weight } : e);
        } else {
          newHistory = [...state.weightHistory, { date: today, weight }];
        }
        return {
          user: state.user ? { ...state.user, weight } : null,
          weightHistory: newHistory,
          targetWeight: state.user ? getTargetWeight(state.user.goal, weight) : state.targetWeight,
        };
      }),
      addWeightEntry: (weight, dateStr) => set((state) => {
        const date = dateStr || new Date().toISOString().split('T')[0];
        const existingIndex = state.weightHistory.findIndex(e => e.date === date);
        let newHistory;
        if (existingIndex >= 0) {
          newHistory = state.weightHistory.map((e, i) => i === existingIndex ? { ...e, weight } : e);
        } else {
          newHistory = [...state.weightHistory, { date, weight }];
        }
        const isToday = date === new Date().toISOString().split('T')[0];
        return {
          user: isToday && state.user ? { ...state.user, weight } : state.user,
          weightHistory: newHistory,
          targetWeight: (isToday && state.user) ? getTargetWeight(state.user.goal, weight) : state.targetWeight,
        };
      }),
      updateStreak: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        if (state.lastWorkoutDate === today) return {};
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const newStreak = state.lastWorkoutDate === yesterdayStr ? state.streak + 1 : 1;
        return { streak: newStreak, lastWorkoutDate: today };
      }),

      // Workout Actions
      addWorkout: (name) => set((state) => {
        const newWorkout: Workout = {
          id: Date.now().toString(),
          name,
          exercises: []
        };
        return {
          workouts: [...state.workouts, newWorkout],
          activeWorkoutId: newWorkout.id,
          workoutsCreated: state.workoutsCreated + 1,
        };
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
