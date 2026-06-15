import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MeContext } from '@/api/me';
import type { MealEntry } from '@/api/meals';
import type { WeightLog } from '@/api/weight';
import type { Routine } from '@/api/routines';
import type { ActivityLevel, PrimaryGoal } from '@/api/client';

export type Goal = 'baja_peso' | 'gana_masa' | 'mantiene' | 'bienestar';
export type Level = 'principiante' | 'intermedio' | 'avanzado';

// ─── Backend ⇄ store enum mapping ──────────────────────────────────────────

export function goalFromApi(goal: PrimaryGoal): Goal {
  if (goal === 'FAT_LOSS') return 'baja_peso';
  if (goal === 'MUSCLE_GAIN') return 'gana_masa';
  return 'mantiene';
}

export function levelFromApi(level: ActivityLevel): Level {
  if (level === 'SEDENTARY' || level === 'LIGHT') return 'principiante';
  if (level === 'ACTIVE' || level === 'VERY_ACTIVE') return 'avanzado';
  return 'intermedio';
}

function heightCm(height: { cm?: number; feet?: number; inches?: number } | null): number {
  if (!height) return 0;
  if (typeof height.cm === 'number') return Math.round(height.cm);
  if (typeof height.feet === 'number') {
    return Math.round(height.feet * 30.48 + (height.inches ?? 0) * 2.54);
  }
  return 0;
}

/** Maps a backend meal entry to the local Meal shape used by the UI. */
export function mealFromEntry(entry: MealEntry): Meal {
  const sum = (pick: (i: MealEntry['items'][number]) => number | null | undefined): number =>
    Math.round(entry.items.reduce((acc, item) => acc + (pick(item) ?? 0), 0));

  const calories = sum((i) => i.estimatedCalories);
  const protein = sum((i) => i.proteinG);
  const carbs = sum((i) => i.carbsG);
  const fat = sum((i) => i.fatG);
  const name = entry.originalInput?.trim() || entry.items.map((i) => i.name).join(', ') || 'Comida';
  const occurred = new Date(entry.occurredAt);

  return {
    id: entry.id,
    name,
    // Backend meals have no per-100g base, so base == total and grams == 100
    // keeps the macro slider neutral (local-only; it does not sync back).
    baseCalories: calories,
    baseProtein: protein,
    baseCarbs: carbs,
    baseFat: fat,
    baseSugar: 0,
    grams: 100,
    calories,
    protein,
    carbs,
    fat,
    sugar: 0,
    time: occurred.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    date: entry.localDate,
  };
}

