import { withAlpha } from '@/lib/colors'
import type { CalendarEvent } from '@/lib/types'

// A filled band rather than a row: an all-day event has no time to show, so the
// time column would be dead space. Arrows say the run continues either side.
export function AllDayBand({
  event,
  color,
  first,
  last,
  onOpen,
}: {
  event: CalendarEvent
  color: string
  first: boolean
  last: boolean
  onOpen: (event: CalendarEvent) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      className={`mb-1.5 flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-sm font-medium leading-[1.2] ${first ? '' : 'opacity-[0.82]'}`}
      // The alpha comes from a token so light and dark fill at different strengths.
      style={{ background: withAlpha(color, 'var(--band-alpha)'), color }}
    >
      {!first && <span className="-mr-0.5 text-xs opacity-55">←</span>}
      <span className="min-w-0 flex-1 truncate">{event.title}</span>
      {!last && <span className="text-xs opacity-55">→</span>}
    </button>
  )
}
