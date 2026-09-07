import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useLogout, useMe } from '@/features/auth/queries'
import { CalendarList } from '@/features/calendars/CalendarList'

export function DashboardPage() {
  const navigate = useNavigate()
  const me = useMe()
  const logout = useLogout()

  return (
    <div className="min-h-svh">
      <header className="flex items-center gap-4 border-b px-6 py-3">
        <span className="font-semibold">Productivity</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{me.data?.displayName ?? me.data?.email}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) })}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 p-6 md:grid-cols-[260px_1fr]">
        <CalendarList />
        <div className="rounded-lg border border-dashed p-16 text-center text-sm text-muted-foreground">
          Calendar goes here.
        </div>
      </main>
    </div>
  )
}
