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
}
