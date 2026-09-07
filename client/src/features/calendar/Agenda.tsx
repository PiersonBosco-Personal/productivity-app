import { dayKey } from '@/lib/datetime'
import type { CalendarEvent } from '@/lib/types'
import type { DayBucket } from './expand'
import { DayGroup } from './DayGroup'

// Exactly the seven days of the selected week. Not a continuous scroll — the
// week strip is the navigation, and showing three months of days around the one
// you care about was the thing that made the old UI feel like a wall of text.
export function Agenda({
  buckets,
  today,
  colorOf,
  onOpen,
}: {
  buckets: DayBucket<CalendarEvent>[]
  today: Date
  colorOf: (calendarId: string) => string
  onOpen: (event: CalendarEvent) => void
}) {
  return (
    <div className="px-5 pb-6 md:mx-auto md:max-w-[680px] md:px-7">
      {buckets.map((bucket) => (
        <div key={dayKey(bucket.day)} id={`day-${dayKey(bucket.day)}`}>
          <DayGroup bucket={bucket} today={today} colorOf={colorOf} onOpen={onOpen} />
        </div>
      ))}
    </div>
  )
}
