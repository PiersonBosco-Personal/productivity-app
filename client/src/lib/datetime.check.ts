import assert from 'node:assert/strict'
import {
  addDays, dayKey, firstOfMonth, fmtDuration, fmtHour12, fmtTime, longDate,
  minutesOf, mondayOf, sameDay, shortDate, startOfDay, timeParts, toMinutes,
  combine, weekWindow,
} from './datetime.ts'

// --- day arithmetic ---
const thu = new Date(2026, 8, 3)             // Thu 3 Sep 2026
assert.equal(mondayOf(thu).getDate(), 31)     // Mon 31 Aug
assert.equal(mondayOf(thu).getMonth(), 7)
assert.equal(mondayOf(new Date(2026, 8, 7)).getDate(), 7)  // a Monday is its own Monday

const sun = new Date(2026, 8, 6)             // Sunday — the off-by-one trap
assert.equal(mondayOf(sun).getDate(), 31)

assert.equal(addDays(thu, 5).getDate(), 8)
assert.equal(addDays(thu, -5).getDate(), 29)
assert.ok(sameDay(new Date(2026, 8, 3, 23, 59), new Date(2026, 8, 3, 0, 0)))
assert.ok(!sameDay(new Date(2026, 8, 3), new Date(2026, 8, 4)))
assert.equal(startOfDay(new Date(2026, 8, 3, 14, 30)).getHours(), 0)
assert.equal(dayKey(new Date(2026, 8, 3)), '2026-8-3')
assert.equal(firstOfMonth(thu).getDate(), 1)

// --- the week window sent to the API ---
const win = weekWindow(new Date(2026, 8, 7))
assert.equal(win.from, new Date(2026, 8, 7).toISOString())
assert.equal(win.to, new Date(2026, 8, 14).toISOString())
assert.ok(win.to > win.from)

// --- 12-hour formatting, always with a meridiem ---
assert.equal(fmtTime(0), '12:00 AM')
assert.equal(fmtTime(540), '9:00 AM')
assert.equal(fmtTime(720), '12:00 PM')
assert.equal(fmtTime(785), '1:05 PM')
assert.equal(fmtTime(1439), '11:59 PM')
assert.equal(fmtHour12(0), '12 AM')
assert.equal(fmtHour12(13), '1 PM')

assert.equal(fmtDuration(30), '30m')
assert.equal(fmtDuration(60), '1h')
assert.equal(fmtDuration(90), '1h 30m')
assert.equal(fmtDuration(0), '')

assert.equal(longDate(new Date(2026, 8, 3)), 'Thursday, September 3')
assert.equal(shortDate(new Date(2026, 8, 3)), 'Thu, Sep 3')

// --- minute <-> parts round trip, for the three-column picker ---
assert.deepEqual(timeParts(0), { h: 12, m: 0, ap: 'AM' })
assert.deepEqual(timeParts(720), { h: 12, m: 0, ap: 'PM' })
assert.deepEqual(timeParts(785), { h: 1, m: 5, ap: 'PM' })
for (let v = 0; v < 1440; v += 5) {
  const p = timeParts(v)
  assert.equal(toMinutes(p.h, p.m, p.ap), v, `round trip failed at ${v}`)
}

assert.equal(minutesOf(new Date(2026, 8, 3, 14, 30)), 870)
const c = combine(new Date(2026, 8, 3), 870)
assert.equal(c.getHours(), 14)
assert.equal(c.getMinutes(), 30)
assert.equal(c.getDate(), 3)

console.log('datetime.check.ts: all assertions passed')
