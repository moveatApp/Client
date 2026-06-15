interface SliderCardProps {
   label: string
   value: number
   unit: string
   min: number
   max: number
   onChange: (v: number) => void
}

export default function SliderCard({
   label,
   value,
   unit,
   min,
   max,
   onChange,
}: SliderCardProps) {
   return (
      <div className="bg-card-bg/40 border border-card-border rounded-card p-card shadow-sm">
          <div className="flex justify-between items-center mb-4">
             <span className="text-label text-subtle">
                {label}
             </span>
             <div className="flex items-baseline gap-1">
                <span className="text-display text-primary tabular-nums">
                   {value}
                </span>
                <span className="text-secondary text-subtle font-bold">{unit}</span>
             </div>
          </div>
           <input
              type="range"
              aria-label={`${label}: ${value} ${unit}`}
              min={min}
              max={max}
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value))}
              className="w-full accent-primary h-2"
           />
          <div className="flex justify-between mt-1 text-caption text-muted-foreground">
             <span>
                {min} {unit}
             </span>
             <span>
                {max} {unit}
             </span>
          </div>
      </div>
   )
}
