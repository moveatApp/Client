import type { LucideIcon } from "lucide-react"

interface IconBadgeProps {
   icon: LucideIcon
   selected: boolean
   size?: number
}

export default function IconBadge({ icon: Icon, selected, size = 24 }: IconBadgeProps) {
   return (
      <div
         className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            selected
               ? "bg-primary text-white"
               : "bg-muted text-subtle"
         }`}>
         <Icon size={size} />
      </div>
   )
}
