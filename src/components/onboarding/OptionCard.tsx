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
   const base = `rounded-2xl border-2 transition-all ${
      selected
         ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
         : "border-card-border bg-card-bg hover:border-primary/30"
   }`

   if (layout === "col") {
      return (
         <button
            onClick={onClick}
            className={`${base} py-6 flex flex-col items-center gap-3`}>
            <IconBadge icon={icon} selected={selected} />
            <span className="font-bold text-sm text-foreground">{label}</span>
         </button>
      )
   }

   return (
      <button
         onClick={onClick}
         className={`${base} p-5 text-left flex items-center gap-4`}>
         <IconBadge icon={icon} selected={selected} />
         <div className="flex-1">
            <div className="font-bold text-base text-foreground">{label}</div>
            {sub && (
               <div className="text-xs text-gray-400 font-medium">{sub}</div>
            )}
         </div>
         {selected && (
            <CheckCircle2 size={20} className="text-primary shrink-0" />
         )}
      </button>
   )
}
