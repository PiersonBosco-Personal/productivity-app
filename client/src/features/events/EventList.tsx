import { useState } from 'react'
import { addDays, format, isSameDay, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCalendars } from '@/features/calendars/queries'
import type { CalendarEvent } from '@/lib/types'
import { useCreateEvent, useDeleteEvent, useEvents, useUpdateEvent } from './queries'

// What the datetime-local inputs hold: local wall-clock, no zone.
const LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm"

const emptyForm = { id: '', calendarId: '', title: '', start: '', end: '' }

export function EventList() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const weekEnd = addDays(weekStart, 7)

  const calendars = useCalendars()
  const events = useEvents(weekStart, weekEnd)
  const create = useCreateEvent()
  const update = useUpdateEvent()

  const [form, setForm] = useState(emptyForm)
  const set = (patch: Partial<typeof emptyForm>) => setForm((f) => ({ ...f, ...patch }))

  // Falls back to the first calendar until one is picked.
  const calendarId = form.calendarId || calendars.data?.[0]?.id || ''

  function submit() {
    const start = new Date(form.start)
    const end = new Date(form.end)

    // Pressing Enter in a text input submits the form even when the button is
    // disabled, so the same conditions have to be checked here too.
    if (!calendarId || !form.title.trim() || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return
    }

    const body = {
      calendarId,
      title: form.title.trim(),
      // The inputs give local time; toISOString converts to the UTC the API wants.
      startsAtUtc: start.toISOString(),
      endsAtUtc: end.toISOString(),
      isAllDay: false,
    }
    const done = { onSuccess: () => setForm(emptyForm) }

    if (form.id) update.mutate({ id: form.id, ...body }, done)
    else create.mutate(body, done)
  }

  function edit(event: CalendarEvent) {
    setForm({
      id: event.id,
      calendarId: event.calendarId,
      title: event.title,
      start: format(new Date(event.startsAtUtc), LOCAL_FORMAT),
      end: format(new Date(event.endsAtUtc), LOCAL_FORMAT),
    })
  }

  const formError = create.error ?? update.error
  const hasCalendars = (calendars.data?.length ?? 0) > 0

  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2">
        <h2 className="mr-auto font-semibold">
          {format(weekStart, 'MMM d')} – {format(addDays(weekEnd, -1), 'MMM d, yyyy')}
        </h2>
        <Button size="icon" variant="outline" aria-label="Previous week"
                onClick={() => setWeekStart((w) => addDays(w, -7))}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button size="sm" variant="outline"
                onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
          Today
        </Button>
        <Button size="icon" variant="outline" aria-label="Next week"
                onClick={() => setWeekStart((w) => addDays(w, 7))}>
          <ChevronRight className="size-4" />
        </Button>
      </header>

      <div className="divide-y rounded-lg border">
        {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((day) => (
          <Day
            key={day.toISOString()}
            day={day}
            // An event spanning midnight lands on its start day only, which is
            // fine until the week grid replaces this list.
            events={(events.data ?? []).filter((e) => isSameDay(new Date(e.startsAtUtc), day))}
            colorOf={(id) => calendars.data?.find((c) => c.id === id)?.color ?? '#94a3b8'}
            onEdit={edit}
          />
        ))}
      </div>

      {!hasCalendars && calendars.isSuccess && (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Create a calendar before adding events.
        </p>
      )}

      {hasCalendars && (
      <form
        className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto_auto_auto]"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Input
          placeholder="New event"
          maxLength={200}
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
        />
        <input
          type="datetime-local"
          aria-label="Starts"
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
          value={form.start}
          onChange={(e) => set({ start: e.target.value })}
        />
        <input
          type="datetime-local"
          aria-label="Ends"
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
          value={form.end}
          onChange={(e) => set({ end: e.target.value })}
        />
        <select
          aria-label="Calendar"
          className="h-9 rounded-md border bg-transparent px-2 text-sm"
          value={calendarId}
          onChange={(e) => set({ calendarId: e.target.value })}
        >
          {calendars.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="flex gap-2 sm:col-span-4">
          <Button type="submit" size="sm"
                  disabled={!form.title.trim() || !form.start || !form.end || !calendarId}>
            {form.id ? 'Save changes' : 'Add event'}
          </Button>
          {form.id && (
            <Button type="button" size="sm" variant="ghost" onClick={() => setForm(emptyForm)}>
              Cancel
            </Button>
          )}
        </div>
      </form>
      )}

      {formError && <p className="text-sm text-destructive">{formError.message}</p>}
      {events.error && (
        <p className="text-sm text-destructive">Could not load events: {events.error.message}</p>
      )}
    </section>
  )
}

function Day({
  day,
  events,
  colorOf,
  onEdit,
}: {
  day: Date
  events: CalendarEvent[]
  colorOf: (calendarId: string) => string
  onEdit: (event: CalendarEvent) => void
}) {
  const remove = useDeleteEvent()

  return (
    <div className="flex gap-4 px-3 py-2">
      <div className="w-24 shrink-0 pt-1 text-sm text-muted-foreground">
        {format(day, 'EEE d')}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        {events.length === 0 && <p className="py-1 text-sm text-muted-foreground/60">—</p>}

        {events.map((event) => (
          <div key={event.id} className="group flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: colorOf(event.calendarId) }} />
            <button type="button" className="truncate text-left text-sm hover:underline"
                    onClick={() => onEdit(event)}>
              <span className="tabular-nums text-muted-foreground">
                {format(new Date(event.startsAtUtc), 'HH:mm')}
              </span>{' '}
              {event.title}
            </button>
            <Button size="icon" variant="ghost" aria-label="Delete"
                    className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(event.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
