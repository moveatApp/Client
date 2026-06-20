// ─── /v1/me/routines — editable workout routine templates ──────────────────

import { apiFetch, type ApiResult, type UnitSystem } from "./client"

// Mirrors prisma RoutineExerciseTracking. NOTE: the platform enum is DURATION (not "TIME").
export type RoutineTracking = "REPS" | "DURATION" | "DISTANCE"

export interface RoutineExercise {
   id: string
   orderIndex: number
   exerciseId: string | null
   exerciseName: string
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
