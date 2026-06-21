// ─── /v1/foods — OpenFoodFacts-backed food lookup (per-100g nutrition) ─────────

import { apiFetch, type ApiResult } from "./client"

export interface FoodMacros {
   calories: number
   proteinG: number | null
   carbsG: number | null
   fatG: number | null
}

export interface NormalizedFood {
   sourceId: string
   source: string
   name: string
   brand: string | null
   /** Nutrition normalized to 100 g/ml. */
   per100g: FoodMacros
   servingSizeG: number | null
}

export function apiSearchFoods(
   q: string,
   locale?: string,
   limit = 20,
): Promise<ApiResult<{ foods: NormalizedFood[] }>> {
   return apiFetch("/foods/search", { query: { q, locale, limit } })
}

export function apiGetFoodByBarcode(
   code: string,
   locale?: string,
): Promise<ApiResult<{ food: NormalizedFood | null }>> {
   return apiFetch(`/foods/barcode/${encodeURIComponent(code)}`, { query: { locale } })
}
