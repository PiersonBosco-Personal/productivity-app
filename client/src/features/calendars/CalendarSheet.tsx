import { useState } from 'react'
import { Sheet, SheetBody, SheetHeader } from '@/components/Sheet'
import { ColorPicker } from './ColorPicker'
import { useCreateCalendar } from './queries'
import { nextPaletteColor, withAlpha } from '@/lib/colors'
import type { Calendar } from '@/lib/types'

export function CalendarSheet({
  existing,
  onClose,
}: {
  existing: Calendar[]
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(() => nextPaletteColor(existing.map((c) => c.color)))
  const create = useCreateCalendar()

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetHeader
        title="New calendar"
        onCancel={onClose}
        action={() => create.mutate({ name: name.trim(), color }, { onSuccess: onClose })}
        actionLabel="Create"
        actionDisabled={!name.trim() || create.isPending}
      />
      <SheetBody>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Calendar name"
          maxLength={100}
          className="w-full bg-transparent pt-2 pb-3.5 text-[22px] font-semibold leading-[1.25] tracking-[-0.022em] outline-none placeholder:font-medium placeholder:text-subtle"
        />
        <div className="-mx-[18px] mb-1 h-px bg-border" />

        <p className="pt-4 pb-0.5 text-[10.5px] font-semibold uppercase tracking-[0.095em] text-subtle">
          Color
        </p>
        <ColorPicker value={color} onChange={setColor} />

        {/* Both contexts the colour will actually appear in, before committing. */}
        <div className="mt-1.5 border-t border-border pt-3.5 pb-1">
          <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.095em] text-subtle">
            Preview
          </p>
          <div className="flex items-stretch gap-3 py-2">
            <span className="w-[3px] shrink-0 rounded-sm" style={{ background: color }} />
            <span>
              <span className="tnum block text-[12.5px] text-muted-foreground">9:00 AM</span>
              <span className="block text-base leading-[1.32] tracking-[-0.011em]">Standup</span>
            </span>
          </div>
          <div
            className="mt-1.5 rounded-[10px] px-3 py-2.5 text-sm font-medium"
            style={{ background: withAlpha(color, 'var(--band-alpha)'), color }}
          >
            All-day event
          </div>
        </div>

        {create.error && <p className="pt-3 text-sm text-destructive">{create.error.message}</p>}
        <div className="h-4" />
      </SheetBody>
    </Sheet>
  )
}
