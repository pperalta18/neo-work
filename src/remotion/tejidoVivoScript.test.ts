import { describe, expect, it } from 'vitest'
import { isModuleName } from '@/stories/neo/modules/modules'
import { isIconName } from '@/components/icons'
import {
  CAP_EPH,
  COLUMNS,
  FADE,
  MASTER,
  MAX_PERSIST,
  ROWS,
  SETTLE_START,
  TEMPLATES,
  TOTAL,
  activeFlowsAt,
  generateMaster,
  liveCountAt,
  liveEphemeralCountAt,
  occupancyAt,
  revealAt,
  stepDecayAt,
} from './tejidoVivoScript'

const SAMPLES = Array.from({ length: TOTAL / 10 + 1 }, (_, i) => i * 10).filter((f) => f < TOTAL)
const cheby = (a: [number, number], b: [number, number]) =>
  Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]))

describe('the processes (templates)', () => {
  it('each is a real multi-step process: ≥3 content steps, matching arrows', () => {
    for (const t of TEMPLATES) {
      expect(t.arrows).toHaveLength(t.steps.length)
      expect(t.contentIdx.length).toBeGreaterThanOrEqual(3)
      expect(t.cells.length).toBeGreaterThan(0)
    }
  })

  it('each path is self-consistent: normalized to [1,1] and never self-overlaps', () => {
    for (const t of TEMPLATES) {
      const minC = Math.min(...t.cells.map((c) => c[0]))
      const minR = Math.min(...t.cells.map((c) => c[1]))
      expect(minC).toBe(1)
      expect(minR).toBe(1)
      const keys = t.cells.map(([c, r]) => `${c},${r}`)
      expect(new Set(keys).size).toBe(keys.length) // no cell used twice
    }
  })

  it('each mixes AiKit module tools with concrete text+icon actions (real processes)', () => {
    for (const t of TEMPLATES) {
      const mods = t.steps.filter((s) => s.module)
      const acts = t.steps.filter((s) => s.text && s.icon)
      expect(mods.length).toBeGreaterThan(0)
      expect(acts.length).toBeGreaterThan(0)
      for (const s of mods) expect(isModuleName(s.module)).toBe(true)
      for (const s of acts) expect(isIconName(s.icon)).toBe(true)
    }
  })

  it('winds at least one process across more than one row (serpentine, not a bar)', () => {
    expect(TEMPLATES.some((t) => t.rows > 1)).toBe(true)
  })
})

describe('the schedule', () => {
  it('is fully deterministic (two builds are identical)', () => {
    expect(generateMaster()).toEqual(generateMaster())
  })

  it('runs a believable number of flows', () => {
    expect(MASTER.length).toBeGreaterThan(24)
  })

  it('keeps persistents a capped minority, ephemerals the majority', () => {
    const persist = MASTER.filter((e) => e.kind === 'persistent')
    const ephemeral = MASTER.filter((e) => e.kind === 'ephemeral')
    expect(persist.length).toBeLessThanOrEqual(MAX_PERSIST)
    expect(persist.length).toBeGreaterThanOrEqual(3)
    expect(ephemeral.length).toBeGreaterThan(persist.length * 2)
  })

  it('stops spawning before the settle, so every flow starts in the build window', () => {
    for (const e of MASTER) expect(e.start).toBeLessThan(SETTLE_START)
  })
})

describe('placement on one shared grid', () => {
  it('keeps every cell in-bounds at every sampled frame', () => {
    for (const f of SAMPLES) {
      for (const ev of activeFlowsAt(f)) {
        for (const [c, r] of ev.cells) {
          expect(c).toBeGreaterThanOrEqual(1)
          expect(c).toBeLessThanOrEqual(COLUMNS)
          expect(r).toBeGreaterThanOrEqual(1)
          expect(r).toBeLessThanOrEqual(ROWS)
        }
      }
    }
  })

  it('never overlaps and always keeps a 1-cell cordon between live flows', () => {
    for (const f of SAMPLES) {
      const flows = activeFlowsAt(f)
      for (let i = 0; i < flows.length; i += 1) {
        for (let j = i + 1; j < flows.length; j += 1) {
          for (const a of flows[i].cells) {
            for (const b of flows[j].cells) {
              expect(cheby(a, b)).toBeGreaterThanOrEqual(2) // ≥2 ⇒ never touching, gutter kept
            }
          }
        }
      }
    }
  })

  it('the union occupancy never exceeds the grid', () => {
    for (const f of SAMPLES) expect(occupancyAt(f).size).toBeLessThanOrEqual(COLUMNS * ROWS)
  })
})

describe('back-pressure band', () => {
  it('never floods past the ephemeral cap', () => {
    for (const f of SAMPLES) expect(liveEphemeralCountAt(f)).toBeLessThanOrEqual(CAP_EPH)
  })

  it('never goes dead through the teeming middle', () => {
    for (let f = 300; f < 1400; f += 10) expect(liveCountAt(f)).toBeGreaterThan(0)
  })
})

describe('lifecycle: spawn → run → (dissipate | persist)', () => {
  const eph = MASTER.find((e) => e.kind === 'ephemeral')!
  const per = MASTER.find((e) => e.kind === 'persistent')!

  it('an ephemeral emerges head-first, holds, then fully retracts to bare grid', () => {
    expect(revealAt(eph, eph.start)).toBeCloseTo(0, 5)
    expect(revealAt(eph, eph.start + eph.growDur)).toBeGreaterThanOrEqual(eph.N - 0.001)
    const dissStart = eph.start + eph.growDur + eph.hold
    expect(stepDecayAt(eph, dissStart, 0)).toBeCloseTo(0, 5)
    const end = dissStart + FADE + (eph.N - 1) * 1.5
    for (let i = 0; i < eph.N; i += 1) expect(stepDecayAt(eph, end + 2, i)).toBeGreaterThanOrEqual(0.999)
    expect(activeFlowsAt(eph.occEnd + 1).includes(eph)).toBe(false)
  })

  it('a persistent never decays and stays occupied to the end', () => {
    expect(per.occEnd).toBe(Infinity)
    for (const f of [per.start, per.start + 200, TOTAL - 1]) {
      for (let i = 0; i < per.N; i += 1) expect(stepDecayAt(per, f, i)).toBe(0)
    }
    expect(activeFlowsAt(TOTAL - 1).includes(per)).toBe(true)
  })
})

describe('build-and-settle seam', () => {
  it('starts and ends calm — zero live ephemerals at both ends', () => {
    expect(liveEphemeralCountAt(0)).toBe(0)
    expect(liveEphemeralCountAt(TOTAL - 1)).toBe(0)
  })

  it('ends on the persistent lattice only', () => {
    const persist = MASTER.filter((e) => e.kind === 'persistent').length
    expect(liveCountAt(TOTAL - 1)).toBe(persist)
  })
})
