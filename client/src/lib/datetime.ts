// Pure date and time helpers. Deliberately imports nothing, so datetime.check.ts
// can run under `node --experimental-strip-types` with no bundler or alias.
//
// Everything here works in the browser's local zone. Conversion to the UTC the
// API wants happens once, at the network boundary, via toISOString().

export const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DOW_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export type Meridiem = 'AM' | 'PM'

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

// Stable identity for a day, used as a React key and a DOM lookup handle.
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// Monday-first weeks. getDay() is Sunday-first, hence the shift.
export function mondayOf(d: Date): Date {
  const x = startOfDay(d)
  return addDays(x, -((x.getDay() + 6) % 7))
}

export function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// One week is exactly one API window. Half-open [from, to) matches the API's
// overlap predicate (starts < to && ends > from) with no adjustment.
export function weekWindow(weekStart: Date): { from: string; to: string } {
  const from = startOfDay(weekStart)
  return { from: from.toISOString(), to: addDays(from, 7).toISOString() }
}

export function timeParts(mins: number): { h: number; m: number; ap: Meridiem } {
  const h24 = Math.floor(mins / 60)
  return {
    h: h24 % 12 === 0 ? 12 : h24 % 12,
    m: mins % 60,
    ap: h24 < 12 ? 'AM' : 'PM',
  }
}

export function toMinutes(h: number, m: number, ap: Meridiem): number {
  return ((h % 12) + (ap === 'PM' ? 12 : 0)) * 60 + m
}

export function fmtTime(mins: number): string {
  const { h, m, ap } = timeParts(mins)
  return `${h}:${String(m).padStart(2, '0')} ${ap}`
}

export function fmtHour12(hour24: number): string {
  const h = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${h} ${hour24 < 12 ? 'AM' : 'PM'}`
}

export function fmtDuration(mins: number): string {
  if (mins <= 0) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h}h ${m}m`
  return h ? `${h}h` : `${m}m`
}

export function longDate(d: Date): string {
  return `${DOW_LONG[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function shortDate(d: Date): string {
  return `${DOW_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`
}

// Local wall-clock minutes since midnight.
export function minutesOf(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

// A calendar day plus minutes-since-midnight, back into a real local Date.
export function combine(day: Date, mins: number): Date {
  const x = startOfDay(day)
  x.setMinutes(mins)
  return x
}
