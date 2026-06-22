/**
 * widgetScript.ts — pure frame-driven logic for the in-window widget ports.
 * ─────────────────────────────────────────────────────────────────────────
 * The pure half of the six storybook widgets the pieces use inside AppWindow
 * viewports (spec: "Ports inline de widgets"): Spreadsheet, Inbox,
 * CalendarMonth, LineChart, StatTile and Invoice. Only the modes the pieces
 * use are ported. No React, no remotion — every helper is a function of the
 * frame, so the choreography is unit-testable and scenes can sync cursors /
 * cameras against the same numbers the widgets read.
 */

/** Linear 0→1 progress across [start, end], clamped; a collapsed window
 * degrades to a step at `end` (same contract as windowScript.phase). */
const phase = (frame: number, start: number, end: number): number => {
  if (end <= start) return frame >= end ? 1 : 0
  return Math.min(1, Math.max(0, (frame - start) / (end - start)))
}

// House easing without a remotion dep (pure-module rule): decelerate in.
const cubicOut = (t: number) => 1 - (1 - t) ** 3

/* ── Spreadsheet (Prod01 paste-by-paste · Prod02 cascade) ─────────────── */

export type CellValue = string | number

export type CellWrite = {
  /** Frame the value lands in the cell (the paste beat). */
  at: number
  /** Target cell as [row, col], 0-indexed into the base grid. */
  cell: readonly [number, number]
  /** The pasted value. */
  value: CellValue
}

/** Widest row of the base grid — the column count the sheet renders. */
export function sheetColCount(base: readonly (readonly CellValue[])[]): number {
  return base.reduce((n, row) => Math.max(n, row.length), 0)
}

/**
 * The grid at `frame`: a copy of `base` with every landed write applied.
 * Writes may target any cell inside the base's row range and column count
 * (ragged short rows are padded with '' so a paste can fill a blank cell);
 * out-of-bounds writes are ignored — catch them with validateSheetWrites.
 */
export function sheetValuesAt(
  base: readonly (readonly CellValue[])[],
  writes: readonly CellWrite[],
  frame: number,
): CellValue[][] {
  const cols = sheetColCount(base)
  const grid = base.map((row) => [...row])
  for (const w of writes) {
    if (frame < w.at) continue
    const [r, c] = w.cell
    if (r < 0 || r >= grid.length || c < 0 || c >= cols) continue
    while (grid[r].length <= c) grid[r].push('')
    grid[r][c] = w.value
  }
  return grid
}

/**
 * The active cell at `frame`: the cell of the latest landed write (`at` ties
 * break by script order — later in the array = newer). Null before any write
 * has landed, so scenes can hold the selection hidden until the first paste.
 */
export function sheetSelectionAt(
  writes: readonly CellWrite[],
  frame: number,
): [number, number] | null {
  let best: CellWrite | null = null
  for (const w of writes) {
    if (frame >= w.at && (best === null || w.at >= best.at)) best = w
  }
  return best ? [best.cell[0], best.cell[1]] : null
}

/** Author a paste run: staggered `at`s over a list of cell/value pairs
 * (Prod01's click-by-click rhythm, Prod02's fast cascade). */
export function writeCascade(
  cells: readonly { cell: readonly [number, number]; value: CellValue }[],
  opts: { startAt?: number; stagger?: number } = {},
): CellWrite[] {
  const startAt = opts.startAt ?? 0
  const stagger = opts.stagger ?? 8
  return cells.map((c, i) => ({ ...c, at: startAt + i * stagger }))
}

/** Sanity-check authored writes against the base grid. Empty = valid. */
export function validateSheetWrites(
  base: readonly (readonly CellValue[])[],
  writes: readonly CellWrite[],
): string[] {
  const cols = sheetColCount(base)
  const errors: string[] = []
  writes.forEach((w, i) => {
    const [r, c] = w.cell
    if (w.at < 0) errors.push(`write ${i} (${cellRef(w.cell)}): at ${w.at} must be ≥ 0`)
    if (r < 0 || r >= base.length || c < 0 || c >= cols) {
      errors.push(`write ${i}: cell [${r}, ${c}] outside the ${base.length}×${cols} grid`)
    }
  })
  return errors
}

/** 0 → A, 1 → B … 26 → AA (Excel column letters). */
export function colLetter(index: number): string {
  let s = ''
  let i = index + 1
  while (i > 0) {
    const m = (i - 1) % 26
    s = String.fromCharCode(65 + m) + s
    i = Math.floor((i - 1) / 26)
  }
  return s
}

/** [3, 2] → 'C4' — the name-box ref of a cell. */
export function cellRef(cell: readonly [number, number]): string {
  return `${colLetter(cell[1])}${cell[0] + 1}`
}

/* ── Inbox (Prod01/Prod02 — the email arrives) ────────────────────────── */

/** Frames of a list row's slide into the inbox. */
export const ROW_ENTER = 12

/** Eased 0→1 presence of a list row at `frame`; rows without a `showAt`
 * are simply already there. Drives height collapse + fade in the visual. */
