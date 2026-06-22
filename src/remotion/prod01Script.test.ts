import { describe, expect, it } from 'vitest'
import {
  clickLandFrame,
  validateCursorScript,
} from './aikit/cursorScript'
import { validateProgramTempo } from './aikit/programScript'
import {
  euro,
  invoiceTotals,
  sheetValuesAt,
  validateSheetWrites,
} from './aikit/widgetScript'
import { validateCameraRig } from './aikit/cameraScript'
import {
  CIF_CELL,
  ERROR_PASTE_AT,
  ERROR_STEP,
  EXEC_START,
  FIX_AT,
  INVOICE_ITEMS,
  INVOICE_SCHED,
  INVOICE_TAX,
  PROD01_CAM,
  PROD01_CAPTIONS,
  PROD01_COPY,
  PROD01_CURSOR,
  PROD01_DURATION,
  PROD01_SCHEDULE,
  PROD01_STEPS,
  PROD01_TEMPO,
  PROD01_WRITES,
  SENT_AT,
  SHEET_BASE,
  SHEET_COL_W,
  SHEET_WIDGET_W,
  STEP_CLICKS,
  STOPWATCH_POINTS,
  UNDO_AT,
  WRONG_CELL,
  mmss,
  sheetCellCenterLocal,
  stopwatchSeconds,
} from './prod01Script'

describe('the program', () => {
  it('has exactly 50 steps (the spec beat)', () => {
    expect(PROD01_STEPS).toHaveLength(50)
  })

  it('has a valid tempo', () => {
    expect(validateProgramTempo(PROD01_STEPS.length, PROD01_TEMPO)).toEqual([])
  })

  it('starts when execution starts and finishes inside the piece with a held tail', () => {
    expect(PROD01_SCHEDULE.activeAt[0]).toBe(EXEC_START)
    expect(PROD01_SCHEDULE.allDoneAt).toBeLessThanOrEqual(PROD01_DURATION - 120)
  })

  it('accelerates monotonically through the montage', () => {
    const advance = PROD01_TEMPO.advance as (i: number) => number
    for (let i = 18; i <= 40; i++) {
      expect(advance(i)).toBeLessThanOrEqual(advance(i - 1))
    }
  })

  it('gives the error step one long beat', () => {
    const s = PROD01_SCHEDULE
    const gapBefore = s.activeAt[ERROR_STEP] - s.activeAt[ERROR_STEP - 1]
    const gapError = s.activeAt[ERROR_STEP + 1] - s.activeAt[ERROR_STEP]
    expect(gapError).toBeGreaterThan(gapBefore * 3)
  })

  it('runs roughly the spec duration (~60s @30fps)', () => {
    expect(PROD01_DURATION).toBeGreaterThanOrEqual(1500)
    expect(PROD01_DURATION).toBeLessThanOrEqual(1950)
  })
})

describe('the cursor', () => {
  it('is a valid script (ordered, travels fit, clicks settle)', () => {
    expect(validateCursorScript(PROD01_CURSOR)).toEqual([])
  })

  it('lands every step click exactly when its step activates', () => {
    for (const { step, wp } of STEP_CLICKS) {
      const w = PROD01_CURSOR[wp]
      expect(w.click).toBe(true)
      expect(clickLandFrame(w)).toBe(PROD01_SCHEDULE.activeAt[step])
    }
  })

  it('lands the fix click exactly when the corrected CIF is written', () => {
    const fix = PROD01_CURSOR[14]
    expect(fix.click).toBe(true)
    expect(clickLandFrame(fix)).toBe(FIX_AT)
  })

  it('never vanishes — that beat belongs to Prod05', () => {
    for (const wp of PROD01_CURSOR) expect(wp.vanish).toBeUndefined()
  })

  it('rests before the piece ends', () => {
    const last = PROD01_CURSOR[PROD01_CURSOR.length - 1]
    expect(last.at).toBeLessThanOrEqual(PROD01_DURATION - 100)
  })
})

