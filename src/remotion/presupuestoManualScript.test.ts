import { describe, expect, it } from 'vitest'
import {
  appDim,
  cellCenter,
  crmRowCenter,
  DRAG_ROWS,
  FILL_COL,
  focusedApp,
  galChipCenter,
  GAL_COLS,
  GAL_ROWS,
  loadProgress,
  PASTE_LAND,
  PASTE_ROWS,
  PLANE,
  PM_CAMERA,
  PM_CURSOR,
  PRESUPUESTO_MANUAL_DURATION,
  scriptProblems,
  T,
  templateRowAt,
} from './presupuestoManualScript'

describe('rigs are legal', () => {
  it('cursor + camera scripts validate with no problems', () => {
    expect(scriptProblems()).toEqual([])
  })

  it('every waypoint and framing lands inside the content plane', () => {
    for (const wp of PM_CURSOR) {
      expect(wp.x).toBeGreaterThan(0)
      expect(wp.x).toBeLessThan(PLANE.w)
      // the gallery sits above the plane origin, so y may be slightly negative
      expect(wp.y).toBeGreaterThan(-260)
      expect(wp.y).toBeLessThan(PLANE.h)
    }
    for (const f of PM_CAMERA) {
      expect(f.zoom).toBeGreaterThan(0)
      expect(f.fx).toBeGreaterThan(-200)
      expect(f.fx).toBeLessThan(PLANE.w)
    }
  })

  it('opens in extreme macro and ends pulled back', () => {
    expect(PM_CAMERA[0].zoom).toBeGreaterThan(2)
    expect(PM_CAMERA[PM_CAMERA.length - 1].zoom).toBeLessThan(1.3)
  })

  it('the last cursor waypoint dissolves (vanish on the final beat only)', () => {
    const last = PM_CURSOR[PM_CURSOR.length - 1]
    expect(last.vanish).toBeGreaterThan(0)
    expect(PM_CURSOR.slice(0, -1).every((w) => w.vanish == null)).toBe(true)
  })

  it('duration covers the whole choreography', () => {
    expect(PRESUPUESTO_MANUAL_DURATION).toBeGreaterThan(T.totalAt)
    // ~49s ceiling — deliberately slow, human-paced tedium
    expect(PRESUPUESTO_MANUAL_DURATION).toBeLessThan(1600)
  })
})

describe('focus / scrim hand-offs — exactly one app lit per beat', () => {
  it('routes focus through the right app at each act', () => {
    expect(focusedApp(0)).toBe('excel')
    expect(focusedApp(T.galOpen + 5)).toBe('gallery')
    expect(focusedApp(T.tplLoad + 5)).toBe('excel')
    expect(focusedApp(T.l1Crm + 5)).toBe('crm')
    expect(focusedApp(T.l1Back + 5)).toBe('excel')
    expect(focusedApp(T.l2Crm + 5)).toBe('crm')
    expect(focusedApp(T.l3Paste + 5)).toBe('excel')
  })

  it('the focused app is fully lit and the others sit under the veil', () => {
    const f = T.l1Copy // deep in the CRM
    expect(appDim('crm', f)).toBeCloseTo(0, 5)
    expect(appDim('excel', f)).toBeCloseTo(1, 5)
    expect(appDim('gallery', f)).toBeCloseTo(1, 5)
  })

  it('cross-fades dim over the hand-off window, never instantly', () => {
    // right at a hand-off the leaving app is only partway under the veil
    const mid = T.l1Crm + 4 // excel handing off to crm
    expect(appDim('excel', mid)).toBeGreaterThan(0)
    expect(appDim('excel', mid)).toBeLessThan(1)
  })
})

describe('the template-load progress STALLS', () => {
  it('crawls, hangs at 0.7, then finishes at 1', () => {
    expect(loadProgress(T.tplLoad)).toBe(0)
    expect(loadProgress(T.tplStallFrom)).toBeCloseTo(0.7, 5)
    expect(loadProgress((T.tplStallFrom + T.tplStallTo) / 2)).toBeCloseTo(0.7, 5) // the fake-hang
    expect(loadProgress(T.tplStallTo)).toBeCloseTo(0.7, 5)
    expect(loadProgress(T.tplDone)).toBe(1)
    expect(loadProgress(T.tplDone + 50)).toBe(1)
  })

  it('is monotonic across the whole load', () => {
    let prev = -1
    for (let f = T.tplLoad; f <= T.tplDone + 4; f++) {
      const p = loadProgress(f)
      expect(p).toBeGreaterThanOrEqual(prev)
      prev = p
    }
  })
})

describe('cell-fill schedule', () => {
  it('paste lands are synced to the paste clicks (at + 3)', () => {
    expect(PASTE_LAND).toEqual([T.l1Paste + 3, T.l2Paste + 3, T.l3Paste + 3])
    expect(PASTE_LAND.length).toBe(PASTE_ROWS.length)
  })

  it('the template wavefront drips down the sheet', () => {
    expect(templateRowAt(0)).toBe(T.tplDone)
    expect(templateRowAt(1)).toBeGreaterThan(templateRowAt(0))
  })

  it('drag rows pick up exactly where the manual pastes stop', () => {
    expect(Math.min(...DRAG_ROWS)).toBe(Math.max(...PASTE_ROWS) + 1)
  })
})

describe('geometry', () => {
  it('the gallery has a full 4×3 wall of chips', () => {
    expect(GAL_COLS * GAL_ROWS).toBe(12)
    const a = galChipCenter(0)
    const b = galChipCenter(GAL_COLS * GAL_ROWS - 1)
    expect(b.x).toBeGreaterThan(a.x)
    expect(b.y).toBeGreaterThan(a.y)
  })

  it('the CRM sits far left of Excel so the inter-window pan is long', () => {
    expect(crmRowCenter(2).x).toBeLessThan(cellCenter(0, FILL_COL).x - 800)
  })
})
