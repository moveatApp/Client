// ─── LanguageSelect ──────────────────────────────────────────────────────────
//
// Compact language switcher: a pill showing the active language code that opens
// a small popover with the supported languages. Reuses the shared i18next
// instance, so it works anywhere (pre-auth onboarding header, etc.) without
// extra wiring. Persists the choice via the language detector (localStorage).

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "framer-motion"
import { Languages, Check } from "lucide-react"
import { SUPPORTED_LANGUAGES } from "@/i18n"

export default function LanguageSelect({
   className = "",
}: {
   className?: string
}) {
   const { t, i18n } = useTranslation("common")
   const [open, setOpen] = useState(false)
   const ref = useRef<HTMLDivElement>(null)

   const current = (i18n.resolvedLanguage ?? i18n.language) as string

   // Close on outside click or Escape.
   useEffect(() => {
      if (!open) return
      const onPointer = (e: PointerEvent) => {
         if (!ref.current?.contains(e.target as Node)) setOpen(false)
      }
      const onKey = (e: KeyboardEvent) => {
         if (e.key === "Escape") setOpen(false)
      }
      window.addEventListener("pointerdown", onPointer)
      window.addEventListener("keydown", onKey)
      return () => {
         window.removeEventListener("pointerdown", onPointer)
         window.removeEventListener("keydown", onKey)
      }
   }, [open])

   const select = (lng: string) => {
      void i18n.changeLanguage(lng)
      setOpen(false)
   }

   return (
      <div ref={ref} className={`relative ${className}`}>
         <button
            type="button"
            aria-label={t("language.label")}
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 items-center gap-1.5 rounded-full border border-card-border bg-card-bg/40 px-3 text-foreground shadow-sm transition-colors hover:bg-muted dark:hover:bg-white/5">
            <Languages size={16} />
            <span className="text-sm font-bold uppercase">{current}</span>
         </button>

         <AnimatePresence>
            {open && (
               <motion.ul
                  role="listbox"
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-card-border bg-card-bg shadow-lg shadow-black/10">
                  {SUPPORTED_LANGUAGES.map((lng) => {
                     const active = current === lng
                     return (
                        <li key={lng}>
                           <button
                              type="button"
                              role="option"
                              aria-selected={active}
                              onClick={() => select(lng)}
                              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold transition-colors ${
                                 active
                                    ? "bg-primary/10 text-primary"
                                    : "text-foreground hover:bg-muted dark:hover:bg-white/5"
                              }`}>
                              <span>{t(`language.${lng}`)}</span>
                              <span className="flex items-center gap-2">
                                 <span className="text-xs font-bold uppercase text-subtle">
                                    {lng}
                                 </span>
                                 {active && <Check size={15} />}
                              </span>
                           </button>
                        </li>
                     )
                  })}
               </motion.ul>
            )}
         </AnimatePresence>
      </div>
   )
}
