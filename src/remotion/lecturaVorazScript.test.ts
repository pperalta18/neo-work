import { describe, expect, it } from 'vitest'
import {
  activeDropsAt,
  cameraAt,
  DRAIN_SPAN,
  dropOpacityAt,
  EMIT_END,
  familyOf,
  generateMaster,
  highlightsAt,
  LECTURA_VORAZ_DURATION,
  liveCountAt,
  MASTER,
  targetCount,
  TEMPLATES,
} from './lecturaVorazScript'

const SAMPLES = Array.from({ length: Math.floor(LECTURA_VORAZ_DURATION / 5) + 1 }, (_, i) => i * 5).filter(
  (f) => f < LECTURA_VORAZ_DURATION,
)

describe('the source catalogue', () => {
  it('covers all three families with real, highlightable content', () => {
    const fams = new Set(TEMPLATES.map((t) => t.family))
    expect(fams).toEqual(new Set(['table', 'json', 'api']))
    for (const t of TEMPLATES) expect(targetCount(t)).toBeGreaterThan(0)
  })
})

describe('the schedule', () => {
  it('is fully deterministic (two builds are identical)', () => {
    expect(generateMaster()).toEqual(generateMaster())
    expect(MASTER).toEqual(generateMaster())
  })

  it('rains a believable number of sources, drawn from every family', () => {
    expect(MASTER.length).toBeGreaterThan(24)
    const fams = new Set(MASTER.map((d) => familyOf(d.tmpl)))
    expect(fams.size).toBe(3)
  })

  it('drops in time order, every source landing before the rain stops', () => {
    for (let i = 1; i < MASTER.length; i += 1) expect(MASTER[i].start).toBeGreaterThanOrEqual(MASTER[i - 1].start)
    for (const d of MASTER) expect(d.start).toBeLessThan(EMIT_END)
  })

  it('never repeats the exact same template back-to-back', () => {
    for (let i = 1; i < MASTER.length; i += 1) expect(MASTER[i].tmpl).not.toBe(MASTER[i - 1].tmpl)
  })

  it('accelerates: the gap between drops shrinks from calm to frantic', () => {
    const gap = (i: number) => MASTER[i + 1].start - MASTER[i].start
    const early = gap(1)
    const late = gap(MASTER.length - 3)
    expect(late).toBeLessThan(early)
  })
})

describe('every highlight targets a real slot', () => {
  it('stays within its template’s slot range', () => {
    for (const d of MASTER) {
      const n = targetCount(TEMPLATES[d.tmpl])
      for (const h of d.hls) {
        expect(h.target).toBeGreaterThanOrEqual(0)
        expect(h.target).toBeLessThan(n)
      }
    }
  })

  it('draws progress within [0,1] and only after it has started', () => {
    for (const f of SAMPLES) {
      for (const d of activeDropsAt(f)) {
        for (const m of highlightsAt(d, f)) {
          expect(m.p).toBeGreaterThanOrEqual(0)
          expect(m.p).toBeLessThanOrEqual(1)
          expect(m.target).toBeLessThan(targetCount(TEMPLATES[d.tmpl]))
        }
      }
    }
  })
})

describe('the full-screen field (scatter → many at once → fade → empty)', () => {
  it('scatters sources across the whole frame, well off centre and bleeding to the edges', () => {
    const maxX = Math.max(...MASTER.map((d) => Math.abs(d.dx)))
    const maxY = Math.max(...MASTER.map((d) => Math.abs(d.dy)))
    expect(maxX).toBeGreaterThan(650) // reaches the horizontal edges
    expect(maxY).toBeGreaterThan(320) // …and the vertical ones
    const farFromCentre = MASTER.filter((d) => Math.abs(d.dx) > 400).length
    expect(farFromCentre).toBeGreaterThan(MASTER.length * 0.35) // not a central heap
  })

  it('keeps MANY sources alive at once through the frantic middle', () => {
    let peak = 0
    for (let f = 120; f < EMIT_END; f += 5) peak = Math.max(peak, liveCountAt(f))
    expect(peak).toBeGreaterThanOrEqual(12)
    for (let f = 60; f < EMIT_END; f += 10) expect(liveCountAt(f)).toBeGreaterThan(0)
  })

  it('a fresh source pops at near-full opacity right after it lands', () => {
    const d = MASTER[0]
    expect(dropOpacityAt(d, d.start + 8)).toBeGreaterThan(0.9)
  })

  it('opacity is always a clean [0,1] for every active card', () => {
    for (const f of SAMPLES) {
      for (const d of activeDropsAt(f)) {
        const op = dropOpacityAt(d, f)
        expect(op).toBeGreaterThanOrEqual(0)
        expect(op).toBeLessThanOrEqual(1)
      }
    }
  })

  it('the field fades throughout and dissolves to bare surface by the end', () => {
    // still churning shortly after the rain stops…
    expect(liveCountAt(EMIT_END + 4)).toBeGreaterThan(0)
    // …and fully empty by the end.
    expect(activeDropsAt(LECTURA_VORAZ_DURATION - 1).length).toBe(0)
  })

  it('drains BRISKLY once the rain stops (no draggy tail) and the last source fades last', () => {
    // the whole drain — cascade + final fade + pad — is short, not a long run-out.
    expect(LECTURA_VORAZ_DURATION - EMIT_END).toBeLessThan(100)
    // the cascade is actively thinning the field, not holding it full.
    expect(liveCountAt(EMIT_END + DRAIN_SPAN)).toBeLessThan(liveCountAt(EMIT_END))
    // the very last source to land is the very last to vanish.
    const maxOcc = Math.max(...MASTER.map((d) => d.occEnd))
    expect(MASTER[MASTER.length - 1].occEnd).toBe(maxOcc)
  })
})

describe('camera', () => {
  it('returns a calm, finite transform at every frame (no chase)', () => {
    for (const f of SAMPLES) {
      const c = cameraAt(f)
      expect(Number.isFinite(c.scale)).toBe(true)
      expect(c.scale).toBeGreaterThan(0.8)
      expect(c.scale).toBeLessThan(1.2)
      expect(Number.isFinite(c.x)).toBe(true)
      expect(Number.isFinite(c.y)).toBe(true)
    }
  })
})
