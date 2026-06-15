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

export interface ExerciseMedia {
   mediaType: MediaType
   url: string
   altText: string | null
   isPrimary: boolean
}

export interface Exercise {
   id: string
   name: string
   slug: string
   description: string | null
   primaryMuscleGroup: string
   secondaryMuscleGroups: string[]
   equipment: string | null
   difficulty: ExerciseDifficulty
   media: ExerciseMedia[]
}

export function apiListExercises(query?: {
   muscleGroup?: string
   difficulty?: ExerciseDifficulty
   search?: string
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
