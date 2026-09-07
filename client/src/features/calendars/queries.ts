import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Calendar } from '@/lib/types'

const calendarsKey = ['calendars']

// The fields the API accepts on create and update — its CalendarRequest DTO.
type CalendarDraft = { name: string; color: string }

export function useCalendars() {
  return useQuery({
    queryKey: calendarsKey,
    queryFn: () => api<Calendar[]>('/calendars'),
  })
}

export function useCreateCalendar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CalendarDraft) =>
      api<Calendar>('/calendars', { method: 'POST', body: JSON.stringify(body) }),
    // The server assigns the id, so refetch rather than guessing the new list.
    onSuccess: () => qc.invalidateQueries({ queryKey: calendarsKey }),
  })
}

export function useUpdateCalendar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: CalendarDraft & { id: string }) =>
      api<void>(`/calendars/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: calendarsKey }),
  })
}

export function useDeleteCalendar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(`/calendars/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: calendarsKey }),
  })
}
