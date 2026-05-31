const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | null {
   if (!EMAIL_REGEX.test(email)) return "Ingresa un correo electrónico válido"
   return null
}

export function validateSignupPassword(password: string): string | null {
   if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[^a-zA-Z0-9]/.test(password)
   )
      return "La contraseña no cumple los requisitos"
   return null
}

export function validateLoginPassword(password: string): string | null {
   if (password.length < 6)
      return "La contraseña debe tener al menos 6 caracteres"
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
