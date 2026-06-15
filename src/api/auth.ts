// ─── /v1/auth + onboarding + channels ──────────────────────────────────────

import {
   apiFetch,
   browserTimezone,
   type ActivityLevel,
   type ApiResult,
   type ChannelType,
   type PrimaryGoal,
   type Sex,
   type TargetMode,
   type UnitSystem,
} from "./client"
import type { MeResponse, SessionUser } from "./me"

// Re-export the identity helpers so existing imports keep working.
export { apiGetMe } from "./me"
export type { MeResponse, SessionUser } from "./me"

export interface AuthResponse {
   user: SessionUser
   session: { expiresAt: string }
}

// ─── Auth endpoints ─────────────────────────────────────────────────────────

export interface SignupPayload {
   email: string
   password: string
   firstName: string
   lastName: string
}

export function apiSignup(
   payload: SignupPayload,
): Promise<ApiResult<AuthResponse>> {
   return apiFetch("/auth/signup", {
      method: "POST",
      body: payload,
      messages: {
         409: "auth.email_taken",
         429: "auth.rate_limited",
      },
   })
}

export interface LoginPayload {
   email: string
   password: string
}

export function apiLogin(
   payload: LoginPayload,
): Promise<ApiResult<AuthResponse>> {
   return apiFetch("/auth/login", {
      method: "POST",
      body: payload,
      messages: {
         401: "auth.invalid_credentials",
         429: "auth.rate_limited",
      },
   })
}

export interface GoogleLoginPayload {
   idToken: string
}

export function apiGoogleLogin(
   payload: GoogleLoginPayload,
): Promise<ApiResult<AuthResponse>> {
   return apiFetch("/auth/google", {
      method: "POST",
      body: payload,
      messages: { 401: "auth.google_failed" },
   })
}

export function apiLogout(): Promise<ApiResult<void>> {
   return apiFetch("/auth/logout", { method: "POST" })
}

// ─── Onboarding (PUT /v1/me/onboarding) ─────────────────────────────────────

export interface OnboardingProfile {
   birthDate: string
   sex: Sex
   height: { cm: number } | { feet: number; inches: number }
   currentWeight: number
   timezone: string
   locale: string
}

export interface OnboardingGoals {
   primaryGoal: PrimaryGoal
   activityLevel: ActivityLevel
   trainingDaysPerWeek?: number
   targetWeight?: number
}

export interface OnboardingNutrition {
   targetMode: TargetMode
   manualCalorieTarget?: number
   proteinTargetG?: number
   carbsTargetG?: number
   fatTargetG?: number
}

export interface PutOnboardingPayload {
   unitSystem: UnitSystem
   profile: OnboardingProfile
   goals: OnboardingGoals
   nutrition: OnboardingNutrition
}

export function apiPutOnboarding(
   payload: PutOnboardingPayload,
): Promise<ApiResult<unknown>> {
   return apiFetch("/me/onboarding", { method: "PUT", body: payload })
}

// ─── Channels ───────────────────────────────────────────────────────────────

export interface Channel {
   channel: ChannelType
   identifier: string
   verified: boolean
}

export function apiGetChannels(): Promise<ApiResult<{ channels: Channel[] }>> {
   return apiFetch("/me/channels")
}

export function apiPutChannel(
   channel: "whatsapp" | "telegram" | "signal",
   identifier: string,
): Promise<ApiResult<Channel>> {
   return apiFetch(`/me/channels/${channel}`, {
      method: "PUT",
      body: { identifier },
      messages: {
         409: "channel.identifier_taken",
      },
   })
}

// ─── Onboarding form → payload mapping ──────────────────────────────────────

export interface OnboardingFormData {
   name: string
   lastName: string
   goal: string
   gender: string
   /** Date of birth in YYYY-MM-DD (what the platform stores). */
   birthDate: string
   weight: number
   height: number
   /** Optional goal weight in kg. 0/undefined means "use the suggestion". */
   targetWeight?: number
   level: string
   timePerSession: number
   preferences: string[]
   vibe: string
}

export function buildSignupPayload(
   email: string,
   password: string,
   firstName: string,
   lastName: string,
): SignupPayload {
   return {
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
   }
}

/** Whole years elapsed since the given YYYY-MM-DD date of birth. */
export function ageFromBirthDate(birthDate: string): number {
   const dob = new Date(`${birthDate}T00:00:00`)
   if (Number.isNaN(dob.getTime())) return 0
   const today = new Date()
   let age = today.getFullYear() - dob.getFullYear()
   const monthDiff = today.getMonth() - dob.getMonth()
   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1
   }
   return age
}

export function mapSex(gender: string): Sex {
   if (gender === "male") return "MALE"
   if (gender === "female") return "FEMALE"
   if (gender === "other") return "OTHER"
   return "UNSPECIFIED"
}

export function mapPrimaryGoal(goal: string): PrimaryGoal {
   if (goal === "baja_peso") return "FAT_LOSS"
   if (goal === "gana_masa") return "MUSCLE_GAIN"
   return "MAINTENANCE"
}

export function mapActivityLevel(level: string): ActivityLevel {
   if (level === "principiante") return "LIGHT"
   if (level === "avanzado") return "ACTIVE"
   return "MODERATE"
}

export function trainingDaysFromLevel(level: string): number {
   if (level === "principiante") return 2
   if (level === "intermedio") return 3
   return 5
}

/** A sensible default goal weight (kg) derived from the goal and current weight. */
export function suggestTargetWeight(goal: string, weight: number): number {
   if (goal === "baja_peso") return Math.round((weight - 5) * 10) / 10
   if (goal === "gana_masa") return Math.round((weight + 3) * 10) / 10
   return weight
}

export function buildOnboardingPayload(
   form: OnboardingFormData,
): PutOnboardingPayload {
   const primaryGoal = mapPrimaryGoal(form.goal)
   const goals: OnboardingGoals = {
      primaryGoal,
      activityLevel: mapActivityLevel(form.level),
      trainingDaysPerWeek: trainingDaysFromLevel(form.level),
   }
   // Only send a goal weight for non-maintenance goals.
   if (primaryGoal !== "MAINTENANCE") {
      goals.targetWeight =
         form.targetWeight && form.targetWeight > 0
            ? form.targetWeight
            : suggestTargetWeight(form.goal, form.weight)
   }

   return {
      unitSystem: "METRIC",
      profile: {
         birthDate: form.birthDate,
         sex: mapSex(form.gender),
         height: { cm: form.height },
         currentWeight: form.weight,
         timezone: browserTimezone(),
         locale: navigator.language || "es-AR",
      },
      goals,
      // Let the platform compute calorie/macro targets from profile + goals.
      nutrition: {
         targetMode: "CALCULATED",
      },
   }
}
