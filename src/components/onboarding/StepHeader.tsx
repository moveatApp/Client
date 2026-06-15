interface StepHeaderProps {
   tag: string
   title: string
   subtitle?: string
}

export default function StepHeader({ tag, title, subtitle }: StepHeaderProps) {
   return (
      <div>
         <p className="text-primary text-label mb-2">
            {tag}
         </p>
         <h2 className="text-display text-foreground">
            {title}
         </h2>
         {subtitle && (
            <p className="text-secondary text-subtle mt-2">
               {subtitle}
            </p>
         )}
      </div>
   )
}
