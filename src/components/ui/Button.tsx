import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
   variant?: "primary" | "secondary" | "danger" | "outline" | "ghost" | "muted"
   size?: "sm" | "md" | "lg"
   children: React.ReactNode
}

export default function Button({
   variant = "primary",
   size = "md",
   children,
   className = "",
   ...props
}: ButtonProps) {
   const baseStyles =
      "font-bold rounded-2xl transition-colors duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"

   const variants = {
      primary:
         "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary",
      secondary: "bg-secondary text-white",
      danger: "bg-red-500 text-white hover:bg-red-600",
      outline:
         "border border-card-border bg-transparent text-foreground hover:bg-muted/100 dark:hover:bg-white-500/5",
      ghost: "bg-transparent text-foreground hover:bg-muted/100 dark:hover:bg-white-500/5",
      muted: "bg-muted/100 dark:bg-white-500/5 text-foreground hover:bg-muted/80 dark:hover:bg-white-500/10",
   }

   const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-5 py-3 text-sm",
      lg: "px-6 py-4 text-base",
   }

   return (
      <button
         className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
         {...props}>
         {children}
      </button>
   )
}
