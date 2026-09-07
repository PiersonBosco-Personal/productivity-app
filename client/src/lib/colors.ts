// Calendar colours are the only saturated colour in the app, so they are curated
// rather than free. Imports nothing, so colors.check.ts can run under Node.

// Twelve hues at comparable lightness and chroma: none disappears on either
// theme, and no two of them clash side by side.
export const PALETTE = [
  '#E5484D', '#F76B15', '#FFB224', '#30A46C', '#12A594', '#00A2C7',
  '#3E63DD', '#5B5BD6', '#8E4EC6', '#D6409F', '#AD7F58', '#7C8296',
]

// The band the custom picker is confined to. Hue is the only free axis, which
// is what stops a user picking white, black, or neon.
const CUSTOM_SATURATION = 0.62
const CUSTOM_LIGHTNESS = 0.52

export function hueToHex(hue: number): string {
  const a = CUSTOM_SATURATION * Math.min(CUSTOM_LIGHTNESS, 1 - CUSTOM_LIGHTNESS)
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12
    const v = CUSTOM_LIGHTNESS - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
    return Math.round(255 * v).toString(16).padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

// Modern space-separated CSS colour, so it composes with a var() alpha.
export function withAlpha(hex: string, alpha: number | string): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${alpha})`
}

export function nextPaletteColor(taken: string[]): string {
  const used = new Set(taken.map((c) => c.toUpperCase()))
  return PALETTE.find((c) => !used.has(c.toUpperCase())) ?? PALETTE[0]
}
