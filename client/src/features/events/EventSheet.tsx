import { useState } from 'react'
import type { ReactNode } from 'react'
import { Check, ChevronRight, Clock, MapPin, Plus, Repeat, Text } from 'lucide-react'
import { Sheet, SheetBody, SheetHeader } from '@/components/Sheet'
import { DatePicker } from './DatePicker'
import { TimePicker } from './TimePicker'
import { useCreateEvent, useUpdateEvent } from './queries'
import type { EventDraft } from './queries'
import {
  addDays, combine, fmtDuration, fmtTime, minutesOf, shortDate, startOfDay,
} from '@/lib/datetime'
import { REPEATS, repeatLabel } from '@/lib/recurrence'
import type { Calendar, CalendarEvent, RecurrenceFreq } from '@/lib/types'

type Row = 'sdate' | 'stime' | 'edate' | 'etime' | 'cal' | 'rep' | 'until' | 'more' | null

type Draft = {
  title: string
  calendarId: string
  allDay: boolean
  startDay: Date
  startMin: number
  endDay: Date
  endMin: number
  location: string
  description: string
  freq: RecurrenceFreq | null
  interval: number
  // The last day an occurrence may fall on, or null for a series with no end.
  until: Date | null
}

function draftFrom(event: CalendarEvent | undefined, calendars: Calendar[], today: Date): Draft {
  if (event) {
    // A repeating event is edited as a whole series, so the sheet shows where
    // the series starts rather than the occurrence that was tapped. Sending an
    // occurrence's date back would drag the whole series forward onto it.
    const s = new Date(event.recurrenceFreq ? event.seriesStartsAtUtc : event.startsAtUtc)
    // Every occurrence is the same length, so the end follows from the duration.
    const e = new Date(+s + (+new Date(event.endsAtUtc) - +new Date(event.startsAtUtc)))
    return {
      title: event.title,
      calendarId: event.calendarId,
      allDay: event.isAllDay,
      startDay: startOfDay(s),
      startMin: event.isAllDay ? 540 : minutesOf(s),
      // An all-day end is exclusive, so the last covered day is a millisecond back.
      endDay: event.isAllDay ? startOfDay(new Date(e.getTime() - 1)) : startOfDay(e),
      endMin: event.isAllDay ? 600 : minutesOf(e),
      location: event.location ?? '',
      description: event.description ?? '',
      freq: event.recurrenceFreq,
      interval: event.recurrenceInterval,
      // Until is exclusive, so the last day it allows is a millisecond back.
      until: event.recurrenceUntilUtc
        ? startOfDay(new Date(new Date(event.recurrenceUntilUtc).getTime() - 1))
        : null,
    }
  }
  const now = new Date()
  const rounded = Math.min(Math.ceil(minutesOf(now) / 15) * 15, 1380)
  return {
    title: '',
    calendarId: calendars[0]?.id ?? '',
    allDay: false,
    startDay: today,
    startMin: rounded,
    endDay: today,
    endMin: rounded + 60,
    location: '',
    description: '',
    freq: null,
    interval: 1,
    until: null,
  }
}

