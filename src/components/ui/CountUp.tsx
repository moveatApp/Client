// Animated number that ticks from its previous value to the new one.
import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"

interface CountUpProps {
   value: number
   duration?: number
   decimals?: number
   className?: string
}

export default function CountUp({ value, duration = 700, decimals = 0, className }: CountUpProps) {
   const reduce = useReducedMotion()
   const [display, setDisplay] = useState(value)
   const fromRef = useRef(value)
   const rafRef = useRef<number | null>(null)

   useEffect(() => {
      if (reduce) {
         setDisplay(value)
         fromRef.current = value
         return
      }
      const from = fromRef.current
      const to = value
      if (from === to) return
      const start = performance.now()
      const tick = (now: number) => {
         const p = Math.min(1, (now - start) / duration)
         const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
         setDisplay(from + (to - from) * eased)
         if (p < 1) rafRef.current = requestAnimationFrame(tick)
         else fromRef.current = to
      }
      rafRef.current = requestAnimationFrame(tick)
      return () => {
         if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
   }, [value, duration, reduce])

   const factor = Math.pow(10, decimals)
   const shown = Math.round(display * factor) / factor
   return (
      <span className={className}>
         {decimals > 0 ? shown.toFixed(decimals) : Math.round(shown).toLocaleString()}
      </span>
   )
}
