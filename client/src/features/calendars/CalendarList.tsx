import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Calendar } from '@/lib/types'
import { useCalendars, useCreateCalendar, useDeleteCalendar, useUpdateCalendar } from './queries'

export function CalendarList() {
  const calendars = useCalendars()
  const create = useCreateCalendar()

  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')

  function submit() {
    create.mutate({ name: name.trim(), color }, { onSuccess: () => setName('') })
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Calendars</h2>

      {calendars.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
      {calendars.error && <p className="text-sm text-destructive">{calendars.error.message}</p>}

      <ul className="divide-y rounded-lg border">
        {calendars.data?.map((calendar) => <CalendarRow key={calendar.id} calendar={calendar} />)}
        {calendars.data?.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">No calendars yet.</li>
        )}
      </ul>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <ColorInput value={color} onChange={setColor} />
        <Input
          placeholder="New calendar"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={!name.trim() || create.isPending}>
          Add
        </Button>
      </form>

      {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}
    </section>
  )
}

function CalendarRow({ calendar }: { calendar: Calendar }) {
  const update = useUpdateCalendar()
  const remove = useDeleteCalendar()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(calendar.name)
  const [color, setColor] = useState(calendar.color)

  function save() {
    update.mutate(
      { id: calendar.id, name: name.trim(), color },
      { onSuccess: () => setEditing(false) },
    )
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2 p-2">
        <ColorInput value={color} onChange={setColor} />
        <Input
          autoFocus
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') setEditing(false)
          }}
        />
        <Button size="sm" onClick={save} disabled={!name.trim() || update.isPending}>
          Save
        </Button>
      </li>
    )
  }

  return (
    <li className="group flex items-center gap-2 px-3 py-2">
      <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: calendar.color }} />
      <span className="truncate text-sm">{calendar.name}</span>

      {/* Buttons stay mounted so the row height never jumps on hover. */}
      <div className="ml-auto flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Button size="icon" variant="ghost" aria-label="Rename" onClick={() => setEditing(true)}>
          <Pencil className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Delete"
          disabled={remove.isPending}
          onClick={() => remove.mutate(calendar.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  )
}

// Native swatch picker. Always emits #rrggbb, which is exactly what the API's
// regex accepts.
function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="color"
      aria-label="Color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
    />
  )
}
