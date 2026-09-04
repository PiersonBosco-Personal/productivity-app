import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { User } from '@/lib/types'

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api<User>('/auth/me'),
    retry: false,
    staleTime: Infinity,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<User>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (user) => qc.setQueryData(['me'], user),
  })
}

export function useRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { email: string; password: string; displayName: string }) =>
      api<User>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (user) => qc.setQueryData(['me'], user),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => qc.clear(),
  })
}
