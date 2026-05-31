interface StepHeaderProps {
   tag: string
   title: string
   subtitle?: string
}

export default function StepHeader({ tag, title, subtitle }: StepHeaderProps) {
   return (
      <div>
         <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">
            {tag}
         </p>
         <h2 className="text-4xl font-display font-extrabold text-foreground leading-tight">
            {title}
         </h2>
         {subtitle && (
            <p className="text-gray-400 text-sm font-medium mt-2">
               {subtitle}
            </p>
         )}
      </div>
   )
}
