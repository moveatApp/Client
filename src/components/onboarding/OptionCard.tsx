import type { LucideIcon } from "lucide-react"
import { CheckCircle2 } from "lucide-react"
import IconBadge from "./IconBadge"

interface OptionCardProps {
   icon: LucideIcon
   label: string
   sub?: string
   selected: boolean
   onClick: () => void
   /** "row" for full-width list items, "col" for compact grid cells */
   layout?: "row" | "col"
}

export default function OptionCard({
   icon,
   label,
   sub,
   selected,
   onClick,
   layout = "row",
}: OptionCardProps) {
   const base = `rounded-button border-2 transition-all ${
      selected
         ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
         : "border-card-border bg-card-bg/40 hover:border-primary/30"
   }`

   if (layout === "col") {
      return (
         <button
            onClick={onClick}
            className={`${base} py-card flex flex-col items-center gap-3`}>
            <IconBadge icon={icon} selected={selected} />
            <span className="text-secondary text-foreground font-bold">{label}</span>
         </button>
      )
   }

   return (
      <button
         onClick={onClick}
         className={`${base} p-card-sm text-left flex items-center gap-4`}>
             <IconBadge icon={icon} selected={selected} />
             <div className="flex-1">
                <div className="text-body text-foreground font-bold">{label}</div>
                {sub && (
                   <div className="text-caption text-subtle">{sub}</div>
                )}
             </div>
         {selected && (
            <CheckCircle2 size={20} className="text-primary shrink-0" />
         )}
      </button>
   )
}
