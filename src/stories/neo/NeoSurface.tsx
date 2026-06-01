import type { CSSProperties, ReactNode } from 'react'
import { elevation, TEXT_FONT, type Depth } from '@/lib/neumorphism'
import { useNeoTheme } from './NeoTheme'

export type NeoSurfaceProps = {
  /** raised = pops out, recessed = carved in, flat = no relief. */
  depth?: Depth
  /** Shadow offset in px — bigger floats / sinks further. */
  distance?: number
  blur?: number
  radius?: number
  /** Inner padding (px). */
  padding?: number
  align?: 'center' | 'start' | 'end'
  children?: ReactNode
  style?: CSSProperties
}

const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end' } as const

/**
 * NeoSurface — the base neumorphic plate.
 * ───────────────────────────────────────
 * The atom every other neumorphic component is built from. Lit by the active
 * NeoTheme (Storybook toolbar), so flipping the light source re-shades it live.
 */
export function NeoSurface({
  depth = 'raised',
  distance,
  blur,
  radius = 24,
  padding = 28,
  align = 'center',
  children,
  style,
}: NeoSurfaceProps) {
  const theme = useNeoTheme()
  const plate = elevation(theme, { depth, distance, blur, radius })

  return (
    <div
      data-depth={depth}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: justifyMap[align],
        padding,
        color: theme.textStrong,
        fontFamily: TEXT_FONT,
        fontSize: 20,
        lineHeight: '28px',
        letterSpacing: -0.4,
        ...plate,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
