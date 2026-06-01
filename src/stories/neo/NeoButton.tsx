import { useState, type ReactNode } from 'react'
import { elevation, KIT_BLUE, TEXT_FONT } from '@/lib/neumorphism'
import { Icon, type IconName } from '@/components/icons'
import { useNeoTheme } from './NeoTheme'

export type NeoButtonProps = {
  children?: ReactNode
  /** Hugeicons name (see src/components/icons.tsx). */
  icon?: IconName
  /** Which side the icon sits on (ignored when iconOnly). */
  iconPosition?: 'left' | 'right'
  /** Square button showing only the icon. */
  iconOnly?: boolean
  /** Tint the label + icon with the AiKit blue accent. */
  accent?: boolean
  /** 'default' = neumorphic plate, 'solid' = filled (the dark action button). */
  tone?: 'default' | 'solid'
  /** Fill colour when tone="solid". Defaults to the neutral slate. */
  fill?: string
  size?: 'sm' | 'md' | 'lg'
  /** elevation() distance — how far the plate floats / sinks (px). */
  distance?: number
  /** elevation() blur — softness of the relief (px). */
  blur?: number
  /** elevation() corner radius (px). Overrides the size default. */
  radius?: number
  disabled?: boolean
  onClick?: () => void
}

const SIZES = {
  sm: { padding: '10px 20px', fontSize: 15, radius: 14, icon: 18, square: 40 },
  md: { padding: '14px 28px', fontSize: 18, radius: 18, icon: 22, square: 52 },
  lg: { padding: '18px 36px', fontSize: 22, radius: 22, icon: 28, square: 64 },
} as const

/** Filled slate used by the dark action button (close / hang-up). */
const SOLID_FILL = '#6c7a8d'

/**
 * NeoButton — a pressable neumorphic button.
 * ──────────────────────────────────────────
 * Idle it sits raised; while pressed it sinks into a recessed plate, reading as
 * a physical push. Optionally carries a Hugeicon (left / right / icon-only).
 * Re-lit live by the active NeoTheme.
 */
export function NeoButton({
  children,
  icon,
  iconPosition = 'left',
  iconOnly = false,
  accent = false,
  tone = 'default',
  fill = SOLID_FILL,
  size = 'md',
  distance = 6,
  blur = 12,
  radius,
  disabled = false,
  onClick,
}: NeoButtonProps) {
  const theme = useNeoTheme()
  const [pressed, setPressed] = useState(false)
  const s = SIZES[size]
  const solid = tone === 'solid'
  const color = solid ? '#ffffff' : accent ? KIT_BLUE : theme.textStrong

  const plate = elevation(theme, {
    depth: pressed ? 'recessed' : 'raised',
    distance,
    blur,
    radius: radius ?? (iconOnly ? Math.round(s.square / 2) : s.radius),
  })

  const glyph = icon ? <Icon name={icon} size={s.icon} color={color} /> : null

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
      style={{
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontSize: s.fontSize,
        fontFamily: TEXT_FONT,
        fontWeight: 600,
        letterSpacing: -0.3,
        color,
        transition: 'box-shadow 0.12s ease, transform 0.12s ease',
        transform: pressed ? 'translateY(1px)' : 'none',
        ...(iconOnly
          ? { width: s.square, height: s.square, padding: 0 }
          : { padding: s.padding }),
        ...plate,
        ...(solid ? { backgroundColor: fill } : null),
      }}
    >
      {iconOnly ? (
        glyph
      ) : (
        <>
          {iconPosition === 'left' && glyph}
          {children}
          {iconPosition === 'right' && glyph}
        </>
      )}
    </button>
  )
}