export function EventSheet({
  open,
  event,
  calendars,
  today,
  onClose,
}: {
  open: boolean
  event?: CalendarEvent
  calendars: Calendar[]
  today: Date
  onClose: () => void
}) {
  // Keyed by the caller so this remounts (and re-seeds) per open.
  const [draft, setDraft] = useState<Draft>(() => draftFrom(event, calendars, today))
  const [row, setRow] = useState<Row>(null)
  const create = useCreateEvent()
  const update = useUpdateEvent()

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }))
  const toggle = (r: Row) => setRow((cur) => (cur === r ? null : r))

  const dayGap = Math.round((+startOfDay(draft.endDay) - +startOfDay(draft.startDay)) / 864e5) * 1440
  const durationMins = dayGap + draft.endMin - draft.startMin
  const calendar = calendars.find((c) => c.id === draft.calendarId)

  // Moving the start drags the end with it, so the duration survives.
  function setStartDay(day: Date) {
    const shift = Math.round((+startOfDay(day) - +startOfDay(draft.startDay)) / 864e5)
    patch({ startDay: day, endDay: addDays(draft.endDay, shift) })
  }
  function setStartMin(mins: number) {
    const total = mins + Math.max(durationMins, 5)
    patch({
      startMin: mins,
      endDay: addDays(draft.startDay, Math.floor(total / 1440)),
      endMin: total % 1440,
    })
  }

  function save() {
    if (!draft.title.trim() || !draft.calendarId) return
    const body: EventDraft = {
      calendarId: draft.calendarId,
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      location: draft.location.trim() || null,
      // The inputs hold local wall-clock; toISOString gives the UTC the API wants.
      // An all-day event runs midnight to midnight, end exclusive.
      startsAtUtc: draft.allDay
        ? startOfDay(draft.startDay).toISOString()
        : combine(draft.startDay, draft.startMin).toISOString(),
      endsAtUtc: draft.allDay
        ? addDays(startOfDay(draft.endDay), 1).toISOString()
        : combine(draft.endDay, draft.endMin).toISOString(),
      isAllDay: draft.allDay,
      recurrenceFreq: draft.freq,
      recurrenceInterval: draft.interval,
      // The picker names the last day that may hold an occurrence; the API's
      // Until is exclusive, so it becomes the midnight after that day.
      recurrenceUntilUtc:
        draft.freq && draft.until ? addDays(startOfDay(draft.until), 1).toISOString() : null,
    }
    const done = { onSuccess: onClose }
    if (event) update.mutate({ id: event.id, ...body }, done)
    else create.mutate(body, done)
  }

  const error = create.error ?? update.error
  // A repeat ending before the series begins would contain nothing at all, and
  // the API rejects it. Catch it here so Save cannot produce a 400.
  const untilTooEarly =
    !!draft.freq && !!draft.until && +startOfDay(draft.until) < +startOfDay(draft.startDay)
  const invalid = (!draft.allDay && durationMins <= 0) || untilTooEarly

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetHeader
        title={event ? 'Edit event' : 'New event'}
        onCancel={onClose}
        action={save}
        actionLabel="Save"
        actionDisabled={!draft.title.trim() || !draft.calendarId || invalid}
      />
      <SheetBody>
        <input
          autoFocus
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Add title"
          maxLength={200}
          className="w-full bg-transparent pt-2 pb-3.5 text-[22px] font-semibold leading-[1.25] tracking-[-0.022em] outline-none placeholder:font-medium placeholder:text-subtle"
        />
        <div className="-mx-[18px] mb-1 h-px bg-border" />

        <label className="flex w-full items-center gap-3 border-b border-border py-3">
          <Clock className="size-[17px] shrink-0 text-subtle" />
          <span className="w-[52px] text-sm text-muted-foreground">All day</span>
          <input
            type="checkbox"
            checked={draft.allDay}
            onChange={(e) => {
              patch({ allDay: e.target.checked })
              if (e.target.checked && (row === 'stime' || row === 'etime')) setRow(null)
            }}
            className="ml-auto size-5 accent-[var(--primary)]"
          />
        </label>

        <TimeRow
          label="Starts"
          dateLabel={shortDate(draft.startDay)}
          timeLabel={draft.allDay ? null : fmtTime(draft.startMin)}
          dateOpen={row === 'sdate'}
          timeOpen={row === 'stime'}
          onDate={() => toggle('sdate')}
          onTime={() => toggle('stime')}
        />
        <Collapse open={row === 'sdate'}>
          <DatePicker value={draft.startDay} today={today} onChange={setStartDay} />
        </Collapse>
        <Collapse open={row === 'stime'}>
          <TimePicker value={draft.startMin} open={row === 'stime'} onChange={setStartMin} />
        </Collapse>

        <TimeRow
          label="Ends"
          dateLabel={shortDate(draft.endDay)}
          timeLabel={draft.allDay ? null : fmtTime(draft.endMin)}
          dateOpen={row === 'edate'}
          timeOpen={row === 'etime'}
          onDate={() => toggle('edate')}
          onTime={() => toggle('etime')}
        />
        <Collapse open={row === 'edate'}>
          <DatePicker value={draft.endDay} today={today} onChange={(d) => patch({ endDay: d })} />
        </Collapse>
        <Collapse open={row === 'etime'}>
          <TimePicker
            value={draft.endMin}
            open={row === 'etime'}
            onChange={(mins) => patch({ endMin: mins })}
            // Anything at or before the start is unreachable, which is what keeps
            // ck_events_end_after_start from ever being tripped by this UI.
            allows={(mins) => dayGap + mins - draft.startMin > 0}
            hint={fmtDuration(durationMins)}
          />
        </Collapse>

        <button
          type="button"
          onClick={() => toggle('cal')}
          className="flex w-full items-center gap-3 border-b border-border py-3 text-left"
        >
          <span className="w-[17px] shrink-0" />
          <span className="w-[52px] text-sm text-muted-foreground">Calendar</span>
          <span className="ml-auto flex items-center gap-2 text-[15px]">
            {calendar && (
              <span className="size-[11px] rounded-full" style={{ background: calendar.color }} />
            )}
            {calendar?.name ?? 'None'}
          </span>
          <ChevronRight className="size-[15px] shrink-0 text-subtle" />
        </button>
        <Collapse open={row === 'cal'}>
          <div className="pb-2.5">
            {calendars.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  patch({ calendarId: c.id })
                  setRow(null)
                }}
                className="flex w-full items-center gap-3 py-2.5 text-left"
              >
                <span className="size-[11px] shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="text-[15px]">{c.name}</span>
                {draft.calendarId === c.id && <Check className="ml-auto size-[15px]" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </Collapse>

        <button
          type="button"
          onClick={() => toggle('rep')}
          className="flex w-full items-center gap-3 border-b border-border py-3 text-left"
        >
          <Repeat className="size-[17px] shrink-0 text-subtle" />
          <span className="w-[52px] text-sm text-muted-foreground">Repeat</span>
          <span className="ml-auto text-[15px]">{repeatLabel(draft.freq, draft.interval)}</span>
          <ChevronRight className="size-[15px] shrink-0 text-subtle" />
        </button>
        <Collapse open={row === 'rep'}>
          <div className="pb-2.5">
            {REPEATS.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => {
                  // Dropping the repeat drops its end date with it, so a series
                  // turned back into a one-off cannot leave a stale Until behind.
                  patch({ freq: r.freq, interval: r.interval, until: r.freq ? draft.until : null })
                  setRow(null)
                }}
                className="flex w-full items-center gap-3 py-2.5 text-left"
              >
                <span className="text-[15px]">{r.label}</span>
                {draft.freq === r.freq && draft.interval === r.interval && (
                  <Check className="ml-auto size-[15px]" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </Collapse>

        {draft.freq && (
          <>
            <button
              type="button"
              onClick={() => toggle('until')}
              className="flex w-full items-center gap-3 border-b border-border py-3 text-left"
            >
              <span className="w-[17px] shrink-0" />
              <span className="w-[52px] text-sm text-muted-foreground">Until</span>
              <span className={`ml-auto text-[15px] ${untilTooEarly ? 'text-destructive' : ''}`}>
                {draft.until ? shortDate(draft.until) : 'Forever'}
              </span>
              <ChevronRight className="size-[15px] shrink-0 text-subtle" />
            </button>
            <Collapse open={row === 'until'}>
              <div className="pb-2.5">
                <button
                  type="button"
                  onClick={() => {
                    patch({ until: null })
                    setRow(null)
                  }}
                  className="flex w-full items-center gap-3 py-2.5 text-left"
                >
                  <span className="text-[15px]">Forever</span>
                  {!draft.until && <Check className="ml-auto size-[15px]" strokeWidth={3} />}
                </button>
                {/* The picker names the last day that may hold an occurrence. */}
                <DatePicker
                  value={draft.until ?? draft.startDay}
                  today={today}
                  onChange={(d) => patch({ until: d })}
                />
              </div>
            </Collapse>
          </>
        )}

        {event?.recurrenceFreq && (
          <p className="pt-2.5 text-[12.5px] leading-[1.45] text-subtle">
            Changes apply to every occurrence of this event.
          </p>
        )}

        <button
          type="button"
          onClick={() => toggle('more')}
          className="flex w-full items-center gap-3 border-b border-border py-3 text-left"
        >
          <Plus className="size-[17px] shrink-0 text-subtle" />
          <span className="text-sm text-muted-foreground">Add location, notes</span>
        </button>
        <Collapse open={row === 'more'}>
          <div className="pb-2">
            <div className="flex items-center gap-3 border-b border-border py-3">
              <MapPin className="size-[17px] shrink-0 text-subtle" />
              <input
                value={draft.location}
                onChange={(e) => patch({ location: e.target.value })}
                placeholder="Location"
                maxLength={200}
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-subtle"
              />
            </div>
            <div className="flex items-center gap-3 py-3">
              <Text className="size-[17px] shrink-0 text-subtle" />
              <input
                value={draft.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Notes"
                maxLength={2000}
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-subtle"
              />
            </div>
          </div>
        </Collapse>

        {untilTooEarly && (
          <p className="pt-3 text-sm text-destructive">
            The repeat ends before the event starts.
          </p>
        )}
        {error && <p className="pt-3 text-sm text-destructive">{error.message}</p>}
        {calendars.length === 0 && (
          <p className="pt-3 text-sm text-destructive">Create a calendar before adding events.</p>
        )}
        <div className="h-6" />
      </SheetBody>
    </Sheet>
  )
}

function TimeRow({
  label, dateLabel, timeLabel, dateOpen, timeOpen, onDate, onTime,
}: {
  label: string
  dateLabel: string
  timeLabel: string | null
  dateOpen: boolean
  timeOpen: boolean
  onDate: () => void
  onTime: () => void
}) {
  const pill = (active: boolean) =>
    `tnum rounded-[11px] px-3.5 py-2 text-[14.5px] tracking-[-0.008em] ${
      active ? 'bg-primary font-semibold text-primary-foreground' : 'bg-muted text-muted-foreground'
    }`
  return (
    <div className="flex items-center gap-2 border-b border-border py-2.5">
      <span className="w-[17px] shrink-0" />
      <span className="w-[52px] shrink-0 text-sm text-muted-foreground">{label}</span>
      <button type="button" onClick={onDate} className={`ml-auto ${pill(dateOpen)}`}>{dateLabel}</button>
      {timeLabel && (
        <button type="button" onClick={onTime} className={pill(timeOpen)}>{timeLabel}</button>
      )}
    </div>
  )
}

// Expand in place, so a typed title is never lost to a navigation. The
// grid-rows 0fr -> 1fr trick animates to content height without a fixed max.
function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className={`overflow-hidden ${open ? 'border-b border-border' : ''}`}>{children}</div>
    </div>
  )
}
