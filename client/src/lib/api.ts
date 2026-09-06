export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    // Sends the auth cookie. Same-origin thanks to the Vite proxy, so nothing else is needed.
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })

  if (!res.ok) {
    // The API returns bare strings for errors, so this reads as a clean message.
    const message = await res.text()
    throw new ApiError(res.status, message || res.statusText)
  }
  // 204 from logout has no body to parse.
  return res.status === 204 ? (undefined as T) : res.json()
}
