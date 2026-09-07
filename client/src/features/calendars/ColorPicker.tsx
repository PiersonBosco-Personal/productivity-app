import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { PALETTE, hueToHex } from '@/lib/colors'

// Twelve curated swatches plus one custom cell. The custom slider moves hue
// only — lightness and saturation are pinned in hueToHex — so no choice can
// produce a colour that disappears on either theme.
export function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (hex: string) => void
}) {
  const [custom, setCustom] = useState(() => !PALETTE.includes(value))
  const [hue, setHue] = useState(266)

  return (
    <>
      <div className="grid grid-cols-6 gap-2.5 pt-3 pb-1">
        {PALETTE.map((hex) => (
          <button
            key={hex}
            type="button"
            aria-label={hex}
            onClick={() => {
              setCustom(false)
              onChange(hex)
            }}
            className={`relative grid aspect-square place-items-center rounded-full ${
              !custom && value === hex ? 'outline-2 outline-offset-[3px] outline-foreground' : ''
            }`}
          >
            <span className="size-full rounded-full" style={{ background: hex }} />
          </button>
        ))}
        <button
          type="button"
          aria-label="Custom colour"
          onClick={() => {
            setCustom(true)
            onChange(hueToHex(hue))
          }}
          className={`relative grid aspect-square place-items-center rounded-full ${
            custom ? 'outline-2 outline-offset-[3px] outline-foreground' : ''
          }`}
          style={{
            background:
              'conic-gradient(#E5484D,#F76B15,#FFB224,#30A46C,#00A2C7,#3E63DD,#8E4EC6,#D6409F,#E5484D)',
          }}
        >
          <Sparkles className="size-3.5 text-white" strokeWidth={2.4} />
        </button>
      </div>

      {custom && (
        <div className="pt-3.5 pb-0.5">
          <input
            type="range"
            min={0}
            max={360}
            value={hue}
            aria-label="Hue"
            onChange={(e) => {
              const h = Number(e.target.value)
              setHue(h)
              onChange(hueToHex(h))
            }}
            className="h-3 w-full appearance-none rounded-full [&::-webkit-slider-thumb]:size-[22px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgb(0_0_0/0.1),0_2px_6px_rgb(0_0_0/0.3)]"
            style={{
              background:
                'linear-gradient(90deg,#E5484D,#F76B15,#FFB224,#8BC34A,#30A46C,#12A594,#00A2C7,#3E63DD,#5B5BD6,#8E4EC6,#D6409F,#E5484D)',
            }}
          />
          <p className="mt-2 text-xs leading-[1.45] text-subtle">
            Lightness and saturation are fixed to the palette's band, so a custom colour can never be
            invisible on either theme.
          </p>
        </div>
      )}
    </>
  )
}
