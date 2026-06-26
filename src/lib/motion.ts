// Shared motion language so everything feels like the same "spring".
import type { Transition, Variants } from "framer-motion"

export const spring: Transition = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 }

/** Card / tile entrance — use with `initial="hidden" animate="show"`. */
export const cardEnter: Variants = {
   hidden: { opacity: 0, y: 16, scale: 0.98 },
   show: { opacity: 1, y: 0, scale: 1, transition: spring },
}

/** Parent that staggers its children's entrance. */
export const stagger: Variants = {
   hidden: {},
   show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
}
