interface PrimaryButtonProps {
   onClick: () => void
   disabled?: boolean
   children: React.ReactNode
   className?: string
}

export default function PrimaryButton({
   onClick,
   disabled = false,
   children,
   className = "",
}: PrimaryButtonProps) {
   return (
      <button
         onClick={onClick}
         disabled={disabled}
         className={`w-full bg-primary text-white font-bold py-4 rounded-button flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}>
         {children}
      </button>
   )
}
