import type { CSSProperties, ReactNode } from 'react'
import { elevation, PLATE_INSET, TEXT_FONT, type Depth } from '@/lib/neumorphism'
import { useGrid } from '@/components/Grid'

/**
 * Cell — one placed container inside the Grid.
 * ────────────────────────────────────────────
 * Position it by (col, row) — 1-indexed — and let it span columns / rows.
 * Pick what lives in it:
 *   variant="elevation"  → a neumorphic plate (raised | recessed | flat)
 *   variant="image"      → a full-bleed image / gradient
 *   variant="plain"      → a transparent slot (just occupies space)
 * Anything (text, icons, nested content) goes in `children`.
 */

export type CellProps = {
  col: number
  row: number
  colSpan?: number
  rowSpan?: number
  variant?: 'elevation' | 'image' | 'plain'
  depth?: Depth
  /** elevation tuning */
  distance?: number
  blur?: number
  radius?: number
  /** Inset of the plate inside its cell(s). Defaults to 22px (Figma). */
  inset?: number
  /** image source (variant="image") */
  src?: string
  /** any CSS background (gradient placeholder for images) */
  background?: string
  /** content alignment inside the plate */
  align?: 'center' | 'start' | 'end'
  /** Enable the emergence transition (flat → raised, growing toward the viewer). */
  animate?: boolean
  /** Target state while animating. false = still flat/hidden. Defaults to true. */
  revealed?: boolean
  children?: ReactNode
  style?: CSSProperties
}

const EMERGE_TRANSITION =
  'box-shadow 0.55s ease, transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease'

const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end' } as const

export function Cell({
  col,
  row,
  colSpan = 1,
  rowSpan = 1,
  variant = 'elevation',
  depth = 'raised',
  distance,
  blur,
  radius,
  inset = PLATE_INSET,
  src,
  background,
  align = 'center',
  animate = false,
  revealed = true,
  children,
  style,
}: CellProps) {
  const { theme, gridlines } = useGrid()

  // Emergence: a flat, slightly-shrunk, dim state that transitions up to the
  // raised plate — reads as the piece coming out of the screen toward us.
  const isHidden = animate && !revealed
  const emergeStyle: CSSProperties = animate
    ? {
        transition: EMERGE_TRANSITION,
        transformOrigin: '50% 50%',
        ...(isHidden
          ? { transform: 'scale(0.8)', opacity: 0.25 }
          : { transform: 'scale(1)', opacity: 1 }),
      }
    : {}

  // A cell spanning more than one module must read as a single merged cell, so
  // we paint its whole footprint opaque to hide the internal grid hairlines —
  // but only when the grid actually draws hairlines.
  const isSpan = gridlines && (colSpan > 1 || rowSpan > 1)

  const placement: CSSProperties = {
    gridColumn: `${col} / span ${colSpan}`,
    gridRow: `${row} / span ${rowSpan}`,
    position: 'relative',
  }

  if (variant === 'image') {
    return (
      <div data-cell="image" style={{ ...placement, ...style }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            background: background ?? theme.surface,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            ...(src ? { backgroundImage: `url(${src})` } : null),
            ...emergeStyle,
          }}
        >
          {children}
        </div>
      </div>
    )
  }

  if (variant === 'plain') {
    return (
      <div data-cell="plain" style={{ ...placement, ...style }}>
        {children}
      </div>
    )
  }

  const plate = elevation(theme, { depth, distance, blur, radius })
  // Flat-but-interpolable shadow (same colours, zero offset) so box-shadow can
  // animate smoothly from flat to raised.
  const flatPlate = elevation(theme, { depth, distance: 0, blur: 0, radius })

  return (
    <div
      data-cell="elevation"
      style={{
        ...placement,
        // Merge the span into one cell: opaque fill hides the internal hairlines,
        // and a 1px border redraws the outer frame so it still reads as a cell.
        ...(isSpan
          ? {
              backgroundColor: theme.surface,
              boxShadow: `inset 0 0 0 1px ${theme.gridLine}`,
            }
          : null),
      }}
    >
      <div
        data-depth={depth}
        style={{
          position: 'absolute',
          top: inset,
          left: inset,
          right: inset,
          bottom: inset,
          display: 'flex',
          alignItems: 'center',
          justifyContent: justifyMap[align],
          gap: 10,
          padding: '0 24px',
          color: theme.textStrong,
          fontFamily: TEXT_FONT,
          fontSize: 20,
          lineHeight: '28px',
          letterSpacing: -0.4,
          whiteSpace: 'nowrap',
          ...plate,
          ...emergeStyle,
          ...(isHidden ? { boxShadow: flatPlate.boxShadow } : null),
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  )
}
