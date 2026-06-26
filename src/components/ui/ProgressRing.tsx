// Unified progress ring used across the app (water, steps, calories, session).
import { useId, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

interface ProgressRingProps {
   value: number
   max: number
   size?: number
   stroke?: number
   /** Stroke color (CSS). When `gradientTo` is set, becomes the gradient start. */
   color?: string
   gradientTo?: string
   trackColor?: string
   children?: ReactNode
   className?: string
}

export default function ProgressRing({
   value,
   max,
   size = 64,
   stroke = 6,
   color = "var(--primary)",
   gradientTo,
   trackColor = "var(--muted)",
   children,
   className = "",
}: ProgressRingProps) {
   const reduce = useReducedMotion()
   const id = useId().replace(/:/g, "")
   const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
   const r = (size - stroke) / 2
   const c = 2 * Math.PI * r
   const strokeColor = gradientTo ? `url(#ring-${id})` : color

   return (
      <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
         <svg width={size} height={size} className="-rotate-90 block">
            {gradientTo && (
               <defs>
                  <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
                     <stop offset="0%" stopColor={color} />
                     <stop offset="100%" stopColor={gradientTo} />
                  </linearGradient>
               </defs>
            )}
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
            <motion.circle
               cx={size / 2}
               cy={size / 2}
               r={r}
               fill="none"
               stroke={strokeColor}
               strokeWidth={stroke}
               strokeLinecap="round"
               strokeDasharray={c}
               initial={{ strokeDashoffset: reduce ? c * (1 - pct) : c }}
               animate={{ strokeDashoffset: c * (1 - pct) }}
               transition={{ duration: reduce ? 0 : 0.9, ease: "easeOut" }}
            />
         </svg>
         {children != null && (
            <div className="absolute inset-0 flex items-center justify-center">{children}</div>
         )}
      </div>
   )
}
