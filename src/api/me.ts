// ─── /v1/me — profile, goals, nutrition, context ───────────────────────────

import {
   apiFetch,
   type ActivityLevel,
   type ApiResult,
   type ChannelType,
   type Height,
   type PrimaryGoal,
   type Sex,
   type TargetMode,
   type UnitSystem,
   type UserStatus,
} from "./client"

// ─── Identity (GET /v1/me) ─────────────────────────────────────────────────

export interface SessionUser {
   id: string
   email: string
   firstName: string
   lastName: string
   displayName: string
   status: UserStatus
}

export interface MeResponse {
   user: SessionUser
   session: { expiresAt: string }
}

export function apiGetMe(): Promise<ApiResult<MeResponse>> {
   return apiFetch<MeResponse>("/me")
}

// ─── Profile ───────────────────────────────────────────────────────────────

export interface UserProfile {
   unitSystem: UnitSystem
   birthDate: string | null
   sex: Sex
   height: Height | null
   currentWeight: number | null
   timezone: string
   locale: string
}

export interface UpsertProfilePayload {
   unitSystem: UnitSystem
   birthDate: string
   sex: Sex
   height: Height
   currentWeight: number
   timezone: string
   locale: string
}

export function apiGetProfile(): Promise<ApiResult<{ profile: UserProfile | null }>> {
   return apiFetch("/me/profile")
}

export function apiPutProfile(
   payload: UpsertProfilePayload,
): Promise<ApiResult<{ profile: UserProfile | null }>> {
   return apiFetch("/me/profile", { method: "PUT", body: payload })
}

// ─── Goals ─────────────────────────────────────────────────────────────────

export interface UserGoals {
   primaryGoal: PrimaryGoal
   activityLevel: ActivityLevel
   trainingDaysPerWeek: number | null
   targetWeight: number | null
}

export interface UpsertGoalsPayload {
   primaryGoal: PrimaryGoal
   activityLevel: ActivityLevel
   trainingDaysPerWeek?: number
   targetWeight?: number
}

export function apiGetGoals(): Promise<ApiResult<{ goals: UserGoals | null }>> {
   return apiFetch("/me/goals")
}

export function apiPutGoals(
   payload: UpsertGoalsPayload,
): Promise<ApiResult<{ goals: UserGoals | null }>> {
   return apiFetch("/me/goals", { method: "PUT", body: payload })
}

// ─── Nutrition settings ────────────────────────────────────────────────────

export interface NutritionSettings {
   targetMode: TargetMode
   dailyCalorieTarget: number
   manualCalorieTarget: number | null
   calculatedCalorieTarget: number | null
   proteinTargetG: number | null
   carbsTargetG: number | null
   fatTargetG: number | null
   calculationVersion: string | null
}

export interface UpsertNutritionPayload {
   targetMode: TargetMode
   manualCalorieTarget?: number
   proteinTargetG?: number
   carbsTargetG?: number
   fatTargetG?: number
}

export function apiGetNutritionSettings(): Promise<
   ApiResult<{ nutrition: NutritionSettings | null }>
> {
   return apiFetch("/me/nutrition-settings")
}

export function apiPutNutritionSettings(
   payload: UpsertNutritionPayload,
): Promise<ApiResult<{ nutrition: NutritionSettings | null }>> {
   return apiFetch("/me/nutrition-settings", { method: "PUT", body: payload })
}

// ─── Aggregated context (GET /v1/me/context) ───────────────────────────────

export interface PublicChannel {
   type: ChannelType
   identifier: string
   verified: boolean
}

export interface TodayContext {
   date: string
   calorieTarget: number | null
   caloriesConsumed: number
   caloriesRemaining: number | null
   proteinG: number
   carbsG: number
   fatG: number
   mealCount: number
}

export interface UserPreferences {
   themeColor: string
   darkMode: boolean
   locale: string
}

export interface GamificationState {
   xp: number
   level: number
   currentStreak: number
   longestStreak: number
   totalWorkouts: number
   lastActivityDate: string | null
   achievements: string[]
}

export interface ContextHabit {
   type: "WATER" | "STEPS"
   value: number
   target: number | null
}

export interface FeatureFlags {
   whatsapp: boolean
}

export interface MeContext {
   user: SessionUser
   onboardingCompleted: boolean
   profile: UserProfile | null
   goals: UserGoals | null
   nutrition: NutritionSettings | null
   preferences: UserPreferences
   gamification: GamificationState
   features: FeatureFlags
   habits: ContextHabit[]
   channels: PublicChannel[]
   coachingProfile: unknown | null
   today: TodayContext
}

export function apiGetContext(): Promise<ApiResult<MeContext>> {
   return apiFetch<MeContext>("/me/context")
}

// ─── UI preferences (theme, dark mode, language) ───────────────────────────

export interface UpdatePreferencesPayload {
   themeColor?: string
   darkMode?: boolean
   locale?: string
}

export function apiUpdatePreferences(
   payload: UpdatePreferencesPayload,
): Promise<ApiResult<{ preferences: UserPreferences }>> {
   return apiFetch("/me/preferences", { method: "PATCH", body: payload })
}