export interface UserProfile {
  name: string;
  email?: string;
  goal: Goal;
  level: Level;
  weight: number;
  height: number;
  targetWeight: number;
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

// Routines (workout templates) are backend-authoritative; see src/api/routines.ts.
export type { Routine, RoutineExercise } from '@/api/routines';

function getTargetWeight(goal: Goal, currentWeight: number, userTarget?: number): number {
  if (userTarget != null && userTarget > 0) return userTarget;
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
  waterStreak: number;
  lastHydrationStreakDate: string | null;
  meals: Meal[];
  workoutCompleted: boolean;
  isDarkMode: boolean;
  animationsEnabled: boolean;
  totalWorkouts: number;
  routines: Routine[];
  activeRoutineId: string | null;
  themeColor: string;
  weightHistory: WeightEntry[];
  targetWeight: number;
  lastWorkoutDate: string | null;
  lastResetDate: string | null;
  lastUserEmail: string | null;
  hydrated: boolean;

   // Actions
   completeOnboarding: (profile: UserProfile) => void;
  hydrateFromContext: (ctx: MeContext) => void;
  setMealsFromEntries: (entries: MealEntry[]) => void;
  setWeightHistoryFromLogs: (logs: WeightLog[]) => void;
  setDailyTotals: (consumed: number, target?: number | null) => void;
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
   toggleAnimations: () => void;
   setThemeColor: (theme: string) => void;
  resetProgress: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  updateWeight: (weight: number) => void;
  addWeightEntry: (weight: number, dateStr?: string) => void;
  updateStreak: () => void;

  // Routine Actions (backend-authoritative)
  setRoutines: (routines: Routine[]) => void;
  upsertRoutine: (routine: Routine) => void;
  removeRoutine: (id: string) => void;
  setActiveRoutine: (id: string | null) => void;
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
      waterStreak: 0,
      lastHydrationStreakDate: null,
      meals: [],
      workoutCompleted: false,
      isDarkMode: false,
      animationsEnabled: true,
      totalWorkouts: 0,
      routines: [],
      activeRoutineId: null,
      themeColor: 'orange',
      weightHistory: [],
      targetWeight: 65,
      lastWorkoutDate: null,
      lastResetDate: null,
      lastUserEmail: null,
      hydrated: false,
      setThemeColor: (theme) => set({ themeColor: theme }),

      // ─── Backend hydration (backend is the source of truth) ──────────────
      hydrateFromContext: (ctx) => {
        const state = get();
        const name =
          ctx.user.displayName ||
          `${ctx.user.firstName} ${ctx.user.lastName}`.trim() ||
          'Usuario';
        const isNewUser = ctx.user.email !== state.lastUserEmail;

        const goal = ctx.goals ? goalFromApi(ctx.goals.primaryGoal) : (state.user?.goal ?? 'mantiene');
        const level = ctx.goals ? levelFromApi(ctx.goals.activityLevel) : (state.user?.level ?? 'principiante');
        const weight = ctx.profile?.currentWeight ?? state.user?.weight ?? 70;
        const height = heightCm(ctx.profile?.height ?? null) || state.user?.height || 170;
        const workoutsPerWeek = ctx.goals?.trainingDaysPerWeek ?? state.user?.workoutsPerWeek ?? 3;

        const target = ctx.today.calorieTarget ?? ctx.nutrition?.dailyCalorieTarget ?? state.targetCalories;
        const targetWeight = ctx.goals?.targetWeight ?? getTargetWeight(goal, weight);

        set({
          hydrated: true,
          isOnboarded: ctx.onboardingCompleted,
          lastUserEmail: ctx.user.email,
          // Reset gamification only when a different user signs in.
          ...(isNewUser
            ? {
                xp: 0,
                level: 1,
                streak: 0,
                waterGlasses: 0,
                waterLiters: 0,
                workoutCompleted: false,
                totalWorkouts: 0,
                routines: [],
                activeRoutineId: null,
                lastWorkoutDate: null,
                lastResetDate: null,
              }
            : {}),
          user: {
            name,
            email: ctx.user.email,
            goal,
            level,
            weight,
            height,
            targetWeight,
            workoutsPerWeek,
            timePerSession: state.user?.timePerSession ?? 30,
            preferences: state.user?.preferences ?? ['ninguna'],
          },
          targetCalories: target,
          targetWeight,
          dailyCalories: ctx.today.caloriesConsumed,
        });
      },
      setMealsFromEntries: (entries) => {
        const meals = entries
          .map(mealFromEntry)
          .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
        set({ meals, dailyCalories: todayCalories(meals) });
      },
      setWeightHistoryFromLogs: (logs) => {
        // Keep the latest log per local date.
        const byDate = new Map<string, number>();
        for (const log of [...logs].sort(
          (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
        )) {
          byDate.set(log.localDate, log.weight);
        }
        const weightHistory = Array.from(byDate.entries())
          .map(([date, weight]) => ({ date, weight }))
          .sort((a, b) => a.date.localeCompare(b.date));

        // No weight logs yet (e.g. fresh onboarding only set profile.currentWeight):
        // seed today's point from the current weight so the chart isn't empty.
        if (weightHistory.length === 0) {
          const current = get().user?.weight;
          if (typeof current === 'number' && current > 0) {
            set({ weightHistory: [{ date: todayISO(), weight: current }] });
            return;
          }
        }

        set({ weightHistory });
      },
      setDailyTotals: (consumed, target) =>
        set((state) => ({
          dailyCalories: consumed,
          targetCalories: target ?? state.targetCalories,
        })),

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
              targetWeight: getTargetWeight(profile.goal, profile.weight, profile.targetWeight),
             weightHistory: [{ date: today, weight: profile.weight }],
             xp: 0,
             level: 1,
             streak: 0,
             dailyCalories: 0,
             waterGlasses: 0,
             waterLiters: 0,
             waterStreak: 0,
             lastHydrationStreakDate: null,
             meals: [],
             workoutCompleted: false,
             totalWorkouts: 0,
             routines: [],
             activeRoutineId: null,
             lastWorkoutDate: null,
             lastResetDate: null,
           });
         } else {
           set({
             isOnboarded: true,
             user: profile,
             lastUserEmail: newEmail,
             targetCalories: getTargetCalories(profile.goal),
              targetWeight: getTargetWeight(profile.goal, profile.weight, profile.targetWeight),
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
      addWater: () => set((state) => {
        const nextGlasses = state.waterGlasses + 1;
        const today = todayISO();
        let newWaterStreak = state.waterStreak;
        let newLastHydrationStreakDate = state.lastHydrationStreakDate;
        if (nextGlasses >= 10) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (state.lastHydrationStreakDate === today) {
            // Ya registrado hoy
          } else if (state.lastHydrationStreakDate === yesterdayStr) {
            newWaterStreak = state.waterStreak + 1;
            newLastHydrationStreakDate = today;
          } else {
            newWaterStreak = 1;
            newLastHydrationStreakDate = today;
          }
        }
        return {
          waterGlasses: nextGlasses,
          waterStreak: newWaterStreak,
          lastHydrationStreakDate: newLastHydrationStreakDate,
        };
      }),
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
      resetDaily: () => set({
        dailyCalories: 0, waterGlasses: 0, waterLiters: 0, workoutCompleted: false,
        lastResetDate: todayISO(),
      }),
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

        let newWaterStreak = state.waterStreak;
        if (state.lastHydrationStreakDate !== today && state.lastHydrationStreakDate !== yesterdayStr) {
          newWaterStreak = 0;
        }

        set({
          dailyCalories: todayCalories(state.meals),
          waterGlasses: 0,
          waterLiters: 0,
          workoutCompleted: false,
          streak: newStreak,
          waterStreak: newWaterStreak,
          lastResetDate: today,
        });
      },
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      toggleAnimations: () => set((state) => ({ animationsEnabled: !state.animationsEnabled })),
      resetProgress: () => set({ xp: 0, level: 1, streak: 0, totalWorkouts: 0, workoutCompleted: false, waterGlasses: 0, waterLiters: 0, waterStreak: 0, lastHydrationStreakDate: null, dailyCalories: 0, meals: [], routines: [], activeRoutineId: null, weightHistory: [], lastWorkoutDate: null, lastResetDate: null }),
      updateUser: (updates) => set((state) => {
        const newUser = state.user ? { ...state.user, ...updates } : null;
        let newTargetWeight = state.targetWeight;
        let newTargetCalories = state.targetCalories;
        if (newUser) {
          if (updates.goal) {
            newTargetCalories = getTargetCalories(newUser.goal);
            newTargetWeight = getTargetWeight(newUser.goal, newUser.weight, newUser.targetWeight);
          }
          if (updates.weight && !updates.goal) {
            newTargetWeight = getTargetWeight(newUser.goal, newUser.weight, newUser.targetWeight);
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
        // targetWeight is the user's goal (backend-authoritative); logging the
        // current weight must NOT move it.
        return {
          user: state.user ? { ...state.user, weight } : null,
          weightHistory: newHistory,
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

      // Routine Actions (backend is the source of truth; pages call the API
      // and feed the results here).
      setRoutines: (routines) => set((state) => ({
        routines,
        activeRoutineId:
          state.activeRoutineId && routines.some(r => r.id === state.activeRoutineId)
            ? state.activeRoutineId
            : routines[0]?.id ?? null,
      })),
      upsertRoutine: (routine) => set((state) => {
        const exists = state.routines.some(r => r.id === routine.id);
        return {
          routines: exists
            ? state.routines.map(r => (r.id === routine.id ? routine : r))
            : [...state.routines, routine],
          activeRoutineId: routine.id,
        };
      }),
      removeRoutine: (id) => set((state) => {
        const remaining = state.routines.filter(r => r.id !== id);
        return {
          routines: remaining,
          activeRoutineId:
            state.activeRoutineId === id ? (remaining[0]?.id ?? null) : state.activeRoutineId,
        };
      }),
      setActiveRoutine: (id) => set({ activeRoutineId: id }),
    }),
    {
      name: 'moveat-storage',
      // `hydrated` is a per-session flag; never persist it so the app always
      // re-bootstraps its session against the backend on reload.
      partialize: ({ hydrated: _hydrated, ...rest }) => rest,
    }
  )
);
