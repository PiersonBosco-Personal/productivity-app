import { DOW_SHORT, sameDay } from '@/lib/datetime'
import type { CalendarEvent } from '@/lib/types'
import type { DayBucket } from './expand'
import { AllDayBand } from './AllDayBand'
import { EventRow } from './EventRow'

export function DayGroup({
  bucket,
  today,
  colorOf,
  onOpen,
}: {
  bucket: DayBucket<CalendarEvent>
  today: Date
  colorOf: (calendarId: string) => string
  onOpen: (event: CalendarEvent) => void
}) {
  const { day, allDay, timed } = bucket
  const isToday = sameDay(day, today)
  // An empty day collapses to one dim line rather than vanishing: a free day is
  // information, and skipping days makes the week lie about the time it covers.
  const bare = allDay.length === 0 && timed.length === 0

  return (
    <section data-day-cell className={bare ? 'py-2.5' : 'pt-3.5 pb-1'}>
      <div
        className={`flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-[0.085em] ${bare ? '' : 'mb-2'} ${isToday ? 'text-foreground' : 'text-subtle'}`}
      >
        <span>
          {isToday && 'Today · '}
          {DOW_SHORT[day.getDay()]} {day.getDate()}
        </span>
        {bare && <span className="font-normal normal-case tracking-normal text-subtle/55">—</span>}
      </div>

      {/* Every occurrence of a series carries the same id, so the id alone is
          not unique within a day: an event that crosses midnight and repeats
          daily puts two of them here. The start is what separates them. */}
      {allDay.map(({ event, first, last }) => (
        <AllDayBand
          key={`${event.id}-${event.startsAtUtc}`}
          event={event}
          color={colorOf(event.calendarId)}
          first={first}
          last={last}
          onOpen={onOpen}
        />
      ))}

      {timed.map(({ event, first, last }) => (
        <EventRow
          key={`${event.id}-${event.startsAtUtc}`}
          event={event}
          color={colorOf(event.calendarId)}
          first={first}
          last={last}
          onOpen={onOpen}
        />
      ))}
    </section>
  )
}
