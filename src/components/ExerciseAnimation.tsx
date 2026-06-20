// ─── Crossfade loop of an exercise's keyframes (start ↔ end position) ─────────
//
// free-exercise-db ships exactly two images per exercise: the start and end of
// the movement. We keep the first frame fully opaque as a base and fade the
// second frame in/out on top of it. Because the base is always opaque, there is
// no transparent dip mid-transition (which previously let the dark background
// flash through). Zero extra assets; reads as a continuous rep.

import { useEffect, useState } from "react"
import { Dumbbell } from "lucide-react"

interface ExerciseAnimationProps {
   images: string[]
   alt: string
   className?: string
   /** Time each frame is held fully visible before crossfading to the next. */
   intervalMs?: number
   /** Crossfade duration. Kept well below intervalMs so each position rests crisp. */
   fadeMs?: number
   /** When false, shows only the first frame (e.g. for low-priority thumbnails). */
   animate?: boolean
}

export default function ExerciseAnimation({
   images,
   alt,
   className = "",
   intervalMs = 1100,
   fadeMs = 380,
   animate = true,
}: ExerciseAnimationProps) {
   const frames = images.filter(Boolean)
   // For the 2-frame loop: whether the top (end-position) frame is currently shown.
   const [showTop, setShowTop] = useState(false)

   const canAnimate = animate && frames.length >= 2

   useEffect(() => {
      if (!canAnimate) return
      const id = setInterval(() => setShowTop((s) => !s), intervalMs)
      return () => clearInterval(id)
   }, [canAnimate, intervalMs])

   if (frames.length === 0) {
      return (
         <div className={`flex items-center justify-center bg-muted dark:bg-white/5 ${className}`}>
            <Dumbbell size={28} className="text-muted-foreground dark:text-white/10" />
         </div>
      )
   }

   if (!canAnimate) {
      return <img src={frames[0]} alt={alt} loading="lazy" className={`object-cover ${className}`} />
   }

   return (
      <div className={`relative overflow-hidden ${className}`}>
         {/* Base frame: always fully opaque, also sizes the box at its natural aspect ratio. */}
         <img src={frames[0]} alt={alt} className="w-full block" />
         {/* Top frame fades in/out over the opaque base — no transparent gap, no black flash. */}
         <img
            src={frames[1]}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: showTop ? 1 : 0, transition: `opacity ${fadeMs}ms ease-in-out` }}
         />
      </div>
   )
}
