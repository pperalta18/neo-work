import { describe, expect, it } from 'vitest'
import {
  CHART_VB,
  type CellValue,
  type CellWrite,
  ROW_ENTER,
  cellRef,
  chartPoints,
  colLetter,
  countUp,
  euro,
  frontPop,
  invoiceSchedule,
  invoiceTotals,
  INVOICE_HEADER_LEAD,
  rowPresence,
  sheetColCount,
  sheetSelectionAt,
  sheetValuesAt,
  smoothPath,
  validateSheetWrites,
  writeCascade,
} from './widgetScript'

/* ── Spreadsheet ──────────────────────────────────────────────────────── */

const BASE: CellValue[][] = [
  ['Concepto', 'Uds', 'Precio'],
  ['Diseño', 1, ''],
  ['Web', '', ''],
]

const WRITES: CellWrite[] = [
  { at: 10, cell: [1, 2], value: 1200 },
  { at: 30, cell: [2, 1], value: 3 },
  { at: 50, cell: [2, 2], value: 240 },
]

describe('sheetColCount', () => {
  it('returns the widest row', () => {
    expect(sheetColCount(BASE)).toBe(3)
    expect(sheetColCount([[1], [1, 2, 3, 4]])).toBe(4)
    expect(sheetColCount([])).toBe(0)
  })
})

describe('sheetValuesAt', () => {
  it('is the base grid before any write lands', () => {
    expect(sheetValuesAt(BASE, WRITES, 9)).toEqual(BASE)
  })

  it('applies exactly the landed writes at the frame', () => {
    const at30 = sheetValuesAt(BASE, WRITES, 30)
    expect(at30[1][2]).toBe(1200)
    expect(at30[2][1]).toBe(3)
    expect(at30[2][2]).toBe('') // lands at 50
  })

  it('applies every write once all have landed', () => {
    const done = sheetValuesAt(BASE, WRITES, 1000)
    expect(done[1][2]).toBe(1200)
    expect(done[2][1]).toBe(3)
    expect(done[2][2]).toBe(240)
  })

  it('does not mutate the base grid', () => {
    const snapshot = BASE.map((r) => [...r])
    sheetValuesAt(BASE, WRITES, 1000)
    expect(BASE).toEqual(snapshot)
  })

  it('pads a ragged short row so a paste can fill a blank cell', () => {
    const ragged: CellValue[][] = [['a', 'b', 'c'], ['x']]
    const grid = sheetValuesAt(ragged, [{ at: 0, cell: [1, 2], value: 9 }], 0)
    expect(grid[1]).toEqual(['x', '', 9])
  })

  it('ignores out-of-bounds writes', () => {
    const grid = sheetValuesAt(BASE, [{ at: 0, cell: [9, 0], value: 'x' }], 100)
    expect(grid).toEqual(BASE)
  })

  it('lets a later write overwrite an earlier one on the same cell', () => {
    const twice: CellWrite[] = [
      { at: 5, cell: [1, 2], value: 'old' },
      { at: 20, cell: [1, 2], value: 'new' },
    ]
    expect(sheetValuesAt(BASE, twice, 10)[1][2]).toBe('old')
    expect(sheetValuesAt(BASE, twice, 20)[1][2]).toBe('new')
  })
})

describe('sheetSelectionAt', () => {
  it('is null before the first write lands', () => {
    expect(sheetSelectionAt(WRITES, 9)).toBeNull()
    expect(sheetSelectionAt([], 1000)).toBeNull()
  })

  it('follows the latest landed write', () => {
    expect(sheetSelectionAt(WRITES, 10)).toEqual([1, 2])
    expect(sheetSelectionAt(WRITES, 49)).toEqual([2, 1])
    expect(sheetSelectionAt(WRITES, 50)).toEqual([2, 2])
  })

  it('breaks at ties by script order (later = newer)', () => {
    const tie: CellWrite[] = [
      { at: 10, cell: [0, 0], value: 'a' },
      { at: 10, cell: [0, 1], value: 'b' },
    ]
    expect(sheetSelectionAt(tie, 10)).toEqual([0, 1])
  })
})

