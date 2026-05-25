const API_BASE_URL =
   (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
      ?.VITE_API_BASE_URL ?? "https://api.mov-eat.app"

const BASE_URL = `${API_BASE_URL}/v1/auth`
const BASE_ME_URL = `${API_BASE_URL}/v1/me`

// ─── Error parsing ────────────────────────────────────────────────────────────

function parseErrorMessage(res: Response, data: unknown): string {
   const d = data as Record<string, unknown>

   if (res.status === 409) return "Este email ya está registrado"
   if (res.status === 401) return "Email o contraseña incorrectos"
   if (res.status === 429) return "Demasiados intentos. Intentá más tarde"

   if (d?.message) {
      return Array.isArray(d.message) ? (d.message as string[]).join(" · ") : String(d.message)
   }
   if (d?.issues) {
      return (d.issues as { message: string }[]).map((i) => i.message).join(" · ")
   }

   return "Error desconocido"
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface AuthResult {
   ok: true
   data: unknown
}

export interface AuthError {
   ok: false
   message: string
}

// ─── POST /v1/auth/signup ─────────────────────────────────────────────────────

export interface SignupPayload {
   email: string
   password: string
   firstName: string
   lastName: string
}

export async function apiSignup(payload: SignupPayload): Promise<AuthResult | AuthError> {
   try {
      const res = await fetch(`${BASE_URL}/signup`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
         credentials: "include",
      })

      if (res.ok) return { ok: true, data: await res.json() }

      let data: unknown
      try { data = await res.json() } catch { data = {} }

      return { ok: false, message: parseErrorMessage(res, data) }
   } catch {
      return { ok: false, message: "Error de conexión" }
   }
}

// ─── POST /v1/auth/logout ─────────────────────────────────────────────────────

export async function apiLogout(): Promise<AuthResult | AuthError> {
   try {
      const res = await fetch(`${BASE_URL}/logout`, {
         method: "POST",
         credentials: "include",
      })

      if (res.ok) return { ok: true, data: await res.json() }

      let data: unknown
      try { data = await res.json() } catch { data = {} }

      return { ok: false, message: parseErrorMessage(res, data) }
   } catch {
      return { ok: false, message: "Error de conexión" }
   }
}

// ─── POST /v1/auth/login ──────────────────────────────────────────────────────

export interface LoginPayload {
   email: string
   password: string
}

export async function apiLogin(payload: LoginPayload): Promise<AuthResult | AuthError> {
   try {
      const res = await fetch(`${BASE_URL}/login`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
         credentials: "include",
      })

      if (res.ok) return { ok: true, data: await res.json() }

      let data: unknown
      try { data = await res.json() } catch { data = {} }

      return { ok: false, message: parseErrorMessage(res, data) }
   } catch {
      return { ok: false, message: "Error de conexión" }
   }
}

// ─── GET /v1/me ───────────────────────────────────────────────────────────────

export interface MeUser {
   id: string
   email: string
   firstName: string
   lastName: string
   displayName: string
   status: string
}

export interface MeSession {
   expiresAt: string
}

export interface MeResponse {
   user: MeUser
   session: MeSession
}

export async function apiGetMe(): Promise<{ ok: true; data: MeResponse } | AuthError> {
   try {
      const res = await fetch(BASE_ME_URL, { credentials: "include" })
      if (res.ok) return { ok: true, data: await res.json() }
      return { ok: false, message: "Sesión inválida o expirada" }
   } catch {
      return { ok: false, message: "Error de conexión" }
   }
}

// ─── GET /v1/me/channels ──────────────────────────────────────────────────────

export interface Channel {
   channel: string
   identifier: string
   verified: boolean
}

export interface ChannelsResponse {
   channels: Channel[]
}

export async function apiGetChannels(): Promise<{ ok: true; data: ChannelsResponse } | AuthError> {
   try {
      const res = await fetch(`${BASE_ME_URL}/channels`, { credentials: "include" })
      if (res.ok) return { ok: true, data: await res.json() }
      return { ok: false, message: "Sesión inválida o expirada" }
   } catch {
      return { ok: false, message: "Error de conexión" }
   }
}

// ─── PUT /v1/me/channels/{channel} ────────────────────────────────────────────

export interface PutChannelPayload {
   identifier: string
}

export async function apiPutChannel(channelType: string, payload: PutChannelPayload): Promise<{ ok: true; data: Channel } | AuthError> {
   try {
      const res = await fetch(`${BASE_ME_URL}/channels/${encodeURIComponent(channelType)}`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         credentials: "include",
         body: JSON.stringify(payload),
      })

      if (res.ok) return { ok: true, data: await res.json() }

      let data: unknown
      try { data = await res.json() } catch { data = {} }

      const d = data as Record<string, unknown>
      let msg = "Error desconocido"

      if (res.status === 401) {
         msg = "Sesión inválida o expirada"
      } else if (res.status === 409) {
         msg = "El identificador del canal ya está vinculado a otro usuario"
      } else if (d?.message) {
         msg = Array.isArray(d.message) ? (d.message as string[]).join(" · ") : String(d.message)
      } else if (d?.issues) {
         msg = (d.issues as { message: string }[]).map((i) => i.message).join(" · ")
      }

      return { ok: false, message: msg }
   } catch {
      return { ok: false, message: "Error de conexión" }
   }
}

