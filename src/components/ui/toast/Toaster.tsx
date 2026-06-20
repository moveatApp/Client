// ─── Toaster ────────────────────────────────────────────────────────────────
//
// Sileo-inspired gooey toasts. Each notification renders as a dark blob where a
// header pill (icon + colored title) connects to the description body through a
// liquid "neck", produced by an SVG goo filter (feGaussianBlur + feColorMatrix
// metaball trick). The dark surface is fixed (reads as system chrome over any
// theme); the accent — icon, title, glow — derives from the variant, and `info`
// picks up the active theme `primary`, so color still follows the app theme.
//
// The blob shapes are positioned by measuring the (crisp, un-filtered) text in
// a useLayoutEffect, so the goo layer always aligns with the content.

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
   CheckCircle2,
   AlertTriangle,
   XCircle,
   Info,
   X,
   type LucideIcon,
} from "lucide-react"
import { useToastStore, type ToastItem, type ToastVariant } from "./toastStore"

export type ToasterPosition =
   | "top-left"
   | "top-center"
   | "top-right"
   | "bottom-left"
   | "bottom-center"
   | "bottom-right"

/** Accent color per variant. `info` uses the theme primary so it follows the
 *  active color theme; `error` uses our danger token (also theme/dark aware). */
const ACCENT: Record<ToastVariant, string> = {
   success: "#10b981",
   error: "var(--danger)",
   warning: "#f59e0b",
   info: "var(--primary)",
}

const ICONS: Record<ToastVariant, LucideIcon> = {
   success: CheckCircle2,
   error: XCircle,
   warning: AlertTriangle,
   info: Info,
}

/** Dark blob surface, fixed across light/dark themes. */
const SURFACE = "#1c1c1f"
/** How far each blob extends past its text, and the corner radius. */
const PAD_X = 18
const PAD_Y = 12
const RADIUS = 20

interface Rect {
   left: number
   top: number
   width: number
   height: number
}

function blobStyle(r: Rect): React.CSSProperties {
   return {
      position: "absolute",
      left: r.left - PAD_X,
      top: r.top - PAD_Y,
      width: r.width + PAD_X * 2,
      height: r.height + PAD_Y * 2,
      borderRadius: RADIUS,
      background: SURFACE,
   }
}

function positionClasses(position: ToasterPosition): string {
   const vertical = position.startsWith("top")
      ? "top-0 flex-col"
      : "bottom-0 flex-col-reverse"
   const horizontal = position.endsWith("left")
      ? "items-start"
      : position.endsWith("right")
        ? "items-end"
        : "items-center"
   return `${vertical} ${horizontal}`
}