describe('the spreadsheet', () => {
  it('has valid writes against the base grid', () => {
    expect(validateSheetWrites(SHEET_BASE, PROD01_WRITES)).toEqual([])
  })

  it('pastes the CIF in the wrong cell, undoes it, and repastes it right', () => {
    // mid-error: the CIF sits in the wrong (Contacto) row
    const during = sheetValuesAt(SHEET_BASE, PROD01_WRITES, ERROR_PASTE_AT + 10)
    expect(during[WRONG_CELL[0]][WRONG_CELL[1]]).toBe(PROD01_COPY.cif)
    // after the undo: the wrong cell is empty again, the right one still is
    const undone = sheetValuesAt(SHEET_BASE, PROD01_WRITES, UNDO_AT + 5)
    expect(undone[WRONG_CELL[0]][WRONG_CELL[1]]).toBe('')
    expect(undone[CIF_CELL[0]][CIF_CELL[1]]).toBe('')
    // after the fix: the CIF is where it belongs
    const fixed = sheetValuesAt(SHEET_BASE, PROD01_WRITES, FIX_AT + 5)
    expect(fixed[CIF_CELL[0]][CIF_CELL[1]]).toBe(PROD01_COPY.cif)
  })

  it('ends with every figure landed and the Contacto recovered', () => {
    const end = sheetValuesAt(SHEET_BASE, PROD01_WRITES, PROD01_DURATION)
    expect(end[0][1]).toBe('Talleres Riera S.L.')
    expect(end[2][1]).toBe('Lucía Riera')
    expect(end[10][3]).toBe(`${euro(invoiceTotals(INVOICE_ITEMS, INVOICE_TAX).total)} €`)
  })

  it('keeps the sheet numbers and the PDF totals in agreement', () => {
    const t = invoiceTotals(INVOICE_ITEMS, INVOICE_TAX)
    const end = sheetValuesAt(SHEET_BASE, PROD01_WRITES, PROD01_DURATION)
    expect(end[8][3]).toBe(euro(t.subtotal))
    expect(end[9][3]).toBe(euro(t.tax))
    expect(t.total).toBeCloseTo(775.9125)
  })

  it('measures cell centres consistently with the column plan', () => {
    const b1 = sheetCellCenterLocal(0, 1)
    expect(b1.x).toBe(8 + 34 + SHEET_COL_W[0] + SHEET_COL_W[1] / 2)
    expect(b1.y).toBe(82 + 30 + 15)
    expect(SHEET_WIDGET_W).toBe(16 + 34 + 150 + 168 + 94 + 94)
  })
})

describe('the stopwatch', () => {
  it('is zero until execution starts', () => {
    expect(stopwatchSeconds(0)).toBe(0)
    expect(stopwatchSeconds(EXEC_START)).toBe(0)
  })

  it('only ever counts up', () => {
    let prev = -1
    for (let f = 0; f <= PROD01_DURATION; f += 7) {
      const s = stopwatchSeconds(f)
      expect(s).toBeGreaterThanOrEqual(prev)
      prev = s
    }
  })

  it('keeps counting through the error — mistakes cost time', () => {
    expect(stopwatchSeconds(UNDO_AT)).toBeGreaterThan(stopwatchSeconds(ERROR_PASTE_AT) + 10)
  })

  it('freezes at 23:14 when «Enviar» lands (the number Prod02 answers)', () => {
    expect(mmss(stopwatchSeconds(SENT_AT))).toBe('23:14')
    expect(mmss(stopwatchSeconds(PROD01_DURATION))).toBe('23:14')
  })

  it('has ordered control points', () => {
    for (let i = 1; i < STOPWATCH_POINTS.length; i++) {
      expect(STOPWATCH_POINTS[i][0]).toBeGreaterThan(STOPWATCH_POINTS[i - 1][0])
      expect(STOPWATCH_POINTS[i][1]).toBeGreaterThanOrEqual(STOPWATCH_POINTS[i - 1][1])
    }
  })

  it('formats es-ES clock digits', () => {
    expect(mmss(0)).toBe('00:00')
    expect(mmss(150)).toBe('02:30')
    expect(mmss(1394)).toBe('23:14')
  })
})

describe('the captions', () => {
  it('are ordered and never overlap', () => {
    for (let i = 0; i < PROD01_CAPTIONS.length; i++) {
      const c = PROD01_CAPTIONS[i]
      expect(c.hideAt).toBeGreaterThan(c.showAt)
      if (i > 0) expect(c.showAt).toBeGreaterThanOrEqual(PROD01_CAPTIONS[i - 1].hideAt)
    }
  })

  it('fit inside the piece', () => {
    const last = PROD01_CAPTIONS[PROD01_CAPTIONS.length - 1]
    expect(last.hideAt).toBeLessThanOrEqual(PROD01_DURATION)
  })
})

describe('the camera', () => {
  it('is a valid rig', () => {
    expect(validateCameraRig(PROD01_CAM)).toEqual([])
  })

  it('holds the final framing as a stable still', () => {
    const last = PROD01_CAM[PROD01_CAM.length - 1]
    expect(PROD01_DURATION - last.at).toBeGreaterThanOrEqual(45)
  })
})

describe('the PDF', () => {
  it('materialises after «Exportar a PDF» and settles before the final wide', () => {
    expect(INVOICE_SCHED.enterAt).toBeGreaterThan(PROD01_SCHEDULE.activeAt[41])
    expect(INVOICE_SCHED.settledAt).toBeLessThan(PROD01_CAM[PROD01_CAM.length - 1].at)
  })
})
