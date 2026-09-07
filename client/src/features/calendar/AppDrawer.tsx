import { Calendar as CalendarIcon, Check, FileText, ListTodo, MessageSquare, Moon, Plus, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLogout, useMe } from '@/features/auth/queries'
import type { Calendar } from '@/lib/types'

// Sections the app will grow into. Only Calendar is live; the rest exist so the
// shape of the navigation is settled before Tasks and Chat land.
const SECTIONS = [
  { key: 'calendar', label: 'Calendar', Icon: CalendarIcon, live: true },
  { key: 'tasks', label: 'Tasks', Icon: ListTodo, live: false },
  { key: 'chat', label: 'Chat', Icon: MessageSquare, live: false },
  { key: 'notes', label: 'Notes', Icon: FileText, live: false },
]

export function AppDrawer({
  calendars,
  hidden,
  onToggle,
  onNewCalendar,
  dark,
  onToggleTheme,
}: {
  calendars: Calendar[]
  hidden: Set<string>
  onToggle: (id: string) => void
  onNewCalendar: () => void
  dark: boolean
  onToggleTheme: () => void
}) {
  const me = useMe()
  const logout = useLogout()
  const navigate = useNavigate()
  const initial = (me.data?.displayName ?? me.data?.email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-3 px-[18px] pt-[calc(env(safe-area-inset-top)+20px)] pb-4">
        <span className="grid size-[38px] shrink-0 place-items-center rounded-[13px] bg-muted text-sm font-semibold">
          {initial}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14.5px] font-semibold tracking-tight">
            {me.data?.displayName ?? 'Signed in'}
          </span>
          <span className="block truncate text-[12.5px] text-subtle">{me.data?.email}</span>
        </span>
      </div>

      <nav className="px-2.5 pb-2.5">
        {SECTIONS.map(({ key, label, Icon, live }) => (
          <button
            key={key}
            type="button"
            disabled={!live}
            className={`flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left text-[14.5px] ${
              live ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground'
            }`}
          >
            <Icon className="size-[17px] shrink-0 opacity-80" />
            {label}
            {!live && (
              <span className="ml-auto text-[10.5px] font-semibold uppercase tracking-[0.06em] text-subtle">
                Soon
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mx-[18px] mb-3 h-px bg-border" />

      <div className="flex items-center px-5 pb-1.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.095em] text-subtle">Calendars</span>
        <button
          type="button"
          onClick={onNewCalendar}
          aria-label="New calendar"
          className="ml-auto grid size-7 place-items-center rounded-[9px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-[17px]" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5">
        {calendars.map((c) => {
          const on = !hidden.has(c.id)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              aria-pressed={on}
              className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left hover:bg-muted"
            >
              <span
                className={`size-[11px] shrink-0 rounded-full ${on ? '' : 'opacity-30'}`}
                style={{ background: c.color }}
              />
              <span className={`min-w-0 flex-1 truncate text-[14.5px] ${on ? '' : 'text-subtle'}`}>
                {c.name}
              </span>
              <span
                className={`grid size-[18px] shrink-0 place-items-center rounded-md border-[1.5px] ${
                  on ? 'border-foreground bg-foreground text-background' : 'border-input'
                }`}
              >
                {on && <Check className="size-[11px]" strokeWidth={3.4} />}
              </span>
            </button>
          )
        })}
        {calendars.length === 0 && (
          <p className="px-3 py-4 text-[13px] text-subtle">No calendars yet.</p>
        )}
      </div>

      <div className="border-t border-border px-2.5 pt-2 pb-[calc(env(safe-area-inset-bottom)+14px)]">
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left text-[14.5px] text-muted-foreground hover:bg-muted"
        >
          {dark ? <Moon className="size-[17px] opacity-80" /> : <Sun className="size-[17px] opacity-80" />}
          {dark ? 'Dark' : 'Light'}
        </button>
        <button
          type="button"
          onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) })}
          className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left text-[14.5px] text-muted-foreground hover:bg-muted"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
