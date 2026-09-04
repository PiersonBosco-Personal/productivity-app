// ponytail: throwaway stand-in so the login flow runs before the API exists.
// Delete this file and set VITE_MOCK=0 once /api/auth/* is live.
import type { User } from './types'

export const USE_MOCK = import.meta.env.VITE_MOCK !== '0'

const accounts = new Map<string, { password: string; user: User }>()
let current: User | null = null

function unauthorized(message: string): never {
  throw Object.assign(new Error(message), { status: 401 })
}

export async function mockFetch<T>(path: string, init?: RequestInit): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const body = init?.body ? JSON.parse(init.body as string) : null
  const json = (value: unknown) => value as T

  switch (path) {
    case '/auth/me':
      return current ? json(current) : unauthorized('Not signed in')

    case '/auth/register': {
      if (accounts.has(body.email)) throw new Error('That email is already registered')
      const user: User = { id: crypto.randomUUID(), email: body.email, displayName: body.displayName || null }
      accounts.set(body.email, { password: body.password, user })
      current = user
      return json(user)
    }

    case '/auth/login': {
      const account = accounts.get(body.email)
      if (!account || account.password !== body.password) unauthorized('Invalid email or password')
      current = account.user
      return json(current)
    }

    case '/auth/logout':
      current = null
      return json(undefined)

    default:
      throw new Error(`mockApi: unhandled ${init?.method ?? 'GET'} ${path}`)
  }
}
