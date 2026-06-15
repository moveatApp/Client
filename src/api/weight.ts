// ─── /v1/me/weight-logs ────────────────────────────────────────────────────

import {
   apiFetch,
   browserTimezone,
   type ApiResult,
   type EntrySource,
   type TargetMode,
   type UnitSystem,
} from "./client"

export interface WeightLog {
   id: string
   source: EntrySource
   weight: number
   loggedAt: string
   localDate: string
   timezone: string
   notes: string | null
   idempotencyKey: string | null
   createdAt: string
   updatedAt: string
}

export interface CreateWeightLogPayload {
   weight: number
   unitSystem?: UnitSystem
   /** ISO datetime. Defaults to request time when omitted. */
   loggedAt?: string
   timezone?: string
   notes?: string
   idempotencyKey?: string
}

export interface WeightLogCreateResponse {
   unitSystem: UnitSystem
   weightLog: WeightLog
   profileUpdated: boolean
   nutrition: {
      targetMode: TargetMode
      dailyCalorieTarget: number
      calculatedCalorieTarget: number | null
      calculationVersion: string | null
   } | null
}

export function apiCreateWeightLog(
   payload: CreateWeightLogPayload,
): Promise<ApiResult<WeightLogCreateResponse>> {
   return apiFetch("/me/weight-logs", {
      method: "POST",
      body: { timezone: browserTimezone(), ...payload },
   })
}

export interface WeightLogListResponse {
   unitSystem: UnitSystem
   weightLogs: WeightLog[]
}

export function apiListWeightLogs(query?: {
   from?: string
   to?: string
   limit?: number
}): Promise<ApiResult<WeightLogListResponse>> {
   return apiFetch("/me/weight-logs", { query: query })
}

export function apiGetLatestWeightLog(): Promise<
   ApiResult<{ unitSystem: UnitSystem; weightLog: WeightLog | null }>
> {
   return apiFetch("/me/weight-logs/latest")
}
