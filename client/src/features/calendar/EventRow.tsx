import { Repeat } from 'lucide-react'
import { fmtTime, minutesOf } from '@/lib/datetime'
import type { CalendarEvent } from '@/lib/types'

// A 3px colour bar, the start time, the title, and the location when there is
// one. No card, no border — the whole design rests on space doing that work.
export function EventRow({
  event,
  color,
  first,
  last,
  onOpen,
}: {
  event: CalendarEvent
  color: string
  first: boolean
  last: boolean
  onOpen: (event: CalendarEvent) => void
}) {
  // A run crossing midnight shows where it is heading: the start time on its
  // first day, the end time on its last, arrows for the days between. Same
  // arrow language as the all-day band.
  const time =
    first && last
      ? fmtTime(minutesOf(new Date(event.startsAtUtc)))
      : first
        ? `${fmtTime(minutesOf(new Date(event.startsAtUtc)))} →`
        : last
          ? `← ${fmtTime(minutesOf(new Date(event.endsAtUtc)))}`
          : '← all day →'

  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      className="flex w-full items-stretch gap-3 py-2 text-left active:opacity-55"
    >
      <span className="w-[3px] shrink-0 rounded-sm" style={{ background: color }} />
      <span className="min-w-0 flex-1 py-px">
        <span className="tnum block text-[12.5px] text-muted-foreground">
          {time}
          {/* One glyph is enough: the detail sheet spells the rule out. */}
          {event.recurrenceFreq && (
            <Repeat className="ml-1 inline size-[11px] align-[-1px] text-subtle" strokeWidth={2.4} />
          )}
        </span>
        <span className="block truncate text-base leading-[1.32] tracking-[-0.011em]">
          {event.title}
        </span>
        {event.location && (
          <span className="mt-0.5 block truncate text-[12.5px] text-subtle">{event.location}</span>
        )}
      </span>
    </button>
  )
}
