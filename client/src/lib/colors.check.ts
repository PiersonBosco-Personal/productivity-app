import assert from 'node:assert/strict'
import { PALETTE, hueToHex, withAlpha, nextPaletteColor } from './colors.ts'

assert.equal(PALETTE.length, 12)
for (const c of PALETTE) {
  assert.match(c, /^#[0-9A-Fa-f]{6}$/, `${c} is not a #rrggbb hex`)
}
assert.equal(new Set(PALETTE).size, 12, 'palette has duplicates')

// Hue is free; lightness and saturation are pinned, so no hue can produce
// something invisible on either theme.
for (let h = 0; h < 360; h += 7) {
  const hex = hueToHex(h)
  assert.match(hex, /^#[0-9a-f]{6}$/, `${hex} is not a #rrggbb hex`)
  const n = parseInt(hex.slice(1), 16)
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
  assert.ok(lum > 0.15, `hue ${h} -> ${hex} is too dark (lum ${lum})`)
  assert.ok(lum < 0.85, `hue ${h} -> ${hex} is too light (lum ${lum})`)
}

assert.equal(withAlpha('#3E63DD', 0.1), 'rgb(62 99 221 / 0.1)')
assert.equal(withAlpha('#FFFFFF', 1), 'rgb(255 255 255 / 1)')

// A new calendar takes the first palette colour nobody is using yet.
assert.equal(nextPaletteColor([]), PALETTE[0])
assert.equal(nextPaletteColor([PALETTE[0], PALETTE[1]]), PALETTE[2])
assert.equal(nextPaletteColor(PALETTE), PALETTE[0], 'must wrap when all are taken')

console.log('colors.check.ts: all assertions passed')
