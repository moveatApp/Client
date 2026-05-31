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
      <div className="bg-card-bg border border-card-border rounded-3xl p-6 shadow-sm">
         <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-sm text-gray-400 uppercase tracking-wider">
               {label}
            </span>
            <div className="flex items-baseline gap-1">
               <span className="text-4xl font-display font-extrabold text-primary tabular-nums">
                  {value}
               </span>
               <span className="text-gray-400 font-bold">{unit}</span>
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
         <div className="flex justify-between mt-1 text-xs text-gray-300 font-bold">
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
