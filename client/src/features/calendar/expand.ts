// Turns the flat list the API returns for a week into one bucket per day.
// Imports only from datetime.ts (which imports nothing), so expand.check.ts
// runs under `node --experimental-strip-types`.
import { addDays, startOfDay } from '../../lib/datetime.ts'

// Structural, not imported from lib/types, so this module stays alias-free.
// Matches CalendarEvent field for field.
export type WeekEvent = {
  id: string
  calendarId: string
  title: string
  description: string | null
  location: string | null
  startsAtUtc: string
  endsAtUtc: string
  isAllDay: boolean
}

// An all-day event placed on one specific day of its run. first/false and
// last/false are what drive the continuation arrows.
export type PlacedBand<T> = { event: T; first: boolean; last: boolean }

export type DayBucket<T> = {
  day: Date
  allDay: PlacedBand<T>[]
  timed: PlacedBand<T>[]
}

export function bucketWeek<T extends WeekEvent>(
  weekStart: Date,
  events: T[],
  hidden: Set<string>,
): DayBucket<T>[] {
  const visible = events.filter((e) => !hidden.has(e.calendarId))

  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(startOfDay(weekStart), i)
    const dayEnd = addDays(day, 1)

    const allDay: PlacedBand<T>[] = []
    const timed: PlacedBand<T>[] = []

    for (const e of visible) {
      const starts = new Date(e.startsAtUtc)
      const ends = new Date(e.endsAtUtc)

      // Same half-open overlap the API uses, at day granularity. The end is
      // exclusive, so an event ending at midnight does not touch that day.
      if (starts < dayEnd && ends > day) {
        // The final covered day is the one before the exclusive end. Stepping
        // back a millisecond before truncating lands on it whether the end is
        // exactly midnight or partway through a day.
        const lastDay = startOfDay(new Date(ends.getTime() - 1))
        const placed = {
          event: e,
          first: startOfDay(starts).getTime() === day.getTime(),
          last: lastDay.getTime() === day.getTime(),
        }
        // Timed and all-day events span days by exactly the same rule. Only
        // how they are drawn differs, so the placement logic is shared.
        if (e.isAllDay) allDay.push(placed)
        else timed.push(placed)
      }
    }

    // A run continuing from an earlier day sorts first: it is already in
    // progress at midnight.
    timed.sort((a, b) => a.event.startsAtUtc.localeCompare(b.event.startsAtUtc))
    return { day, allDay, timed }
  })
}
