import {
  createContext,
  useContext,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { CELL, lightTheme, type NeoTheme } from '@/lib/neumorphism'

/**
 * Grid — the composition surface.
 * ───────────────────────────────
 * A coordinate space of `columns × rows` cells. Content is placed with <Cell>
 * by (col, row) and can span multiple columns / rows. Built on CSS Grid, so
 * tracks can be uniform (`cell`) or resized individually (`columnSizes` /
 * `rowSizes`) — that's what makes it scalable: enlarge a track to make room.
 */

type GridContextValue = {
  theme: NeoTheme
  cell: number
  gridlines: boolean
}

const GridContext = createContext<GridContextValue>({
  theme: lightTheme,
  cell: CELL,
  gridlines: true,
})

export function useGrid() {
  return useContext(GridContext)
}

function track(size: number | string) {
  return typeof size === 'number' ? `${size}px` : size
}

export type GridProps = {
  columns: number
  rows: number
  /** Uniform cell edge in px. Defaults to 128 (the Figma module). */
  cell?: number
  /** Per-column sizes (px or CSS length). Overrides `cell` for those columns. */
  columnSizes?: Array<number | string>
  /** Per-row sizes. Overrides `cell` for those rows. */
  rowSizes?: Array<number | string>
  theme?: NeoTheme
  /** Draw the faint hairline grid. */
  gridlines?: boolean
  /** Wrap the grid in a rounded frame (the soft tray panel). */
  frame?: boolean
  /** Corner radius of the frame. */
  frameRadius?: number
  children?: ReactNode
  style?: CSSProperties
}

export function Grid({
  columns,
  rows,
  cell = CELL,
  columnSizes,
  rowSizes,
  theme = lightTheme,
  gridlines = true,
  frame = false,
  frameRadius = 28,
  children,
  style,
}: GridProps) {
  const templateColumns = Array.from({ length: columns }, (_, i) =>
    track(columnSizes?.[i] ?? cell),
  ).join(' ')
  const templateRows = Array.from({ length: rows }, (_, i) =>
    track(rowSizes?.[i] ?? cell),
  ).join(' ')

  return (
    <GridContext.Provider value={{ theme, cell, gridlines }}>
      <div
        data-grid
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: templateColumns,
          gridTemplateRows: templateRows,
          width: 'fit-content',
          ...(frame
            ? {
                borderRadius: frameRadius,
                boxShadow: `inset 0 0 0 1px ${theme.gridLine}, 0 18px 50px -20px ${theme.shadow}`,
              }
            : null),
          ...style,
        }}
      >
        {gridlines ? (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage: `linear-gradient(to right, ${theme.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${theme.gridLine} 1px, transparent 1px)`,
              backgroundSize: `${cell}px ${cell}px`,
              borderRadius: frame ? frameRadius : 0,
            }}
          />
        ) : null}
        {children}
      </div>
    </GridContext.Provider>
  )
}
