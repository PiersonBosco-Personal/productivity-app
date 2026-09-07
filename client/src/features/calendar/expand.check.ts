import assert from 'node:assert/strict'
import { bucketWeek } from './expand.ts'

type E = {
  id: string; calendarId: string; title: string
  description: string | null; location: string | null
  startsAtUtc: string; endsAtUtc: string; isAllDay: boolean
}

// Local-time helper so these assertions hold in any zone.
const at = (day: number, h = 0, m = 0) =>
  new Date(2026, 8, day, h, m).toISOString()

const ev = (o: Partial<E> & { id: string; startsAtUtc: string; endsAtUtc: string }): E => ({
  calendarId: 'c1', title: 'x', description: null, location: null, isAllDay: false, ...o,
})

const weekStart = new Date(2026, 8, 7)   // Mon 7 Sep 2026 .. Sun 13 Sep

// --- shape ---
const empty = bucketWeek(weekStart, [], new Set())
assert.equal(empty.length, 7)
assert.equal(empty[0].day.getDate(), 7)
assert.equal(empty[6].day.getDate(), 13)
assert.ok(empty.every((d) => d.timed.length === 0 && d.allDay.length === 0))

// --- a timed event inside one day lands only on that day ---
const timed = bucketWeek(weekStart, [ev({ id: 'a', startsAtUtc: at(9, 9), endsAtUtc: at(9, 10) })], new Set())
assert.equal(timed[2].timed.length, 1)      // Wed 9
assert.equal(timed[2].timed[0].event.id, 'a')
assert.equal(timed.reduce((n, d) => n + d.timed.length, 0), 1)
assert.deepEqual([timed[2].timed[0].first, timed[2].timed[0].last], [true, true])

// --- timed events come back sorted by start, regardless of input order ---
const sorted = bucketWeek(weekStart, [
  ev({ id: 'late', startsAtUtc: at(9, 17), endsAtUtc: at(9, 18) }),
  ev({ id: 'early', startsAtUtc: at(9, 8), endsAtUtc: at(9, 9) }),
], new Set())
assert.deepEqual(sorted[2].timed.map((p) => p.event.id), ['early', 'late'])

// --- a three-day all-day event repeats, with first/last flags ---
// Ends is exclusive: Sep 9-11 inclusive means ends at midnight on the 12th.
const trip = ev({ id: 't', isAllDay: true, startsAtUtc: at(9), endsAtUtc: at(12) })
const b = bucketWeek(weekStart, [trip], new Set())
assert.equal(b[2].allDay.length, 1)                       // Wed 9
assert.deepEqual([b[2].allDay[0].first, b[2].allDay[0].last], [true, false])
assert.deepEqual([b[3].allDay[0].first, b[3].allDay[0].last], [false, false])  // Thu 10
assert.deepEqual([b[4].allDay[0].first, b[4].allDay[0].last], [false, true])   // Fri 11
assert.equal(b[5].allDay.length, 0, 'the exclusive end day must not be covered')

// --- a single-day all-day event is both first and last ---
const bday = ev({ id: 'b', isAllDay: true, startsAtUtc: at(10), endsAtUtc: at(11) })
const one = bucketWeek(weekStart, [bday], new Set())
assert.deepEqual([one[3].allDay[0].first, one[3].allDay[0].last], [true, true])

// --- an event running in from before the week is clipped, and not "first" here ---
const running = ev({ id: 'r', isAllDay: true, startsAtUtc: at(5), endsAtUtc: at(9) })
const clip = bucketWeek(weekStart, [running], new Set())
assert.equal(clip[0].allDay.length, 1)                    // Mon 7
assert.equal(clip[0].allDay[0].first, false, 'started before this week')
assert.equal(clip[1].allDay[0].last, true)                // Tue 8 is the final covered day
assert.equal(clip[2].allDay.length, 0)

// --- a TIMED event crossing midnight spans both days ---
// Sep 9 2:15 PM -> Sep 10 3:15 PM is 25h. It must appear on the 9th AND the 10th,
// or the agenda silently hides a whole day of a running event.
const overnight = ev({ id: 'o', startsAtUtc: at(9, 14, 15), endsAtUtc: at(10, 15, 15) })
const ov = bucketWeek(weekStart, [overnight], new Set())
assert.equal(ov[2].timed.length, 1, 'missing on its start day')
assert.deepEqual([ov[2].timed[0].first, ov[2].timed[0].last], [true, false])
assert.equal(ov[3].timed.length, 1, 'missing on the day it runs into')
assert.deepEqual([ov[3].timed[0].first, ov[3].timed[0].last], [false, true])
assert.equal(ov[4].timed.length, 0)

// --- a timed run of three days has genuine middle days ---
const longRun = ev({ id: 'L', startsAtUtc: at(8, 20), endsAtUtc: at(11, 2) })
const lr = bucketWeek(weekStart, [longRun], new Set())
assert.deepEqual([lr[1].timed[0].first, lr[1].timed[0].last], [true, false])   // Tue 8
assert.deepEqual([lr[2].timed[0].first, lr[2].timed[0].last], [false, false])  // Wed 9
assert.deepEqual([lr[3].timed[0].first, lr[3].timed[0].last], [false, false])  // Thu 10
assert.deepEqual([lr[4].timed[0].first, lr[4].timed[0].last], [false, true])   // Fri 11
assert.equal(lr[5].timed.length, 0)

// --- a timed event ending exactly at midnight does not touch the next day ---
const toMidnight = ev({ id: 'm', startsAtUtc: at(9, 22), endsAtUtc: at(10) })
const tm = bucketWeek(weekStart, [toMidnight], new Set())
assert.equal(tm[2].timed.length, 1)
assert.deepEqual([tm[2].timed[0].first, tm[2].timed[0].last], [true, true])
assert.equal(tm[3].timed.length, 0, 'exclusive end must not bleed into the next day')

// --- hidden calendars are dropped entirely ---
const hidden = bucketWeek(weekStart, [
  ev({ id: 'shown', calendarId: 'c1', startsAtUtc: at(9, 9), endsAtUtc: at(9, 10) }),
  ev({ id: 'gone', calendarId: 'c2', startsAtUtc: at(9, 11), endsAtUtc: at(9, 12) }),
], new Set(['c2']))
assert.deepEqual(hidden[2].timed.map((p) => p.event.id), ['shown'])

console.log('expand.check.ts: all assertions passed')
