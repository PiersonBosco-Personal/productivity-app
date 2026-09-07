import { ChevronLeft, ChevronRight } from 'lucide-react'
import { dayKey, sameDay } from '@/lib/datetime'
import type { CalendarEvent } from '@/lib/types'
import type { DayBucket } from './expand'

// The primary time navigation: arrows page a week, a cell selects a day.
export function WeekStrip({
  buckets,
  today,
  selected,
  onSelect,
  onPage,
}: {
  buckets: DayBucket<CalendarEvent>[]
  today: Date
  selected: Date
  onSelect: (day: Date) => void
  onPage: (delta: number) => void
}) {
  return (
    <div className="border-b border-border bg-background px-2 pt-0.5 pb-3">
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Previous week"
          onClick={() => onPage(-1)}
          className="grid h-[50px] w-[26px] shrink-0 place-items-center rounded-[9px] text-subtle hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-7">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              // Two Tuesdays and two Saturdays share a letter, so the index
              // has to be part of the key.
              <span key={`${d}${i}`} className="text-center text-[10.5px] font-semibold tracking-[0.09em] text-subtle">
                {d}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7">
            {buckets.map((b) => {
              const isToday = sameDay(b.day, today)
              const isSel = !isToday && sameDay(b.day, selected)
              const busy = b.timed.length + b.allDay.length > 0
              return (
                <button
                  key={dayKey(b.day)}
                  type="button"
                  onClick={() => onSelect(b.day)}
                  className={`tnum relative grid h-[34px] place-items-center rounded-[10px] text-[14.5px] ${
                    isToday
                      ? 'bg-foreground font-semibold text-background'
                      : isSel
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-foreground'
                  }`}
                >
                  {b.day.getDate()}
                  {busy && !isToday && (
                    <span className="absolute bottom-[3px] size-[3px] rounded-full bg-subtle" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          aria-label="Next week"
          onClick={() => onPage(1)}
          className="grid h-[50px] w-[26px] shrink-0 place-items-center rounded-[9px] text-subtle hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
