import { describe, expect, it } from 'vitest'
import { DEFAULT_WINDOW_TIMING, appWindowTimeline, phase } from './windowScript'

const T = DEFAULT_WINDOW_TIMING

describe('appWindowTimeline · draw', () => {
  const tl = appWindowTimeline('draw', 0)

  it('traces first, then materialises the surface with the configured overlap', () => {
    expect(tl.traceStart).toBe(0)
    expect(tl.traceEnd).toBe(T.trace)
    expect(tl.surfaceStart).toBe(T.trace - T.surfaceOverlap)
    expect(tl.surfaceEnd).toBe(tl.surfaceStart + T.surfaceIn)
  })

  it('content follows the chrome cascade and everything settles last', () => {
    expect(tl.contentStart).toBe(tl.surfaceStart + 2 * T.chromeStagger)
    expect(tl.contentEnd).toBe(tl.contentStart + T.contentIn)
    expect(tl.settledAt).toBe(
      Math.max(tl.traceEnd + T.traceSettle, tl.surfaceEnd, tl.contentEnd),
    )
  })

  it('orders phases sanely: trace → surface → content → settled', () => {
    expect(tl.traceStart).toBeLessThan(tl.traceEnd)
    expect(tl.surfaceStart).toBeGreaterThanOrEqual(tl.traceStart)
    expect(tl.contentStart).toBeGreaterThanOrEqual(tl.surfaceStart)
    for (const end of [tl.traceEnd, tl.surfaceEnd, tl.contentEnd]) {
      expect(tl.settledAt).toBeGreaterThanOrEqual(end)
    }
  })

  it('shifts the whole timeline by enterAt', () => {
    const at = appWindowTimeline('draw', 100)
    expect(at.traceStart).toBe(tl.traceStart + 100)
    expect(at.surfaceEnd).toBe(tl.surfaceEnd + 100)
    expect(at.contentEnd).toBe(tl.contentEnd + 100)
    expect(at.settledAt).toBe(tl.settledAt + 100)
  })

  it('never starts the surface before the trace, even with an oversized overlap', () => {
    const weird = appWindowTimeline('draw', 50, { trace: 10, surfaceOverlap: 999 })
    expect(weird.surfaceStart).toBe(50)
  })

  it('merges partial timing over the defaults', () => {
    const slow = appWindowTimeline('draw', 0, { trace: 60 })
    expect(slow.traceEnd).toBe(60)
    expect(slow.surfaceStart).toBe(60 - T.surfaceOverlap) // default overlap kept
  })
})

describe('appWindowTimeline · rise', () => {
  it('is a single settle window; no trace phase', () => {
    const tl = appWindowTimeline('rise', 40)
    expect(tl.traceStart).toBe(40)
    expect(tl.traceEnd).toBe(40) // collapsed
    expect(tl.surfaceStart).toBe(40)
    expect(tl.surfaceEnd).toBe(40 + T.rise)
    expect(tl.contentEnd).toBe(40 + T.rise)
    expect(tl.settledAt).toBe(40 + T.rise)
  })

  it('honours a custom rise duration', () => {
    expect(appWindowTimeline('rise', 0, { rise: 20 }).settledAt).toBe(20)
  })
})

describe('appWindowTimeline · none', () => {
  it('collapses every phase to enterAt — settled immediately', () => {
    const tl = appWindowTimeline('none', 30)
    for (const v of [tl.traceStart, tl.traceEnd, tl.surfaceStart, tl.surfaceEnd, tl.contentStart, tl.contentEnd, tl.settledAt]) {
      expect(v).toBe(30)
    }
  })

  it('defaults to none at frame 0', () => {
    expect(appWindowTimeline().settledAt).toBe(0)
  })
})

describe('phase', () => {
  it('is 0 before, linear inside, 1 after', () => {
    expect(phase(9, 10, 20)).toBe(0)
    expect(phase(10, 10, 20)).toBe(0)
    expect(phase(15, 10, 20)).toBeCloseTo(0.5)
    expect(phase(20, 10, 20)).toBe(1)
    expect(phase(999, 10, 20)).toBe(1)
  })

  it('treats a collapsed window as a step at its end (no division by zero)', () => {
    expect(phase(29, 30, 30)).toBe(0)
    expect(phase(30, 30, 30)).toBe(1)
    expect(phase(31, 30, 30)).toBe(1)
    expect(phase(5, 30, 20)).toBe(0) // inverted window degrades to the same step
    expect(phase(25, 30, 20)).toBe(1)
  })

  it('is monotone non-decreasing over frames', () => {
    let prev = -1
    for (let f = 0; f <= 40; f++) {
      const p = phase(f, 10, 30)
      expect(p).toBeGreaterThanOrEqual(prev)
      prev = p
    }
  })

  it('phases of the none-timeline report settled for any frame past enterAt', () => {
    const tl = appWindowTimeline('none', 12)
    expect(phase(12, tl.surfaceStart, tl.surfaceEnd)).toBe(1)
    expect(phase(11, tl.surfaceStart, tl.surfaceEnd)).toBe(0)
  })
})