// ─── PUT /v1/me/onboarding ────────────────────────────────────────────────────

export interface OnboardingProfile {
   birthDate: string
   sex: "MALE" | "FEMALE" | "OTHER" | string
   height: {
      cm?: number
      inches?: number
   }
   currentWeight: number
   timezone: string
   locale: string
}

export interface OnboardingGoals {
   primaryGoal: "FAT_LOSS" | "MUSCLE_GAIN" | "MAINTAIN" | string
   activityLevel: "SEDENTARY" | "LIGHT" | "MODERATE" | "HIGH" | "INTENSE" | string
   trainingDaysPerWeek: number
   targetWeight?: number
}

export interface OnboardingNutrition {
   targetMode: "CALCULATED" | "MANUAL" | string
   manualCalorieTarget?: number
   proteinTargetG?: number
   carbsTargetG?: number
   fatTargetG?: number
}

export interface PutOnboardingPayload {
   unitSystem: "METRIC" | "IMPERIAL" | string
   profile: OnboardingProfile
   goals: OnboardingGoals
   nutrition?: OnboardingNutrition
}

export async function apiPutOnboarding(payload: PutOnboardingPayload): Promise<{ ok: true; data: unknown } | AuthError> {
   try {
      const res = await fetch(`${BASE_ME_URL}/onboarding`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         credentials: "include",
         body: JSON.stringify(payload),
      })

      if (res.ok) return { ok: true, data: await res.json() }

      let data: unknown
      try { data = await res.json() } catch { data = {} }

      const d = data as Record<string, unknown>
      let msg = "Error desconocido"

      if (res.status === 401) {
         msg = "Sesión inválida o expirada"
      } else if (res.status === 400) {
         if (d?.message) {
            msg = Array.isArray(d.message) ? (d.message as string[]).join(" · ") : String(d.message)
         } else if (d?.issues) {
            msg = (d.issues as { message: string }[]).map((i) => i.message).join(" · ")
         } else {
            msg = "Datos de onboarding inválidos"
         }
      } else if (d?.message) {
         msg = Array.isArray(d.message) ? (d.message as string[]).join(" · ") : String(d.message)
      }

      return { ok: false, message: msg }
   } catch {
      return { ok: false, message: "Error de conexión" }
   }
}

// ─── Onboarding Mapping Helpers ───────────────────────────────────────────────

export interface OnboardingFormData {
   name: string
   lastName: string
   goal: string
   gender: string
   age: number
   weight: number
   height: number
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

export function birthDateFromAge(age: number): string {
   const today = new Date()
   const year = today.getFullYear() - age
   const month = String(today.getMonth() + 1).padStart(2, "0")
   const day = String(today.getDate()).padStart(2, "0")

   return `${year}-${month}-${day}`
}

export function mapSex(gender: string): "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED" {
   if (gender === "male") return "MALE"
   if (gender === "female") return "FEMALE"
   if (gender === "other") return "OTHER"

   return "UNSPECIFIED"
}

export function mapPrimaryGoal(goal: string): "FAT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE" {
   if (goal === "baja_peso") return "FAT_LOSS"
   if (goal === "gana_masa") return "MUSCLE_GAIN"

   return "MAINTENANCE"
}

export function mapActivityLevel(
   level: string,
): "LIGHT" | "MODERATE" | "ACTIVE" {
   if (level === "principiante") return "LIGHT"
   if (level === "avanzado") return "ACTIVE"

   return "MODERATE"
}

export function getManualCalorieTarget(goal: string): number {
   if (goal === "baja_peso") return 1800
   if (goal === "gana_masa") return 2500

   return 2000
}

export function buildOnboardingPayload(form: OnboardingFormData): PutOnboardingPayload {
   return {
      unitSystem: "METRIC",
      profile: {
         birthDate: birthDateFromAge(form.age),
         sex: mapSex(form.gender),
         height: { cm: form.height },
         currentWeight: form.weight,
         timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
         locale: navigator.language || "es-AR",
      },
      goals: {
         primaryGoal: mapPrimaryGoal(form.goal),
         activityLevel: mapActivityLevel(form.level),
         trainingDaysPerWeek:
            form.level === "principiante" ? 2 : form.level === "intermedio" ? 3 : 5,
      },
      nutrition: {
         targetMode: "MANUAL",
         manualCalorieTarget: getManualCalorieTarget(form.goal),
      },
   }
}

