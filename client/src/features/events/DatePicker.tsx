import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MONTHS, addDays, daysInMonth, firstOfMonth, sameDay, startOfDay } from '@/lib/datetime'

// A full month grid, Monday-first. Renders only the rows the month needs — five
// or six — rather than a padded six every time.
export function DatePicker({
  value,
  today,
  onChange,
}: {
  value: Date
  today: Date
  onChange: (day: Date) => void
}) {
  const [month, setMonth] = useState(() => firstOfMonth(value))

  const lead = (month.getDay() + 6) % 7
  const gridStart = addDays(month, -lead)
  const rows = Math.ceil((lead + daysInMonth(month.getFullYear(), month.getMonth())) / 7)

  return (
    <div className="pt-1.5 pb-4">
      <div className="flex items-center gap-1 pb-2">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="grid size-8 place-items-center rounded-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-[15px]" />
        </button>
        <span className="flex-1 text-center text-[14.5px] font-semibold tracking-tight">
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="grid size-8 place-items-center rounded-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="size-[15px]" />
        </button>
      </div>

      <div className="mb-0.5 grid grid-cols-7">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={`${d}${i}`} className="text-center text-[10.5px] font-semibold tracking-[0.085em] text-subtle">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: rows * 7 }, (_, i) => {
          const d = addDays(gridStart, i)
          const outside = d.getMonth() !== month.getMonth()
          const selected = sameDay(d, value)
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(startOfDay(d))}
              className={`tnum h-9 rounded-[10px] text-sm ${
                selected
                  ? 'bg-foreground font-semibold text-background'
                  : `hover:bg-muted ${outside ? 'text-subtle/50' : 'text-foreground'} ${sameDay(d, today) ? 'font-bold' : ''}`
              }`}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
