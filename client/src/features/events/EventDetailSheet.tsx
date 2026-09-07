import { Calendar as CalendarIcon, MapPin, Repeat } from 'lucide-react'
import { Sheet, SheetBody } from '@/components/Sheet'
import { useDeleteEvent } from './queries'
import { fmtDuration, fmtTime, longDate, minutesOf, shortDate, startOfDay } from '@/lib/datetime'
import { repeatLabel } from '@/lib/recurrence'
import type { Calendar, CalendarEvent } from '@/lib/types'

// Read-only by design. Reading an event is the common case, and this keeps an
// accidental tap one deliberate step away from changing data.
export function EventDetailSheet({
  event,
  calendar,
  onClose,
  onEdit,
}: {
  event: CalendarEvent
  calendar: Calendar | undefined
  onClose: () => void
  onEdit: () => void
}) {
  const remove = useDeleteEvent()
  const starts = new Date(event.startsAtUtc)
  const ends = new Date(event.endsAtUtc)
  const color = calendar?.color ?? '#7C8296'

  // The end is exclusive, so the last covered day is a millisecond back.
  const lastDay = startOfDay(new Date(ends.getTime() - 1))
  const crossesDays = +lastDay > +startOfDay(starts)
  const duration = fmtDuration(Math.round((+ends - +starts) / 6e4))

  // Also exclusive, so the last day the series can reach is a millisecond back.
  const repeatsUntil = event.recurrenceUntilUtc
    ? startOfDay(new Date(new Date(event.recurrenceUntilUtc).getTime() - 1))
    : null

  const when =
    event.isAllDay && crossesDays ? `${longDate(starts)} – ${longDate(lastDay)}` : longDate(starts)

  const time = event.isAllDay
    ? 'All day'
    : crossesDays
      // Spell the end date out. Without it, "2:15 PM – 3:15 PM · 25h" reads as a
      // one-hour event and the reader has to reconcile it against the duration.
      ? `${fmtTime(minutesOf(starts))} → ${shortDate(ends)}, ${fmtTime(minutesOf(ends))}  ·  ${duration}`
      : `${fmtTime(minutesOf(starts))} – ${fmtTime(minutesOf(ends))}  ·  ${duration}`

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetBody className="pt-2">
        <div className="flex items-stretch gap-3 pt-1.5 pb-4">
          <span className="w-[3px] shrink-0 rounded-sm" style={{ background: color }} />
          <h2 className="text-[23px] font-semibold leading-[1.24] tracking-[-0.024em]">{event.title}</h2>
        </div>

        <p className="pb-4 text-[15px] leading-[1.5]">
          {when}
          <br />
          <span className="tnum text-muted-foreground">{time}</span>
        </p>

        <div className="flex items-center gap-2.5 border-t border-border py-2.5 text-[14.5px]">
          <CalendarIcon className="size-4 shrink-0 text-subtle" />
          <span className="size-[9px] rounded-full" style={{ background: color }} />
          {calendar?.name ?? 'Unknown calendar'}
        </div>

        {event.recurrenceFreq && (
          <div className="flex items-center gap-2.5 border-t border-border py-2.5 text-[14.5px]">
            <Repeat className="size-4 shrink-0 text-subtle" />
            {repeatLabel(event.recurrenceFreq, event.recurrenceInterval)}
            {repeatsUntil && (
              <span className="text-muted-foreground">until {shortDate(repeatsUntil)}</span>
            )}
          </div>
        )}

        {event.location && (
          <div className="flex items-center gap-2.5 border-t border-border py-2.5 text-[14.5px]">
            <MapPin className="size-4 shrink-0 text-subtle" />
            {event.location}
          </div>
        )}

        {event.description && (
          <p className="border-t border-border pt-3.5 pb-1 text-[14.5px] leading-[1.6] text-muted-foreground">
            {event.description}
          </p>
        )}

        {remove.error && <p className="pt-3 text-sm text-destructive">{remove.error.message}</p>}
        <div className="h-2" />
      </SheetBody>

      <div className="mt-2 flex gap-2.5 border-t border-border px-[18px] pt-4 pb-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 rounded-xl bg-muted py-3 text-[14.5px] font-medium"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={remove.isPending}
          onClick={() => remove.mutate(event.id, { onSuccess: onClose })}
          className="flex-1 rounded-xl py-3 text-[14.5px] font-medium text-destructive disabled:opacity-50"
        >
          {/* Deleting reaches the whole series: one row is all there is. */}
          {event.recurrenceFreq ? 'Delete series' : 'Delete'}
        </button>
      </div>
    </Sheet>
  )
}
