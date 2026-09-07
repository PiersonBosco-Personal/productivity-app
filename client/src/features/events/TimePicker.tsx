import { useEffect, useRef } from 'react'
import { timeParts, toMinutes } from '@/lib/datetime'
import type { Meridiem } from '@/lib/datetime'

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)
const MERIDIEMS: Meridiem[] = ['AM', 'PM']

// Three short columns rather than one list of 288 entries. Each column opens
// centred on its current value, so most edits need no scrolling at all.
export function TimePicker({
  value,
  onChange,
  allows,
  hint,
}: {
  value: number
  onChange: (minutes: number) => void
  // Lets the Ends picker grey out anything at or before the start. Given the
  // other two columns' current values, is this candidate reachable?
  allows?: (minutes: number) => boolean
  hint?: string
}) {
  const { h, m, ap } = timeParts(value)

  return (
    <div className="pb-4">
      <div className="flex items-center pt-3 pb-1.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.095em] text-subtle">Time</span>
        {hint && <span className="tnum ml-auto text-[12.5px] text-subtle">{hint}</span>}
      </div>
      <div className="flex h-[196px] gap-2">
        <Column
          items={HOURS}
          current={h}
          label={(x) => String(x)}
          build={(x) => toMinutes(x, m, ap)}
          allows={allows}
          onPick={onChange}
        />
        <Column
          items={MINUTES}
          current={m}
          label={(x) => `:${String(x).padStart(2, '0')}`}
          build={(x) => toMinutes(h, x, ap)}
          allows={allows}
          onPick={onChange}
        />
        <Column
          items={MERIDIEMS}
          current={ap}
          label={(x) => x}
          build={(x) => toMinutes(h, m, x)}
          allows={allows}
          onPick={onChange}
        />
      </div>
    </div>
  )
}

// Generic over the column's own value type, so no casting is needed to share
// one implementation between numbers and 'AM' | 'PM'.
function Column<T extends string | number>({
  items,
  current,
  label,
  build,
  allows,
  onPick,
}: {
  items: readonly T[]
  current: T
  label: (item: T) => string
  build: (item: T) => number
  allows?: (minutes: number) => boolean
  onPick: (minutes: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const selectedIndex = items.indexOf(current)

  // Open centred on the current value. Assigning scrollTop directly rather than
  // scrollIntoView keeps it from scrolling the sheet behind it too.
  useEffect(() => {
    const el = ref.current
    const child = el?.children[selectedIndex] as HTMLElement | undefined
    if (!el || !child) return
    el.scrollTop = Math.max(0, child.offsetTop - el.clientHeight / 2 + child.offsetHeight / 2)
  }, [selectedIndex])

  return (
    <div
      ref={ref}
      className="min-w-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => {
        const minutes = build(item)
        const disabled = allows ? !allows(minutes) : false
        return (
          <button
            key={String(item)}
            type="button"
            disabled={disabled}
            onClick={() => onPick(minutes)}
            className={`tnum block w-full rounded-[11px] px-2 py-2.5 text-center text-[15.5px] tracking-[-0.01em] ${
              item === current ? 'bg-primary font-semibold text-primary-foreground' : 'hover:bg-muted'
            } ${disabled ? 'pointer-events-none opacity-25' : ''}`}
          >
            {label(item)}
          </button>
        )
      })}
    </div>
  )
}
