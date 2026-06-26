// ─── /v1/me/habits — water / steps daily logs ──────────────────────────────

import { apiFetch, browserTimezone, type ApiResult } from "./client"

export type HabitType = "WATER" | "STEPS"

export interface HabitLog {
   type: HabitType
   localDate: string
   value: number
   target: number | null
   unit: string | null
}

export function apiListHabits(query?: {
   from?: string
   to?: string
}): Promise<ApiResult<{ habits: HabitLog[] }>> {
   return apiFetch("/me/habits", { query })
}

export interface UpsertHabitPayload {
   localDate: string
   value: number
   target?: number
   unit?: string
   timezone?: string
}

export function apiUpsertHabit(
   type: HabitType,
   payload: UpsertHabitPayload,
): Promise<ApiResult<{ habit: HabitLog }>> {
   return apiFetch(`/me/habits/${type}`, {
      method: "PUT",
      body: { timezone: browserTimezone(), ...payload },
   })
}
