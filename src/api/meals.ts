// ─── /v1/me/meal-entries + nutrition daily summary ─────────────────────────

import {
   apiFetch,
   browserTimezone,
   type ApiResult,
   type EntrySource,
   type MealType,
} from "./client"

export interface MealEntryItem {
   id: string
   name: string
   estimatedQuantity: number | null
   estimatedUnit: string | null
   estimatedCalories: number
   proteinG: number | null
   carbsG: number | null
   fatG: number | null
}

export interface MealEntry {
   id: string
   source: EntrySource
   mealType: MealType
   originalInput: string | null
   imageUrl: string | null
   occurredAt: string
   localDate: string
   timezone: string
   idempotencyKey: string | null
   items: MealEntryItem[]
   createdAt: string
   updatedAt: string
}

export interface NutritionDailySummary {
   date: string
   timezone: string
   calorieTarget: number
   caloriesConsumed: number
   caloriesRemaining: number
   proteinG: number
   carbsG: number
   fatG: number
   mealCount: number
}

export interface MealEntryItemInput {
   name: string
   estimatedQuantity?: number
   estimatedUnit?: string
   estimatedCalories: number
   proteinG?: number
   carbsG?: number
   fatG?: number
}

export interface CreateMealEntryPayload {
   mealType?: MealType
   originalInput?: string
   imageUrl?: string
   occurredAt?: string
   timezone?: string
   idempotencyKey?: string
   items: MealEntryItemInput[]
}

export interface MealEntryCreateResponse {
   mealEntry: MealEntry
   dailySummary: NutritionDailySummary
}

export function apiCreateMealEntry(
   payload: CreateMealEntryPayload,
): Promise<ApiResult<MealEntryCreateResponse>> {
   return apiFetch("/me/meal-entries", {
      method: "POST",
      body: { timezone: browserTimezone(), ...payload },
   })
}

export function apiListMealEntries(query?: {
   from?: string
   to?: string
   limit?: number
}): Promise<ApiResult<{ mealEntries: MealEntry[] }>> {
   return apiFetch("/me/meal-entries", { query: query })
}

export function apiGetDailySummary(
   date?: string,
): Promise<ApiResult<{ dailySummary: NutritionDailySummary }>> {
   return apiFetch("/me/nutrition/daily-summary", { query: { date } })
}