export function rowPresence(showAt: number | undefined, frame: number): number {
  if (showAt == null) return 1
  return cubicOut(phase(frame, showAt, showAt + ROW_ENTER))
}

/* ── LineChart (Yusta03 economics · Yusta07 la curva) ─────────────────── */

export type ChartVB = { w: number; h: number; padX: number; padTop: number; padBottom: number }

/** SVG drawing box — geometry computed in these units, scaled by CSS. */
export const CHART_VB: ChartVB = { w: 360, h: 150, padX: 6, padTop: 16, padBottom: 26 }

export type ChartPt = { x: number; y: number; v: number }

/** Project a series into the drawing box: x evenly spaced, y on the value
 * band padded so the line never kisses the rim. Constant series sit mid-band. */
export function chartPoints(data: readonly number[], vb: ChartVB = CHART_VB): ChartPt[] {
  const n = Math.max(data.length, 2)
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const innerW = vb.w - vb.padX * 2
  const innerH = vb.h - vb.padTop - vb.padBottom
  return data.map((v, i) => ({
    x: vb.padX + (innerW * i) / (n - 1),
    y: vb.padTop + innerH * (1 - (v - min) / span) * 0.86 + innerH * 0.07,
    v,
  }))
}

/**
 * Smooth a polyline through `pts` into a cubic-bézier path using a
 * Catmull-Rom → bézier conversion. Deterministic, no kinks, endpoints exact.
 * (Absorbed from ChartWidget.)
 */
export function smoothPath(pts: readonly { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  const t = 0.18 // tension — lower is tauter
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) * t
    const c1y = p1.y + (p2.y - p0.y) * t
    const c2x = p2.x - (p3.x - p1.x) * t
    const c2y = p2.y - (p3.y - p1.y) * t
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

/** Eased 0→1 pop of a chart feature (label, peak dot, tooltip) as the draw
 * front at `revealX` passes its `x`, over `span` drawing-box units. */
export function frontPop(revealX: number, x: number, span = 24): number {
  return cubicOut(Math.min(1, Math.max(0, (revealX - x) / span)))
}

/* ── StatTile / Invoice count-ups ─────────────────────────────────────── */

/** Eased numeric count `from`→`to` across [startAt, startAt + frames],
 * clamped at both ends. The amortisation/total counter primitive. */
export function countUp(
  frame: number,
  startAt: number,
  frames: number,
  from: number,
  to: number,
): number {
  return from + (to - from) * cubicOut(phase(frame, startAt, startAt + frames))
}

/** es-ES money digits without Intl (deterministic in node + headless chrome):
 * 1234.5 → '1.234,50'. Prefix the currency symbol yourself. */
export function euro(n: number, decimals = 2): string {
  const neg = n < 0
  const [int, frac] = Math.abs(n).toFixed(decimals).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${neg ? '−' : ''}${grouped}${frac ? `,${frac}` : ''}`
}

/* ── Invoice (Prod01 doc final · Prod02 presupuesto materializándose) ──── */

export type InvoiceLineSpec = {
  /** What was billed. */
  description: string
  /** Units (defaults to 1). */
  qty?: number
  /** Price per unit. */
  price: number
}

/** Subtotal / tax / total derived from the lines, so the maths always adds up. */
export function invoiceTotals(
  items: readonly InvoiceLineSpec[],
  taxRate: number,
): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((sum, it) => sum + it.price * (it.qty ?? 1), 0)
  const tax = subtotal * taxRate
  return { subtotal, tax, total: subtotal + tax }
}

export type InvoiceSchedule = {
  /** Frame the document (header, parties) starts entering. */
  enterAt: number
  /** Frame each line item materialises. */
  lineAt: number[]
  /** Frame the muted subtotal/tax rows appear. */
  totalsAt: number
  /** Frame the big accent total starts counting up. */
  totalAt: number
  /** Frames the total takes to count to its figure. */
  countFrames: number
  /** First frame the invoice is fully at rest — the next beat starts here. */
  settledAt: number
}

/** Frames between the header entering and the first line landing. */
export const INVOICE_HEADER_LEAD = 12

/**
 * Author the materialisation: header → lines staggered → totals → the total
 * counting up. Scenes choreograph (cursor, camera, toasts) against
 * `settledAt`, the same contract as appWindowTimeline.
 */
export function invoiceSchedule(
  lineCount: number,
  opts: { enterAt?: number; lineStagger?: number; totalsGap?: number; countFrames?: number } = {},
): InvoiceSchedule {
  const enterAt = opts.enterAt ?? 0
  const lineStagger = opts.lineStagger ?? 7
  const totalsGap = opts.totalsGap ?? 6
  const countFrames = opts.countFrames ?? 14
  const lineAt = Array.from({ length: lineCount }, (_, i) => enterAt + INVOICE_HEADER_LEAD + i * lineStagger)
  const lastLine = lineCount > 0 ? lineAt[lineCount - 1] : enterAt + INVOICE_HEADER_LEAD
  const totalsAt = lastLine + totalsGap
  const totalAt = totalsAt + 4
  return { enterAt, lineAt, totalsAt, totalAt, countFrames, settledAt: totalAt + countFrames }
}
