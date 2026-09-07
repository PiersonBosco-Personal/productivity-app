export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Failed validation comes back as ProblemDetails JSON; everything we throw by
// hand is a bare string. Flatten both into one readable line.
async function errorMessage(res: Response): Promise<string> {
  const body = await res.text()
  if (!body) return res.statusText
  if (!res.headers.get('content-type')?.includes('json')) return body

  try {
    const problem = JSON.parse(body) as { title?: string; errors?: Record<string, string[]> }
    const fields = Object.values(problem.errors ?? {}).flat()
    return fields.join(' ') || problem.title || body
  } catch {
    return body
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
    throw new ApiError(res.status, await errorMessage(res))
  }
  // 204 from logout, update and delete has no body to parse.
  return res.status === 204 ? (undefined as T) : res.json()
}
