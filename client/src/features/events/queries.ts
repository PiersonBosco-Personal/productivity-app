import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CalendarEvent } from '@/lib/types'

// Every mutation invalidates this prefix, which matches every cached window.
const eventsKey = ['events']

type EventDraft = {
  calendarId: string
  title: string
  startsAtUtc: string
  endsAtUtc: string
  isAllDay: boolean
}

export function useEvents(from: Date, to: Date, calendarId?: string) {
  const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() })
  if (calendarId) params.set('calendarId', calendarId)
  const query = params.toString()

  return useQuery({
    // The window is part of the key, so paging back a week is a separate entry
    // and returning to this one is instant.
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
