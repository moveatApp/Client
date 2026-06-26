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
       "font-bold rounded-button transition-colors duration-200 flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"

   const variants = {
      primary:
         "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary",
      secondary: "bg-secondary text-white",
       danger: "bg-danger text-white hover:brightness-90",
      outline:
         "border border-card-border bg-transparent text-foreground hover:bg-muted",
      ghost: "bg-transparent text-foreground hover:bg-muted",
      muted: "bg-muted text-foreground hover:bg-on-subtle",
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
