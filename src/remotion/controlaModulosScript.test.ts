import { describe, expect, it } from 'vitest'
import { RIVE_CLIPS } from './riveClips'
import {
  CHAIN,
  CHAIN_DIRS,
  CHAIN_LEN,
  DURATION,
  GOAL_NODE,
  MODULES_ROW,
  MODULE_SPAN,
  MODULE_TRIGGER,
  ROW,
  cameraPZ,
  cellGrow,
  followZoom,
  goalGrow,
  headAt,
  isGoalCell,
  isModuleCell,
} from './controlaModulosScript'

const W = 1920
const H = 1080
const man = (a: readonly number[], b: readonly number[]) =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])

describe('controlaModulosScript — the horizontal line', () => {
  it('is a straight 4-connected row along ROW, left→right', () => {
    expect(CHAIN[0]).toEqual([1, ROW])
    for (let i = 0; i < CHAIN_LEN; i += 1) expect(CHAIN[i][1]).toBe(ROW)
    for (let i = 1; i < CHAIN_LEN; i += 1) expect(man(CHAIN[i], CHAIN[i - 1])).toBe(1)
  })

  it('points right the whole way', () => {
    expect(CHAIN_DIRS.length).toBe(CHAIN_LEN - 1)
    expect(CHAIN_DIRS.every((d) => d === 'right')).toBe(true)
  })

  it('marks the module spans as stations and the gaps as trail', () => {
    for (const m of MODULES_ROW) {
      for (let c = m.col; c < m.col + MODULE_SPAN; c += 1) expect(isModuleCell([c, ROW])).toBe(true)
      // the cell just after a module span is a gap (chevron trail), not a station
      expect(isModuleCell([m.col + MODULE_SPAN, ROW])).toBe(false)
    }
  })

  it('ENDS at the goal/objetivo — the line arrives, it does not trail off in chevrons', () => {
    const last = MODULES_ROW[MODULES_ROW.length - 1]
    // the goal sits a gap past the last module, and the chain terminates ON it
    expect(GOAL_NODE).toEqual([CHAIN[CHAIN_LEN - 1][0], ROW])
    expect(GOAL_NODE[0]).toBeGreaterThan(last.col + MODULE_SPAN - 1)
    expect(isGoalCell(GOAL_NODE)).toBe(true)
    expect(isModuleCell(GOAL_NODE)).toBe(false)
    // the head walks all the way in, and the objetivo is lit by the time it lands
    expect(headAt(DURATION)).toBeCloseTo(CHAIN_LEN - 1, 5)
    expect(goalGrow(0)).toBeLessThan(0.5)
    expect(goalGrow(DURATION)).toBeCloseTo(1, 5)
  })
})

describe('controlaModulosScript — the pan', () => {
  it('every Controla module is blue/data and has a Rive clip', () => {
    for (const m of MODULES_ROW) expect(m.name in RIVE_CLIPS).toBe(true)
  })

  it('triggers are strictly increasing and land before DURATION', () => {
    for (let k = 1; k < MODULE_TRIGGER.length; k += 1) {
      expect(MODULE_TRIGGER[k]).toBeGreaterThan(MODULE_TRIGGER[k - 1])
    }
    expect(MODULE_TRIGGER[MODULE_TRIGGER.length - 1]).toBeLessThan(DURATION)
  })

  it('head is monotonic non-decreasing and clamped to the chain', () => {
    let prev = -Infinity
    for (let f = 0; f <= DURATION; f += 1) {
      const h = headAt(f)
      expect(h).toBeGreaterThanOrEqual(prev - 1e-9)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThanOrEqual(CHAIN_LEN - 1)
      prev = h
    }
  })

  it('a cell is fully grown once the head has passed it, and stays', () => {
    const idx = MODULES_ROW[1].col - 1 // chain index of the 2nd module's left cell
    expect(cellGrow(0, idx)).toBeLessThan(0.5)
    expect(cellGrow(MODULE_TRIGGER[1], idx)).toBeCloseTo(1, 5)
    expect(cellGrow(DURATION, idx)).toBeCloseTo(1, 5)
  })

  it('is a PURE horizontal pan — constant Y and constant zoom', () => {
    const a = cameraPZ(0, W, H)
    const b = cameraPZ(Math.round(DURATION / 2), W, H)
    const c = cameraPZ(DURATION, W, H)
    expect(a.P[1]).toBeCloseTo(b.P[1], 6)
    expect(b.P[1]).toBeCloseTo(c.P[1], 6)
    expect(a.Z).toBeCloseTo(followZoom(W), 6)
    expect(c.Z).toBeCloseTo(followZoom(W), 6)
    expect(c.P[0]).toBeGreaterThan(a.P[0]) // it does pan rightward
  })
})
