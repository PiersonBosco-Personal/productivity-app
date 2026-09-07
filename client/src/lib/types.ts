export type User = {
  id: string
  email: string
  displayName: string | null
}

export type Calendar = {
  id: string
  name: string
  color: string
}

export type RecurrenceFreq = 'Daily' | 'Weekly' | 'Monthly'

// "Event" is taken by the DOM, so the domain type gets a prefix.
export type CalendarEvent = {
  id: string
  calendarId: string
  title: string
  description: string | null
  location: string | null
  startsAtUtc: string
  endsAtUtc: string
  isAllDay: boolean
  // Null on a one-off. On an occurrence of a repeating event these describe the
  // whole series, and startsAtUtc is this occurrence: the series is one row, so
  // every occurrence of it arrives with the same id.
  recurrenceFreq: RecurrenceFreq | null
  recurrenceInterval: number
  recurrenceUntilUtc: string | null
  // Where the series began. Editing has to send this back, or the series would
  // move to whichever occurrence happened to be open.
  seriesStartsAtUtc: string
}
