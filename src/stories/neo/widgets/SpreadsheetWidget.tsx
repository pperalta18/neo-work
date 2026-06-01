import { Fragment } from 'react'
import { elevation, KIT_BLUE, TEXT_FONT } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

export type CellValue = string | number

export type SpreadsheetColumn = {
  /** Header text. Defaults to the spreadsheet letter (A, B, C…). */
  label?: string
  /** Text alignment for this column. Defaults to right for numbers, left otherwise. */
  align?: 'left' | 'center' | 'right'
  /** Fixed column width (px). */
  width?: number
}

export type SpreadsheetWidgetProps = {
  /** Name shown in the title strip (like a workbook / sheet tab). */
  title?: string
  /** Per-column config. Extra data columns fall back to defaults. */
  columns?: SpreadsheetColumn[]
  /** Row-major cell values. */
  data?: CellValue[][]
  /** Active cell as `[row, col]` (0-indexed into `data`); gets the blue outline. */
  selected?: [number, number] | null
  /** Render the A/B/C column header + 1/2/3 row gutter (the Excel chrome). */
  chrome?: boolean
  /** Emphasise the first data row as a header (bold). */
  headerRow?: boolean
  /** Show the formula bar (name box + active value) above the grid. */
  formulaBar?: boolean
}

const DEFAULT_DATA: CellValue[][] = [
  ['Region', 'Q1', 'Q2', 'Q3'],
  ['North', 1240, 1580, 1720],
  ['South', 980, 1110, 1340],
  ['East', 1505, 1490, 1610],
  ['West', 760, 920, 1080],
]

/** 0 → A, 1 → B … 26 → AA (Excel column letters). */
function colLetter(index: number): string {
  let s = ''
  let i = index + 1
  while (i > 0) {
    const m = (i - 1) % 26
    s = String.fromCharCode(65 + m) + s
    i = Math.floor((i - 1) / 26)
  }
  return s
}

const ROW_H = 30
const GUTTER_W = 34

/**
 * SpreadsheetWidget — a neumorphic Excel-style table.
 * ─────────────────────────────────────────────────────
 * A recessed sheet sunk into a NeoCard: an A/B/C column header, a numbered row
 * gutter, faint cell gridlines and a single active cell drawn with the blue
 * accent (outline + fill handle), with its column/row headers tinted to match —
 * the way a spreadsheet highlights the selection. Numbers right-align by default.
 */
