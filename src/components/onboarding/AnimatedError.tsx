import { motion, AnimatePresence } from "framer-motion"

interface AnimatedErrorProps {
   message: string
   className?: string
}

export default function AnimatedError({
   message,
   className = "text-center text-xs font-bold text-red-500 px-4",
}: AnimatedErrorProps) {
   return (
      <AnimatePresence>
         {message && (
            <motion.p
               initial={{ opacity: 0, y: -4 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0 }}
               className={className}>
               {message}
            </motion.p>
         )}
      </AnimatePresence>
   )
}
