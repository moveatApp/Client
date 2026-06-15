// ─── Shared API client ─────────────────────────────────────────────────────
//
// Single fetch helper for every platform call. The platform uses an HttpOnly
// session cookie, so every request must send `credentials: "include"`.
// Public endpoints live under `/v1/...` (never hardcode `/api`).

import { tError } from "@/i18n"

export const API_BASE_URL =
   (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
      ?.VITE_API_BASE_URL ?? "https://api.mov-eat.app"

export const API_V1 = `${API_BASE_URL}/v1`

// ─── Platform enums (mirror prisma/schema.prisma) ──────────────────────────

export type UnitSystem = "METRIC" | "IMPERIAL"
export type Sex = "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED"
export type PrimaryGoal = "FAT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE"
export type ActivityLevel =
   | "SEDENTARY"
   | "LIGHT"
   | "MODERATE"
   | "ACTIVE"
   | "VERY_ACTIVE"
export type TargetMode = "CALCULATED" | "MANUAL"
export type ChannelType = "WHATSAPP" | "TELEGRAM" | "SIGNAL"
export type MealType = "BREAKFAST" | "LUNCH" | "SNACK" | "DINNER" | "UNKNOWN"
export type EntrySource = "WEB" | "AGENT_WHATSAPP" | "MANUAL" | "SYSTEM"
export type UserStatus = "PENDING" | "ACTIVE" | "DISABLED"

export type MetricHeight = { cm: number }
export type ImperialHeight = { feet: number; inches: number }
export type Height = MetricHeight | ImperialHeight

// ─── Result type ───────────────────────────────────────────────────────────

export interface ApiOk<T> {
   ok: true
   data: T
}

export interface ApiErr {
   ok: false
   status: number
   /** Centralized error code (see the errors.json catalogs under src/i18n). */
   code: string
   /** Localized, ready-to-show message resolved from `code` or the backend. */
   message: string
}

export type ApiResult<T> = ApiOk<T> | ApiErr

// ─── Error handling (code-based) ────────────────────────────────────────────

/** Maps an HTTP status to a centralized error code. */
function statusToCode(status: number): string {
   if (status === 0) return "network.error"
   if (status === 401) return "http.unauthorized"
   if (status === 403) return "http.forbidden"
   if (status === 404) return "http.not_found"
   if (status === 409) return "http.conflict"
   if (status === 429) return "http.rate_limited"
   if (status >= 500) return "http.server"
   return "http.unknown"
}

/** Extracts a human message the backend may have sent (zod issues, etc.). */
function backendMessage(data: unknown): string | null {
   const d = (data ?? {}) as Record<string, unknown>
   if (d.message) {
      return Array.isArray(d.message)
         ? (d.message as string[]).join(" · ")
         : String(d.message)
   }
   if (d.issues) {
      return (d.issues as { message: string }[]).map((i) => i.message).join(" · ")
   }
   return null
}

/**
 * Builds a localized {@link ApiErr}. `overrides` maps a status to a known error
 * code; otherwise we prefer a backend-provided message and fall back to the
 * generic code for the status.
 */
function buildApiError(
   status: number,
   data: unknown,
   overrides?: Record<number, string>,
): ApiErr {
   const overrideCode = overrides?.[status]
   if (overrideCode) {
      return { ok: false, status, code: overrideCode, message: tError(overrideCode) }
   }

   const fromBackend = status > 0 ? backendMessage(data) : null
   if (fromBackend) {
      return { ok: false, status, code: `http.${status}`, message: fromBackend }
   }

   const code = statusToCode(status)
   return { ok: false, status, code, message: tError(code) }
}

// ─── Core fetch helper ─────────────────────────────────────────────────────

interface ApiFetchOptions {
   method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
   body?: unknown
   /** Optional query params. Undefined/null values are skipped. */
   query?: Record<string, string | number | undefined | null>
   /** Map specific status codes to a centralized error code. */
   messages?: Record<number, string>
}

/**
 * Performs an authenticated request against the platform.
 * `path` is relative to `/v1` (e.g. "/me/context") or absolute when it starts
 * with "http".
 */
export async function apiFetch<T>(
   path: string,
   options: ApiFetchOptions = {},
): Promise<ApiResult<T>> {
   const { method = "GET", body, query, messages } = options

   let url = path.startsWith("http") ? path : `${API_V1}${path}`

   if (query) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) {
         if (value !== undefined && value !== null) params.set(key, String(value))
      }
      const qs = params.toString()
      if (qs) url += `?${qs}`
   }

   try {
      const res = await fetch(url, {
         method,
         credentials: "include",
         headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
         body: body !== undefined ? JSON.stringify(body) : undefined,
      })

      // 204 No Content (e.g. logout).
      if (res.status === 204) return { ok: true, data: undefined as T }

      let data: unknown = undefined
      try {
         data = await res.json()
      } catch {
         data = undefined
      }

      if (res.ok) return { ok: true, data: data as T }

      return buildApiError(res.status, data, messages)
   } catch {
      return buildApiError(0, undefined, messages)
   }
}

/** Helper to build today's local date in YYYY-MM-DD. */
export function todayLocalISO(): string {
   const now = new Date()
   const y = now.getFullYear()
   const m = String(now.getMonth() + 1).padStart(2, "0")
   const d = String(now.getDate()).padStart(2, "0")
   return `${y}-${m}-${d}`
}

/** The browser's IANA timezone, with a safe fallback. */
export function browserTimezone(): string {
   return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
}