export function SpreadsheetWidget({
  title = 'Revenue.xlsx',
  columns = [],
  data = DEFAULT_DATA,
  selected = [3, 2],
  chrome = true,
  headerRow = true,
  formulaBar = true,
}: SpreadsheetWidgetProps) {
  const theme = useNeoTheme()
  const sheet = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 16 })
  const nameBox = elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: 8 })

  const colCount = data.reduce((n, row) => Math.max(n, row.length), 0)
  const colOf = (c: number): SpreadsheetColumn => columns[c] ?? {}
  const [selRow, selCol] = selected ?? [-1, -1]

  const alignOf = (value: CellValue, c: number): 'left' | 'center' | 'right' =>
    colOf(c).align ?? (typeof value === 'number' ? 'right' : 'left')

  const cellRef = selected ? `${colLetter(selCol)}${selRow + 1}` : ''
  const cellValue = selected ? (data[selRow]?.[selCol] ?? '') : ''

  // A header background tinted toward blue when its column/row is the active one.
  const tint = (active: boolean) =>
    active ? `${KIT_BLUE}1f` : 'transparent'

  return (
    <NeoCard width={460} center={false} padding={18} radius={26} style={{ gap: 14 }}>
      {/* Title strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 9, height: 9, borderRadius: 2, background: KIT_BLUE }} />
        <span style={{ fontSize: 14, color: theme.textStrong }}>{title}</span>
      </div>

      {/* Formula bar: name box (active ref) + the active cell's value. */}
      {formulaBar && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              minWidth: 56,
              padding: '6px 12px',
              fontSize: 13,
              textAlign: 'center',
              color: cellRef ? theme.textStrong : theme.textMuted,
              ...nameBox,
            }}
          >
            {cellRef || '—'}
          </div>
          <span style={{ fontSize: 13, color: theme.textMuted, fontStyle: 'italic' }}>fx</span>
          <div
            style={{
              flex: 1,
              padding: '6px 14px',
              fontSize: 13,
              color: theme.textStrong,
              ...nameBox,
            }}
          >
            {String(cellValue)}
          </div>
        </div>
      )}

      {/* Sheet */}
      <div style={{ padding: 8, ...sheet }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${chrome ? `${GUTTER_W}px ` : ''}${Array.from({ length: colCount })
              .map((_, c) => (colOf(c).width ? `${colOf(c).width}px` : '1fr'))
              .join(' ')}`,
            fontFamily: TEXT_FONT,
            fontSize: 13,
            color: theme.textStrong,
            borderTop: `1px solid ${theme.gridLine}`,
            borderLeft: `1px solid ${theme.gridLine}`,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {/* Column header row (A, B, C…) */}
          {chrome && (
            <Fragment>
              <HeaderCell theme={theme} corner />
              {Array.from({ length: colCount }).map((_, c) => (
                <HeaderCell key={`col-${c}`} theme={theme} background={tint(c === selCol)}>
                  {colOf(c).label ?? colLetter(c)}
                </HeaderCell>
              ))}
            </Fragment>
          )}

          {/* Data rows */}
          {data.map((row, r) => (
            <Fragment key={`row-${r}`}>
              {chrome && (
                <HeaderCell theme={theme} background={tint(r === selRow)}>
                  {r + 1}
                </HeaderCell>
              )}
              {Array.from({ length: colCount }).map((_, c) => {
                const value = row[c] ?? ''
                const active = r === selRow && c === selCol
                const isHeaderRow = headerRow && r === 0
                return (
                  <div
                    key={`cell-${r}-${c}`}
                    style={{
                      position: 'relative',
                      height: ROW_H,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent:
                        alignOf(value, c) === 'right'
                          ? 'flex-end'
                          : alignOf(value, c) === 'center'
                            ? 'center'
                            : 'flex-start',
                      padding: '0 8px',
                      borderRight: `1px solid ${theme.gridLine}`,
                      borderBottom: `1px solid ${theme.gridLine}`,
                      fontWeight: isHeaderRow ? 600 : 400,
                      color: isHeaderRow ? theme.textStrong : theme.textStrong,
                      background: isHeaderRow ? `${theme.textMuted}14` : 'transparent',
                      boxShadow: active ? `inset 0 0 0 2px ${KIT_BLUE}` : undefined,
                      zIndex: active ? 1 : undefined,
                    }}
                  >
                    {String(value)}
                    {active && (
                      // Excel's fill handle — the little square at the bottom-right.
                      <div
                        style={{
                          position: 'absolute',
                          right: -3,
                          bottom: -3,
                          width: 6,
                          height: 6,
                          background: KIT_BLUE,
                          border: `1px solid ${theme.surface}`,
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </NeoCard>
  )
}

/** A grey chrome cell: the A/B/C column header, the 1/2/3 gutter, or the corner. */
function HeaderCell({
  theme,
  children,
  corner = false,
  background = 'transparent',
}: {
  theme: ReturnType<typeof useNeoTheme>
  children?: CellValue
  corner?: boolean
  background?: string
}) {
  return (
    <div
      style={{
        height: ROW_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 6px',
        fontSize: 11,
        color: theme.textMuted,
        background: corner ? `${theme.textMuted}14` : background,
        borderRight: `1px solid ${theme.gridLine}`,
        borderBottom: `1px solid ${theme.gridLine}`,
      }}
    >
      {children}
    </div>
  )
}
