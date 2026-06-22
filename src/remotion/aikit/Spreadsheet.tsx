import { Fragment, type CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { elevation, KIT_BLUE, TEXT_FONT, lightTheme, type NeoTheme } from '@/lib/neumorphism'
import { DUR, ease } from '../motion'
import {
  type CellValue,
  type CellWrite,
  cellRef,
  colLetter,
  sheetColCount,
  sheetSelectionAt,
  sheetValuesAt,
} from './widgetScript'

export type SpreadsheetColumn = {
  /** Header text. Defaults to the spreadsheet letter (A, B, C…). */
  label?: string
  /** Text alignment for this column. Defaults to right for numbers, left otherwise. */
  align?: 'left' | 'center' | 'right'
  /** Fixed column width (px). */
  width?: number
}

export type SpreadsheetProps = {
  /** Name shown in the title strip (like a workbook / sheet tab). */
  title?: string
  /** The grid before any write lands. Row 0 may be a header (see headerRow). */
  base: readonly (readonly CellValue[])[]
  /** Frame-driven pastes — see widgetScript.ts. The selection follows them. */
  writes?: readonly CellWrite[]
  /** Static selection override; omit to follow the writes (null = none). */
  selected?: [number, number] | null
  /** Per-column config. Extra data columns fall back to defaults. */
  columns?: SpreadsheetColumn[]
  /** Render the A/B/C column header + 1/2/3 row gutter (the Excel chrome). */
  chrome?: boolean
  /** Emphasise the first data row as a header (bold). */
  headerRow?: boolean
  /** Show the formula bar (name box + active value) above the grid. */
  formulaBar?: boolean
  width?: number
  theme?: NeoTheme
  /** Draw the raised card plate. Turn off inside an AppWindow viewport. */
  plate?: boolean
  /** Plate/strip entrance start. Default 0. */
  enterAt?: number
  /** Local frame override; defaults to useCurrentFrame() (wrap in <Sequence> to offset). */
  frame?: number
  style?: CSSProperties
}

const ROW_H = 30
const GUTTER_W = 34

/**
 * Spreadsheet — SpreadsheetWidget ported inline, frame-driven.
 * ────────────────────────────────────────────────────────────
 * The modes Prod01/Prod02 use: the Excel chrome (A/B/C header, numbered
 * gutter, formula bar) around a recessed sheet whose active cell follows a
 * script of `writes` — each paste lands its value with a quick settle and
 * moves the blue selection (+ fill handle, tinted headers, name box) there,
 * exactly the click-by-click / cascade rhythm the pieces need. Themed by
 * prop, deterministic per frame.
 */
export function Spreadsheet({
  title = 'Presupuesto.xlsx',
  base,
  writes = [],
  selected,
  columns = [],
  chrome = true,
  headerRow = true,
  formulaBar = true,
  width = 460,
  theme = lightTheme,
  plate = true,
  enterAt = 0,
  frame: frameProp,
  style,
}: SpreadsheetProps) {
  const globalFrame = useCurrentFrame()
  const frame = frameProp ?? globalFrame

  const data = sheetValuesAt(base, writes, frame)
  const sel = selected !== undefined ? selected : sheetSelectionAt(writes, frame)
  const [selRow, selCol] = sel ?? [-1, -1]

  // Latest landed write per cell, for the paste-settle pose.
  const landed = new Map<string, CellWrite>()
  for (const w of writes) {
    if (frame < w.at) continue
    const key = `${w.cell[0]}:${w.cell[1]}`
    const prev = landed.get(key)
    if (!prev || w.at >= prev.at) landed.set(key, w)
  }

  const colCount = sheetColCount(base)
  const colOf = (c: number): SpreadsheetColumn => columns[c] ?? {}
  const alignOf = (value: CellValue, c: number): 'left' | 'center' | 'right' =>
    colOf(c).align ?? (typeof value === 'number' ? 'right' : 'left')

  const ref = sel ? cellRef([selRow, selCol]) : ''
  const refValue = sel ? (data[selRow]?.[selCol] ?? '') : ''

  // A header background tinted toward blue when its column/row is the active one.
  const tint = (active: boolean) => (active ? `${KIT_BLUE}1f` : 'transparent')

  const enter = ease(frame, enterAt, enterAt + DUR.reveal)
  const card = plate
    ? elevation(theme, { depth: 'raised', distance: 10, blur: 22, radius: 26 })
    : {}
  const sheet = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 16 })
  const nameBox = elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: 8 })

  return (
    <div
      style={{
        width,
        boxSizing: 'border-box',
        padding: plate ? 18 : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: TEXT_FONT,
        ...card,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 16}px)`,
        ...style,
      }}
    >
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
              boxSizing: 'border-box',
              padding: '6px 12px',
              fontSize: 13,
              textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
              color: ref ? theme.textStrong : theme.textMuted,
              ...nameBox,
            }}
          >
            {ref || '—'}
          </div>
          <span style={{ fontSize: 13, color: theme.textMuted, fontStyle: 'italic' }}>fx</span>
          <div
            style={{
              flex: 1,
              boxSizing: 'border-box',
              padding: '6px 14px',
              fontSize: 13,
              color: theme.textStrong,
              ...nameBox,
            }}
          >
            {String(refValue)}
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
                const write = landed.get(`${r}:${c}`)
                // A pasted value settles in: quick fade + drop, no bounce.
                const land = write ? ease(frame, write.at, write.at + DUR.quick) : 1
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
                      color: theme.textStrong,
                      background: isHeaderRow ? `${theme.textMuted}14` : 'transparent',
                      boxShadow: active ? `inset 0 0 0 2px ${KIT_BLUE}` : undefined,
                      zIndex: active ? 1 : undefined,
                    }}
                  >
                    <span
                      style={{
                        opacity: land,
                        transform: `translateY(${(1 - land) * 4}px)`,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {String(value)}
                    </span>
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
    </div>
  )
}

/** A grey chrome cell: the A/B/C column header, the 1/2/3 gutter, or the corner. */
function HeaderCell({
  theme,
  children,
  corner = false,
  background = 'transparent',
}: {
  theme: NeoTheme
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
