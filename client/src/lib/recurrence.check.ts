import assert from 'node:assert/strict'
import { REPEATS, repeatLabel } from './recurrence.ts'

// Every preset round-trips: picking one and re-labelling it gives its own label
// back, which is what keeps the sheet's summary row honest.
for (const r of REPEATS) {
  assert.equal(repeatLabel(r.freq, r.interval), r.label)
}

// Rules the sheet cannot produce still have to read as something.
assert.equal(repeatLabel('Daily', 3), 'Every 3 days')
assert.equal(repeatLabel('Weekly', 6), 'Every 6 weeks')
assert.equal(repeatLabel('Monthly', 2), 'Every 2 months')

// A one-off ignores whatever interval came with it.
assert.equal(repeatLabel(null, 4), 'Never')

console.log('recurrence.check.ts: all assertions passed')
