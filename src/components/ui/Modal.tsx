import { motion, AnimatePresence } from "framer-motion"
import React from "react"

interface ModalProps {
   isOpen: boolean
   onClose: () => void
   title: string
   children: React.ReactNode
   footer?: React.ReactNode
}

export default function Modal({
   isOpen,
   onClose,
   title,
   children,
   footer,
}: ModalProps) {
   const titleId = React.useId()
   return (
      <AnimatePresence>
         {isOpen && (
            <motion.div
               role="dialog"
               aria-modal="true"
               aria-labelledby={titleId}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 overscroll-contain"
               onClick={onClose}
            >
               <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                   className="bg-card-bg/40 rounded-card-lg border border-card-border p-card w-full max-w-sm shadow-xl flex flex-col"
                  onClick={(e) => e.stopPropagation()}
               >
                   <h3 id={titleId} className="text-subheading text-foreground mb-2">{title}</h3>
                  <div className="flex-1">
                     {children}
                  </div>
                  {footer}
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   )
}
