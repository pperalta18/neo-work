import { describe, it, expect } from 'vitest'
import { footprint } from '@/lib/pathfinding'
import {
  ROUTE,
  ARROWS,
  CAL_INDEX,
  COLUMNS,
  ROWS,
  M,
  TOTAL_STEPS,
  ACT_A_DURATION,
  A_BEATS_END,
  INTRO,
  flowReveal,
  flowCameraPZ,
  CONTENT_CENTERS,
} from './eventoMarketingScript'

describe('eventoMarketingScript — route geometry', () => {
  it('has one arrow per step and a final Google Calendar plate', () => {
    expect(ARROWS).toHaveLength(ROUTE.length)
    expect(CAL_INDEX).toBe(ROUTE.length - 1)
    const cal = ROUTE[CAL_INDEX]
    expect(cal.text?.main).toBe('Consultando timeline de montaje')
    expect(cal.colSpan).toBeGreaterThanOrEqual(3)
  })

  it('reflows plates edge-to-edge without overlap, within bounds', () => {
    for (let i = 1; i < ROUTE.length; i += 1) {
      const a = footprint(ROUTE[i - 1])
      const b = footprint(ROUTE[i])
      // straight rightward chain: each step starts just past the previous one.
      expect(b.c0).toBe(a.c1 + 1)
    }
    for (const s of ROUTE) {
      expect(footprint(s).c1).toBeLessThanOrEqual(COLUMNS)
      expect(footprint(s).r1).toBeLessThanOrEqual(ROWS)
    }
  })
})

describe('eventoMarketingScript — timeline & camera', () => {
  it('reveals nothing before the intro and everything by the hold', () => {
    expect(flowReveal(0)).toBe(0)
    expect(flowReveal(A_BEATS_END)).toBe(TOTAL_STEPS)
    expect(flowReveal(ACT_A_DURATION)).toBe(TOTAL_STEPS)
  })

  it('reveal is monotonically non-decreasing across act A', () => {
    let prev = -1
    for (let f = 0; f <= ACT_A_DURATION; f += 2) {
      const r = flowReveal(f)
      expect(r).toBeGreaterThanOrEqual(prev - 1e-9)
      prev = r
    }
  })

  it('settles the camera on the calendar plate by the end of act A', () => {
    const { P } = flowCameraPZ(ACT_A_DURATION)
    const target = CONTENT_CENTERS[M - 1]
    expect(P[0]).toBeCloseTo(target[0], 3)
    expect(P[1]).toBeCloseTo(target[1], 3)
  })

  it('opens the route on the first plate', () => {
    const { P } = flowCameraPZ(0)
    expect(P[0]).toBeCloseTo(CONTENT_CENTERS[0][0], 3)
    // INTRO window exists so the push-in has room to ease
    expect(INTRO).toBeGreaterThan(0)
  })
})
