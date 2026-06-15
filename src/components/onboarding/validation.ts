import { tError } from "@/i18n"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validators resolve their message from the centralized error catalog by code
// (see the errors.json catalogs under src/i18n), staying localized automatically.

export function validateEmail(email: string): string | null {
   if (!EMAIL_REGEX.test(email)) return tError("email.invalid")
   return null
}

export function validateSignupPassword(password: string): string | null {
   if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[^a-zA-Z0-9]/.test(password)
   )
      return tError("password.signup_requirements")
   return null
}

export function validateLoginPassword(password: string): string | null {
   if (password.length < 6) return tError("password.login_min")
   return null
}

export const PASSWORD_RULES = [
   { test: (p: string) => p.length >= 8, label: "Mínimo 8 caracteres" },
   { test: (p: string) => /[A-Z]/.test(p), label: "Al menos una mayúscula" },
   {
      test: (p: string) => /[^a-zA-Z0-9]/.test(p),
      label: "Al menos un símbolo",
   },
] as const
