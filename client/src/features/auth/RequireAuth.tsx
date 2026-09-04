import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useMe } from './queries'

export function RequireAuth({ children }: { children: ReactNode }) {
  const me = useMe()

  if (me.isPending) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Loading…</div>
  }
  if (!me.data) return <Navigate to="/login" replace />

  return <>{children}</>
}
