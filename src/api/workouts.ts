// ─── /v1/exercises + /v1/me/workout-sessions ───────────────────────────────

import {
   apiFetch,
   browserTimezone,
   type ApiResult,
   type EntrySource,
   type UnitSystem,
} from "./client"

export type ExerciseDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
export type MediaType = "IMAGE" | "GIF" | "VIDEO" | "LOTTIE" | "ANIMATION_LOOP"

// Closed-vocabulary enum values, mirroring prisma/schema.prisma (the API serializes the enum
// member names, e.g. "CHEST", "BODY_ONLY"). Used for filter chips; localized via i18next keys.
export const MUSCLE_GROUPS = [
   "ABDOMINALS", "ABDUCTORS", "ADDUCTORS", "BICEPS", "CALVES", "CHEST", "FOREARMS", "GLUTES",
   "HAMSTRINGS", "LATS", "LOWER_BACK", "MIDDLE_BACK", "NECK", "QUADRICEPS", "SHOULDERS", "TRAPS",
   "TRICEPS",
] as const
export const EQUIPMENT = [
   "BODY_ONLY", "MACHINE", "BARBELL", "DUMBBELL", "KETTLEBELLS", "CABLE", "BANDS", "MEDICINE_BALL",
   "EXERCISE_BALL", "FOAM_ROLL", "EZ_CURL_BAR", "OTHER",
] as const
export const EXERCISE_CATEGORIES = [
   "STRENGTH", "STRETCHING", "PLYOMETRICS", "STRONGMAN", "POWERLIFTING", "CARDIO",
   "OLYMPIC_WEIGHTLIFTING",
] as const
export const EXERCISE_DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]
export type Equipment = (typeof EQUIPMENT)[number]
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number]
export type ExerciseForce = "STATIC" | "PULL" | "PUSH"
export type ExerciseMechanic = "COMPOUND" | "ISOLATION"

export interface ExerciseMedia {
   mediaType: MediaType
   url: string
   altText: string | null
   isPrimary: boolean
}

export interface Exercise {
   id: string
   slug: string
   /** Locale of the returned name/description after the platform's fallback resolution. */
   locale: string
   name: string
   description: string | null
   primaryMuscleGroup: MuscleGroup
   secondaryMuscleGroups: MuscleGroup[]
   equipment: Equipment | null
   difficulty: ExerciseDifficulty
   category: ExerciseCategory | null
   force: ExerciseForce | null
   mechanic: ExerciseMechanic | null
   media: ExerciseMedia[]
}

export function apiListExercises(query?: {
   muscleGroup?: MuscleGroup
   equipment?: Equipment
   category?: ExerciseCategory
   difficulty?: ExerciseDifficulty
   search?: string
   /** Preferred content locale (e.g. "es", "pt", "en"). Platform falls back to "en". */
   locale?: string
   limit?: number
}): Promise<ApiResult<{ exercises: Exercise[] }>> {
   return apiFetch("/exercises", { query: query })
}

// ─── Workout sessions ──────────────────────────────────────────────────────

export interface WorkoutSetInput {
   reps?: number
   weight?: number
   durationSeconds?: number
   distanceMeters?: number
   completed?: boolean
}

export interface WorkoutExerciseInput {
   exerciseId?: string
   exerciseName?: string
   notes?: string
   sets: WorkoutSetInput[]
}

export interface CreateWorkoutSessionPayload {
   unitSystem?: UnitSystem
   title?: string
   notes?: string
   performedAt?: string
   timezone?: string
   durationMinutes?: number
   idempotencyKey?: string
   exercises: WorkoutExerciseInput[]
}

export interface WorkoutSession {
   id: string
   source: EntrySource
   title: string | null
   notes: string | null
   performedAt: string
   localDate: string
   timezone: string
   durationMinutes: number | null
   idempotencyKey: string | null
   unitSystem: UnitSystem
   exercises: unknown[]
   createdAt: string
   updatedAt: string
}

export function apiCreateWorkoutSession(
   payload: CreateWorkoutSessionPayload,
): Promise<ApiResult<{ workoutSession: WorkoutSession }>> {
   return apiFetch("/me/workout-sessions", {
      method: "POST",
      body: { timezone: browserTimezone(), ...payload },
   })
}

export function apiListWorkoutSessions(query?: {
   from?: string
   to?: string
   limit?: number
}): Promise<ApiResult<{ workoutSessions: WorkoutSession[] }>> {
   return apiFetch("/me/workout-sessions", { query: query })
}
