import type { RecurrenceFreq } from './types'

// The choices the sheet offers. Anything outside this list is still valid to the
// API — the chatbot will eventually write such rules — so labelling falls back
// to a generated phrase rather than assuming one of these.
export const REPEATS: { label: string; freq: RecurrenceFreq | null; interval: number }[] = [
  { label: 'Never', freq: null, interval: 1 },
  { label: 'Every day', freq: 'Daily', interval: 1 },
  { label: 'Every week', freq: 'Weekly', interval: 1 },
  { label: 'Every 2 weeks', freq: 'Weekly', interval: 2 },
  { label: 'Every month', freq: 'Monthly', interval: 1 },
]

const UNITS: Record<RecurrenceFreq, string> = {
  Daily: 'days',
  Weekly: 'weeks',
  Monthly: 'months',
}

export function repeatLabel(freq: RecurrenceFreq | null, interval: number): string {
  const preset = REPEATS.find((r) => r.freq === freq && r.interval === interval)
  if (preset) return preset.label
  if (!freq) return 'Never'

  return `Every ${interval} ${UNITS[freq]}`
}
