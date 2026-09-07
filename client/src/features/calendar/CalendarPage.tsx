import { useMemo, useRef, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Calendar as CalendarEmptyIcon, Menu, Plus } from 'lucide-react'
import { AppDrawer } from './AppDrawer'
import { Agenda } from './Agenda'
import { WeekStrip } from './WeekStrip'
import { bucketWeek } from './expand'
import { useCalendars } from '@/features/calendars/queries'
import { useWeekEvents } from '@/features/events/queries'
import { EventSheet } from '@/features/events/EventSheet'
import { EventDetailSheet } from '@/features/events/EventDetailSheet'
import { CalendarSheet } from '@/features/calendars/CalendarSheet'
import { MONTHS, addDays, dayKey, mondayOf, sameDay, startOfDay } from '@/lib/datetime'
import type { CalendarEvent } from '@/lib/types'

type SheetState =
  | { kind: 'none' }
  | { kind: 'event'; event?: CalendarEvent }
  | { kind: 'detail'; event: CalendarEvent }
  | { kind: 'calendar' }

export function CalendarPage() {
  // Captured once per mount so "today" cannot shift mid-render.
  const [today] = useState(() => startOfDay(new Date()))
  const [weekStart, setWeekStart] = useState(() => mondayOf(today))
  const [selected, setSelected] = useState(today)
  // Hidden rather than visible, so a calendar created later defaults to shown.
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sheet, setSheet] = useState<SheetState>({ kind: 'none' })
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const calendars = useCalendars()
  const events = useWeekEvents(weekStart)

  const buckets = useMemo(
    () => bucketWeek(weekStart, events.data ?? [], hidden),
    [weekStart, events.data, hidden],
  )

  const colorOf = (calendarId: string) =>
    calendars.data?.find((c) => c.id === calendarId)?.color ?? '#7C8296'

  function page(delta: number) {
    const next = addDays(weekStart, 7 * delta)
    setWeekStart(next)
    setSelected(sameDay(next, mondayOf(today)) ? today : next)
  }

  function toggleCalendar(id: string) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTheme() {
    const on = !dark
    setDark(on)
    document.documentElement.classList.toggle('dark', on)
  }

  function selectDay(day: Date) {
    setSelected(day)
    // Same id Agenda renders, built from the same helper so they cannot drift.
    document.getElementById(`day-${dayKey(day)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Swipe the agenda sideways to page the week. The 1.8x ratio keeps it from
  // firing during an ordinary vertical scroll.
  const swipe = useRef<{ x: number; y: number } | null>(null)

  const last = addDays(weekStart, 6)
  const monthLabel =
    weekStart.getMonth() === last.getMonth()
      ? MONTHS[weekStart.getMonth()]
      : `${MONTHS[weekStart.getMonth()].slice(0, 3)} – ${MONTHS[last.getMonth()].slice(0, 3)}`
  const offCurrentWeek = !sameDay(weekStart, mondayOf(today))

  const drawer = (
    <AppDrawer
      calendars={calendars.data ?? []}
      hidden={hidden}
      onToggle={toggleCalendar}
      onNewCalendar={() => {
        setDrawerOpen(false)
        setSheet({ kind: 'calendar' })
      }}
      dark={dark}
      onToggleTheme={toggleTheme}
    />
  )

  return (
    <div className="flex h-svh overflow-hidden bg-background lg:grid lg:grid-cols-[296px_1fr]">
      {/* Permanent sidebar from lg; an overlay below it. */}
      <aside className="hidden border-r border-border lg:block">{drawer}</aside>

      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-scrim duration-[260ms] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 lg:hidden" />
          <Dialog.Popup className="fixed inset-y-0 left-0 z-50 w-[296px] border-r border-border outline-none duration-300 data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left lg:hidden">
            {drawer}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-1.5 bg-background px-3 pt-[calc(env(safe-area-inset-top)+14px)] pb-2">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="grid size-10 place-items-center rounded-xl hover:bg-muted lg:hidden"
          >
            <Menu className="size-[19px]" />
          </button>
          <span className="pl-0.5 text-base font-semibold tracking-tight">
            {monthLabel}
            <span className="tnum ml-1.5 font-medium text-subtle">{last.getFullYear()}</span>
          </span>
          {offCurrentWeek && (
            <button
              type="button"
              onClick={() => {
                setWeekStart(mondayOf(today))
                setSelected(today)
              }}
              className="ml-auto rounded-full bg-muted px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground"
            >
              Today
            </button>
          )}
        </header>

        <WeekStrip
          buckets={buckets}
          today={today}
          selected={selected}
          onSelect={selectDay}
          onPage={page}
        />

        <main
          className="min-h-0 flex-1 overflow-y-auto"
          onPointerDown={(e) => { swipe.current = { x: e.clientX, y: e.clientY } }}
          onPointerUp={(e) => {
            const s = swipe.current
            swipe.current = null
            if (!s) return
            const dx = e.clientX - s.x
            const dy = e.clientY - s.y
            if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.8) page(dx < 0 ? 1 : -1)
          }}
        >
          {events.error && (
            <p className="px-5 py-4 text-sm text-destructive">
              Could not load events: {events.error.message}
            </p>
          )}
          {calendars.isSuccess && calendars.data.length === 0 ? (
            <div className="px-8 pt-24 text-center">
              <div className="mx-auto mb-5 grid size-14 place-items-center rounded-[18px] border border-dashed border-input text-subtle">
                <CalendarEmptyIcon className="size-6" strokeWidth={1.6} />
              </div>
              <h3 className="mb-2 text-xl font-semibold tracking-[-0.02em]">No calendars yet</h3>
              <p className="mx-auto mb-6 max-w-[270px] text-[14.5px] leading-[1.5] text-muted-foreground">
                Calendars keep your events grouped and colored. Make one to get started.
              </p>
              <button
                type="button"
                onClick={() => setSheet({ kind: 'calendar' })}
                className="rounded-full bg-primary px-[22px] py-3 text-[14.5px] font-medium text-primary-foreground"
              >
                Create a calendar
              </button>
            </div>
          ) : (
            <Agenda
              buckets={buckets}
              today={today}
              colorOf={colorOf}
              onOpen={(event) => setSheet({ kind: 'detail', event })}
            />
          )}
        </main>

        {(calendars.data?.length ?? 0) > 0 && (
          <button
            type="button"
            aria-label="New event"
            onClick={() => setSheet({ kind: 'event' })}
            className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+26px)] z-20 grid size-14 place-items-center rounded-[19px] bg-primary text-primary-foreground shadow-[0_2px_6px_rgb(15_17_22/0.16),0_12px_28px_rgb(15_17_22/0.22)] transition-transform active:scale-[0.93]"
          >
            <Plus className="size-[23px]" strokeWidth={2.1} />
          </button>
        )}
      </div>

      {sheet.kind === 'event' && (
        <EventSheet
          // Remounting per open re-seeds the draft; without the key, opening a
          // second event would show the first one's values.
          key={sheet.event?.id ?? 'new'}
          open
          event={sheet.event}
          calendars={calendars.data ?? []}
          today={today}
          onClose={() => setSheet({ kind: 'none' })}
        />
      )}

      {sheet.kind === 'detail' && (
        <EventDetailSheet
          event={sheet.event}
          calendar={calendars.data?.find((c) => c.id === sheet.event.calendarId)}
          onClose={() => setSheet({ kind: 'none' })}
          onEdit={() => setSheet({ kind: 'event', event: sheet.event })}
        />
      )}

      {sheet.kind === 'calendar' && (
        <CalendarSheet
          existing={calendars.data ?? []}
          onClose={() => setSheet({ kind: 'none' })}
        />
      )}
    </div>
  )
}