function ToastCard({
   toast,
   fromTop,
   reduceMotion,
}: {
   toast: ToastItem
   fromTop: boolean
   reduceMotion: boolean
}) {
   const dismiss = useToastStore((s) => s.dismiss)
   const Icon = ICONS[toast.variant]
   const accent = ACCENT[toast.variant]
   const [paused, setPaused] = useState(false)

   const headerRef = useRef<HTMLDivElement>(null)
   const bodyRef = useRef<HTMLDivElement>(null)
   const [geo, setGeo] = useState<{ header: Rect; body: Rect | null } | null>(null)

   // Measure the crisp text so the goo blobs underneath line up exactly.
   useLayoutEffect(() => {
      const h = headerRef.current
      if (!h) return
      const rect = (el: HTMLElement): Rect => ({
         left: el.offsetLeft,
         top: el.offsetTop,
         width: el.offsetWidth,
         height: el.offsetHeight,
      })
      setGeo({
         header: rect(h),
         body: bodyRef.current ? rect(bodyRef.current) : null,
      })
   }, [toast.title, toast.description])

   // Auto-dismiss with hover pause. `duration === 0` keeps it sticky.
   const remaining = useRef(toast.duration)
   const startedAt = useRef(Date.now())
   useEffect(() => {
      if (toast.duration === 0 || paused) return
      startedAt.current = Date.now()
      const timer = setTimeout(() => dismiss(toast.id), remaining.current)
      return () => {
         remaining.current -= Date.now() - startedAt.current
         clearTimeout(timer)
      }
   }, [toast.id, toast.duration, paused, dismiss])

   const enterY = reduceMotion ? 0 : fromTop ? -28 : 28

   return (
      <motion.div
         layout
         initial={{ opacity: 0, y: enterY, scale: 0.85 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
         transition={{ type: "spring", stiffness: 380, damping: 26 }}
         onHoverStart={() => setPaused(true)}
         onHoverEnd={() => setPaused(false)}
         className="pointer-events-auto relative w-[min(92vw,400px)] drop-shadow-2xl"
         role={toast.variant === "error" ? "alert" : "status"}>
         {/* Goo layer — soft, merged blobs that form the liquid neck. */}
         <div
            aria-hidden
            className="absolute inset-0"
            style={{ filter: "url(#sileo-goo)" }}>
            {geo && <div style={blobStyle(geo.header)} />}
            {geo?.body && <div style={blobStyle(geo.body)} />}
         </div>

         {/* Crisp layer — same blobs, unfiltered, for sharp edges on top of the
             goo bridge. */}
         <div aria-hidden className="absolute inset-0">
            {geo && <div style={blobStyle(geo.header)} />}
            {geo?.body && <div style={blobStyle(geo.body)} />}
         </div>

         {/* Content, overlaid on the blobs (never filtered → stays sharp). */}
         <div className="relative flex flex-col items-center gap-1.5 px-7 py-4 text-center antialiased">
            <div ref={headerRef} className="flex items-center gap-2">
               <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{
                     backgroundColor: `color-mix(in srgb, ${accent} 24%, transparent)`,
                  }}>
                  <Icon
                     className="h-[18px] w-[18px]"
                     style={{ color: accent }}
                     strokeWidth={2.6}
                  />
               </span>
               <span
                  className="text-[15px] font-bold tracking-tight"
                  style={{ color: accent }}>
                  {toast.title}
               </span>
            </div>

            {toast.description && (
               <div
                  ref={bodyRef}
                  className="max-w-[300px] text-[13.5px] font-medium leading-snug text-zinc-100/90">
                  {toast.description}
               </div>
            )}
         </div>

         {/* Dismiss — sits over the top-right of the blob. */}
         <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismiss(toast.id)}
            className="absolute right-1.5 top-1.5 z-10 rounded-full p-1 text-zinc-500 transition-colors hover:text-zinc-200">
            <X className="h-4 w-4" />
         </button>
      </motion.div>
   )
}

/** The SVG goo filter, mounted once. */
function GooDefs() {
   return (
      <svg aria-hidden width="0" height="0" className="absolute">
         <defs>
            <filter id="sileo-goo">
               <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
               <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
                  result="goo"
               />
               <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
         </defs>
      </svg>
   )
}

export function Toaster({
   position = "top-center",
}: {
   position?: ToasterPosition
}) {
   const toasts = useToastStore((s) => s.toasts)
   const reduceMotion = useReducedMotion() ?? false
   const fromTop = position.startsWith("top")

   return (
      <>
         <GooDefs />
         <div
            className={`pointer-events-none fixed inset-x-0 z-[100] flex gap-3 p-4 ${positionClasses(position)}`}
            style={{
               paddingTop: fromTop
                  ? "calc(env(safe-area-inset-top) + 1rem)"
                  : undefined,
               paddingBottom: fromTop
                  ? undefined
                  : "calc(env(safe-area-inset-bottom) + 1rem)",
            }}>
            <AnimatePresence mode="popLayout">
               {toasts.map((toast) => (
                  <ToastCard
                     key={toast.id}
                     toast={toast}
                     fromTop={fromTop}
                     reduceMotion={reduceMotion}
                  />
               ))}
            </AnimatePresence>
         </div>
      </>
   )
}
