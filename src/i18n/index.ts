import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import enCommon from "./locales/en/common.json"
import enErrors from "./locales/en/errors.json"
import esCommon from "./locales/es/common.json"
import esErrors from "./locales/es/errors.json"
import ptCommon from "./locales/pt/common.json"
import ptErrors from "./locales/pt/errors.json"

export const SUPPORTED_LANGUAGES = ["en", "es", "pt"] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_STORAGE_KEY = "moveat-lang"

void i18n
   .use(LanguageDetector)
   .use(initReactI18next)
   .init({
      resources: {
         en: { common: enCommon, errors: enErrors },
         es: { common: esCommon, errors: esErrors },
         pt: { common: ptCommon, errors: ptErrors },
      },
      fallbackLng: "en",
      supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
      // Match by primary subtag, e.g. "es-AR" -> "es".
      load: "languageOnly",
      ns: ["common", "errors"],
      defaultNS: "common",
      interpolation: { escapeValue: false },
      detection: {
         order: ["localStorage", "navigator"],
         caches: ["localStorage"],
         lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      },
      react: { useSuspense: false },
   })

export default i18n

/**
 * Resolves a centralized error code (e.g. "birthdate.future") to a localized
 * message. Usable outside React components (validators, the API client) since
 * it reads the shared i18next instance.
 */
export function tError(code: string, params?: Record<string, unknown>): string {
   return i18n.t(code, { ns: "errors", ...params })
}
