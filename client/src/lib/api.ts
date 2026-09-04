import { mockFetch, USE_MOCK } from './mockApi'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK) return mockFetch<T>(path, init)

  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })

  if (!res.ok) {
    const message = await res.text()
    throw new ApiError(res.status, message || res.statusText)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}