describe('writeCascade', () => {
  it('staggers the paste run from startAt', () => {
    const run = writeCascade(
      [
        { cell: [0, 0], value: 1 },
        { cell: [0, 1], value: 2 },
        { cell: [0, 2], value: 3 },
      ],
      { startAt: 100, stagger: 5 },
    )
    expect(run.map((w) => w.at)).toEqual([100, 105, 110])
    expect(run[1]).toMatchObject({ cell: [0, 1], value: 2 })
  })

  it('defaults to startAt 0 / stagger 8', () => {
    const run = writeCascade([{ cell: [0, 0], value: 1 }, { cell: [1, 1], value: 2 }])
    expect(run.map((w) => w.at)).toEqual([0, 8])
  })
})

describe('validateSheetWrites', () => {
  it('accepts a well-formed script', () => {
    expect(validateSheetWrites(BASE, WRITES)).toEqual([])
  })

  it('rejects out-of-bounds cells and negative frames', () => {
    expect(validateSheetWrites(BASE, [{ at: 0, cell: [3, 0], value: 1 }])).toHaveLength(1)
    expect(validateSheetWrites(BASE, [{ at: 0, cell: [0, 3], value: 1 }])).toHaveLength(1)
    expect(validateSheetWrites(BASE, [{ at: -1, cell: [0, 0], value: 1 }])).toHaveLength(1)
  })
})

describe('colLetter / cellRef', () => {
  it('produces Excel column letters', () => {
    expect(colLetter(0)).toBe('A')
    expect(colLetter(25)).toBe('Z')
    expect(colLetter(26)).toBe('AA')
    expect(colLetter(27)).toBe('AB')
  })

  it('names a cell like the name box', () => {
    expect(cellRef([0, 0])).toBe('A1')
    expect(cellRef([3, 2])).toBe('C4')
  })
})

/* ── Inbox ────────────────────────────────────────────────────────────── */

describe('rowPresence', () => {
  it('a row without showAt is simply there', () => {
    expect(rowPresence(undefined, 0)).toBe(1)
  })

  it('rises 0→1 across [showAt, showAt + ROW_ENTER], clamped', () => {
    expect(rowPresence(40, 39)).toBe(0)
    expect(rowPresence(40, 40)).toBe(0)
    expect(rowPresence(40, 40 + ROW_ENTER)).toBe(1)
    expect(rowPresence(40, 10_000)).toBe(1)
  })

  it('eases out and grows monotonically', () => {
    expect(rowPresence(0, ROW_ENTER / 2)).toBeGreaterThan(0.5)
    let prev = -1
    for (let f = -2; f <= ROW_ENTER + 2; f++) {
      const cur = rowPresence(0, f)
      expect(cur).toBeGreaterThanOrEqual(prev)
      prev = cur
    }
  })
})

/* ── LineChart ────────────────────────────────────────────────────────── */

describe('chartPoints', () => {
  const data = [4200, 3850, 5100, 7400]
  const pts = chartPoints(data)

  it('spaces x evenly across the padded box', () => {
    expect(pts[0].x).toBe(CHART_VB.padX)
    expect(pts[pts.length - 1].x).toBe(CHART_VB.w - CHART_VB.padX)
    const gaps = pts.slice(1).map((p, i) => p.x - pts[i].x)
    for (const g of gaps) expect(g).toBeCloseTo(gaps[0], 6)
  })

  it('maps larger values higher (smaller y) and keeps every point in the band', () => {
    const top = CHART_VB.padTop
    const bottom = CHART_VB.h - CHART_VB.padBottom
    const maxPt = pts[data.indexOf(Math.max(...data))]
    const minPt = pts[data.indexOf(Math.min(...data))]
    expect(maxPt.y).toBeLessThan(minPt.y)
    for (const p of pts) {
      expect(p.y).toBeGreaterThan(top)
      expect(p.y).toBeLessThan(bottom)
    }
  })

  it('keeps the original value on each point', () => {
    expect(pts.map((p) => p.v)).toEqual(data)
  })

  it('does not produce NaN on a constant series', () => {
    for (const p of chartPoints([5, 5, 5])) {
      expect(Number.isFinite(p.y)).toBe(true)
    }
  })
})

describe('smoothPath', () => {
  const pts = [
    { x: 0, y: 10 },
    { x: 50, y: 40 },
    { x: 100, y: 20 },
  ]

  it('starts at the first point and ends at the last', () => {
    const d = smoothPath(pts)
    expect(d.startsWith('M 0.00 10.00')).toBe(true)
    expect(d.endsWith('100.00 20.00')).toBe(true)
  })

  it('emits one cubic segment per span', () => {
    expect(smoothPath(pts).match(/C /g)).toHaveLength(2)
  })

  it('is empty for fewer than two points', () => {
    expect(smoothPath([])).toBe('')
    expect(smoothPath([{ x: 1, y: 1 }])).toBe('')
  })
})

