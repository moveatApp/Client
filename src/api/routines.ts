// ─── /v1/me/routines — editable workout routine templates ──────────────────

import { apiFetch, type ApiResult, type UnitSystem } from "./client"

// Mirrors prisma RoutineExerciseTracking. NOTE: the platform enum is DURATION (not "TIME").
export type RoutineTracking = "REPS" | "DURATION" | "DISTANCE"

export interface RoutineSet {
   id: string
   orderIndex: number
   targetReps: number | null
   targetDurationSeconds: number | null
   targetDistanceMeters: number | null
   targetWeight: number | null
   targetWeightKg: number | null
   rir: number | null
   rpe: number | null
   tempo: string | null
}

export interface RoutineExercise {
   id: string
   orderIndex: number
   exerciseId: string | null
   exerciseName: string
   /** Primary catalog image (relative /media path) when the exercise is linked. */
   imageUrl: string | null
   /** All catalog images (relative /media paths) for the animated preview. */
   imageUrls: string[]
   tracking: RoutineTracking
   usesWeight: boolean
   targetSets: number
   targetReps: number | null
   targetDurationSeconds: number | null
   targetDistanceMeters: number | null
   targetWeight: number | null
   targetWeightKg: number | null
   restSeconds: number | null
   notes: string | null
   sets: RoutineSet[]
}

export interface Routine {
   id: string
   name: string
   orderIndex: number
   unitSystem: UnitSystem
   exercises: RoutineExercise[]
   createdAt: string
   updatedAt: string
}

export interface RoutineSetInput {
   targetReps?: number
   targetDurationSeconds?: number
   targetDistanceMeters?: number
   targetWeight?: number
   rir?: number
   rpe?: number
   tempo?: string
}

export interface RoutineExerciseInput {
   exerciseId?: string
   exerciseName?: string
   tracking?: RoutineTracking
   usesWeight?: boolean
   targetSets?: number
   targetReps?: number
   targetDurationSeconds?: number
   targetDistanceMeters?: number
   targetWeight?: number
   restSeconds?: number
   notes?: string
   /** Explicit per-set plan. When provided it overrides the aggregate target* fields. */
   sets?: RoutineSetInput[]
}

export interface UpsertRoutinePayload {
   name: string
   unitSystem?: UnitSystem
   exercises: RoutineExerciseInput[]
}

export function apiListRoutines(): Promise<ApiResult<{ routines: Routine[] }>> {
   return apiFetch("/me/routines")
}

export function apiCreateRoutine(
   payload: UpsertRoutinePayload,
): Promise<ApiResult<{ routine: Routine }>> {
   return apiFetch("/me/routines", { method: "POST", body: payload })
}

export function apiGetRoutine(
   id: string,
): Promise<ApiResult<{ routine: Routine }>> {
   return apiFetch(`/me/routines/${id}`)
}

export function apiUpdateRoutine(
   id: string,
   payload: UpsertRoutinePayload,
): Promise<ApiResult<{ routine: Routine }>> {
   return apiFetch(`/me/routines/${id}`, { method: "PUT", body: payload })
}

export function apiDeleteRoutine(id: string): Promise<ApiResult<void>> {
   return apiFetch(`/me/routines/${id}`, { method: "DELETE" })
}
