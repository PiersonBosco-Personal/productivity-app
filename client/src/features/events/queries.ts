import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { weekWindow } from '@/lib/datetime'
import type { CalendarEvent, RecurrenceFreq } from '@/lib/types'

// Every mutation invalidates this prefix, which matches every cached week.
const eventsKey = ['events']

// The fields the API accepts on create and update — its EventRequest DTO.
export type EventDraft = {
  calendarId: string
  title: string
  description: string | null
  location: string | null
  startsAtUtc: string
  endsAtUtc: string
  isAllDay: boolean
  recurrenceFreq: RecurrenceFreq | null
  recurrenceInterval: number
  // Exclusive, like every other end in this app: an occurrence starting exactly
  // here is not part of the series.
  recurrenceUntilUtc: string | null
}

// One week is one window. The visible-calendar filter is deliberately NOT part
// of the request: the API's ?calendarId= takes a single id and cannot express
// "these three", and fetching the whole week makes toggling free.
export function useWeekEvents(weekStart: Date) {
  const { from, to } = weekWindow(weekStart)
  const query = new URLSearchParams({ from, to }).toString()

  return useQuery({
    // The window is in the key, so paging back to a week already seen is instant.
    queryKey: [...eventsKey, query],
    queryFn: () => api<CalendarEvent[]>(`/events?${query}`),
    // A 4xx will not fix itself, so do not hammer the endpoint three more times.
    retry: false,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EventDraft) =>
      api<CalendarEvent>('/events', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventsKey }),
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: EventDraft & { id: string }) =>
      api<void>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventsKey }),
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(`/events/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventsKey }),
  })
}