describe('frontPop', () => {
  it('is 0 before the front reaches x and 1 once it is span past', () => {
    expect(frontPop(99, 100)).toBe(0)
    expect(frontPop(100, 100)).toBe(0)
    expect(frontPop(124, 100, 24)).toBe(1)
    expect(frontPop(10_000, 100)).toBe(1)
  })

  it('rises monotonically through the span', () => {
    let prev = -1
    for (let rx = 90; rx <= 130; rx += 2) {
      const cur = frontPop(rx, 100, 24)
      expect(cur).toBeGreaterThanOrEqual(prev)
      prev = cur
    }
  })
})

/* ── count-ups / money ────────────────────────────────────────────────── */

describe('countUp', () => {
  it('holds `from` before startAt and lands exactly on `to`', () => {
    expect(countUp(0, 10, 20, 0, 500)).toBe(0)
    expect(countUp(30, 10, 20, 0, 500)).toBe(500)
    expect(countUp(1000, 10, 20, 0, 500)).toBe(500)
  })

  it('eases out (covers more than half early) and is monotonic upward', () => {
    expect(countUp(20, 10, 20, 0, 100)).toBeGreaterThan(50)
    let prev = -1
    for (let f = 0; f <= 40; f++) {
      const cur = countUp(f, 10, 20, 0, 100)
      expect(cur).toBeGreaterThanOrEqual(prev)
      prev = cur
    }
  })

  it('counts downward too', () => {
    expect(countUp(30, 10, 20, 100, 40)).toBe(40)
    expect(countUp(15, 10, 20, 100, 40)).toBeLessThan(100)
  })
})

describe('euro', () => {
  it('formats es-ES style: dot thousands, comma decimals', () => {
    expect(euro(1234.5)).toBe('1.234,50')
    expect(euro(1452.0)).toBe('1.452,00')
    expect(euro(987654321)).toBe('987.654.321,00')
  })

  it('respects the decimals argument', () => {
    expect(euro(7.4, 1)).toBe('7,4')
    expect(euro(1200, 0)).toBe('1.200')
  })

  it('marks negatives with a minus sign', () => {
    expect(euro(-980)).toBe('−980,00')
  })
})

/* ── Invoice ──────────────────────────────────────────────────────────── */

const ITEMS = [
  { description: 'Diseño', qty: 1, price: 1200 },
  { description: 'Maquetación', qty: 3, price: 240 },
  { description: 'Fotos', price: 380 }, // qty defaults to 1
]

describe('invoiceTotals', () => {
  it('derives subtotal, tax and total from the lines', () => {
    const { subtotal, tax, total } = invoiceTotals(ITEMS, 0.21)
    expect(subtotal).toBe(1200 + 720 + 380)
    expect(tax).toBeCloseTo(subtotal * 0.21, 6)
    expect(total).toBeCloseTo(subtotal + tax, 6)
  })

  it('is zero across the board for an empty invoice', () => {
    expect(invoiceTotals([], 0.21)).toEqual({ subtotal: 0, tax: 0, total: 0 })
  })
})

describe('invoiceSchedule', () => {
  it('staggers the lines after the header lead', () => {
    const s = invoiceSchedule(3, { enterAt: 100, lineStagger: 10 })
    expect(s.lineAt).toEqual([100 + INVOICE_HEADER_LEAD, 110 + INVOICE_HEADER_LEAD, 120 + INVOICE_HEADER_LEAD])
  })

  it('orders the beat: lines → totals → total count → settled', () => {
    const s = invoiceSchedule(3, { enterAt: 0 })
    const lastLine = s.lineAt[s.lineAt.length - 1]
    expect(s.totalsAt).toBeGreaterThan(lastLine)
    expect(s.totalAt).toBeGreaterThan(s.totalsAt)
    expect(s.settledAt).toBe(s.totalAt + s.countFrames)
  })

  it('still produces a sane beat with zero lines', () => {
    const s = invoiceSchedule(0, { enterAt: 50 })
    expect(s.lineAt).toEqual([])
    expect(s.totalsAt).toBeGreaterThan(50)
    expect(s.settledAt).toBeGreaterThan(s.totalsAt)
  })
})
