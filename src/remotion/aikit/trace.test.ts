import { describe, expect, it } from 'vitest'
import { COMET_TIP, PEN_TIP, inkReveal, roundedRectPerimeter, tipDashes } from './trace'

describe('inkReveal', () => {
  it('hides the path at 0 and reveals it fully at 1 (normalised dash)', () => {
    expect(inkReveal(0)).toEqual({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 })
    expect(inkReveal(1)).toEqual({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 0 })
  })

  it('reveals proportionally and clamps outside [0, 1]', () => {
    expect(inkReveal(0.25).strokeDashoffset).toBeCloseTo(0.75)
    expect(inkReveal(-3).strokeDashoffset).toBe(1)
    expect(inkReveal(7).strokeDashoffset).toBe(0)
  })

  it('is monotone: more progress, less offset', () => {
    let prev = Infinity
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const off = inkReveal(p).strokeDashoffset
      expect(off).toBeLessThanOrEqual(prev)
      prev = off
    }
  })
})

describe('tipDashes', () => {
  const LENGTH = 2000
  const UNIT = 128

  it('returns nothing for hairline, a dead fade, or zero progress', () => {
    expect(tipDashes(0.5, LENGTH, UNIT, 'hairline')).toEqual([])
    expect(tipDashes(0.5, LENGTH, UNIT, 'pen', 0)).toEqual([])
    expect(tipDashes(0, LENGTH, UNIT, 'pen')).toEqual([])
  })

  it('emits one dash per profile segment (pen and comet differ)', () => {
    expect(tipDashes(0.5, LENGTH, UNIT, 'pen')).toHaveLength(PEN_TIP.length)
    expect(tipDashes(0.5, LENGTH, UNIT, 'comet')).toHaveLength(COMET_TIP.length)
    const penHead = tipDashes(0.5, LENGTH, UNIT, 'pen')[0]
    const cometHead = tipDashes(0.5, LENGTH, UNIT, 'comet')[0]
    expect(cometHead.widthDelta).toBeGreaterThan(penHead.widthDelta)
  })

  it('every lit segment ENDS exactly at the draw front', () => {
    for (const p of [0.1, 0.5, 1]) {
      const front = p * LENGTH
      for (const [k, tip] of tipDashes(p, LENGTH, UNIT, 'pen').entries()) {
        const segLen = PEN_TIP[k].len * UNIT
        // dash window in path coords is [-offset, -offset + segLen]
        const litEnd = -tip.strokeDashoffset + segLen
        expect(litEnd).toBeCloseTo(front)
      }
    }
  })

  it('scales segment lengths with the reference unit, not the path', () => {
    const small = tipDashes(0.5, LENGTH, 64, 'pen')[0]
    const large = tipDashes(0.5, LENGTH, 128, 'pen')[0]
    expect(parseFloat(small.strokeDasharray)).toBeCloseTo(64 * PEN_TIP[0].len)
    expect(parseFloat(large.strokeDasharray)).toBeCloseTo(128 * PEN_TIP[0].len)
  })

  it('dims every segment by the fade level', () => {
    const full = tipDashes(0.5, LENGTH, UNIT, 'pen', 1)
    const half = tipDashes(0.5, LENGTH, UNIT, 'pen', 0.5)
    half.forEach((tip, k) => expect(tip.opacity).toBeCloseTo(full[k].opacity * 0.5))
  })

  it('fades back through the trail: head brightest, tail dimmest', () => {
    const tips = tipDashes(0.7, LENGTH, UNIT, 'comet')
    for (let k = 1; k < tips.length; k++) {
      expect(tips[k].opacity).toBeLessThan(tips[k - 1].opacity)
      expect(tips[k].widthDelta).toBeLessThanOrEqual(tips[k - 1].widthDelta)
    }
  })

  it('clamps progress past 1 to the path end', () => {
    const over = tipDashes(1.4, LENGTH, UNIT, 'pen')[0]
    const exact = tipDashes(1, LENGTH, UNIT, 'pen')[0]
    expect(over.strokeDashoffset).toBeCloseTo(exact.strokeDashoffset)
  })
})

describe('roundedRectPerimeter', () => {
  it('is the plain rect perimeter at r = 0', () => {
    expect(roundedRectPerimeter(640, 460, 0)).toBeCloseTo(2 * (640 + 460))
  })

  it('degenerates to a circle when r reaches half the short side of a square', () => {
    expect(roundedRectPerimeter(200, 200, 100)).toBeCloseTo(2 * Math.PI * 100)
  })

  it('clamps an oversized radius instead of going negative', () => {
    expect(roundedRectPerimeter(200, 100, 500)).toBeCloseTo(roundedRectPerimeter(200, 100, 50))
    expect(roundedRectPerimeter(200, 100, -5)).toBeCloseTo(2 * (200 + 100))
  })

  it('rounding corners always shortens the path (4 - π > 0 per corner)', () => {
    const sharp = roundedRectPerimeter(640, 460, 0)
    const soft = roundedRectPerimeter(640, 460, 26)
    expect(soft).toBeLessThan(sharp)
    expect(soft).toBeCloseTo(sharp - 2 * 26 * (4 - Math.PI))
  })
})
