import { describe, expect, it } from 'vitest'
import {
  type ProgramSchedule,
  currentStepNumber,
  doneCount,
  focusIndex,
  programDuration,
  programSchedule,
  progressFill,
  stepState,
  validateProgramTempo,
} from './programScript'

describe('programSchedule · sequential (default tempo)', () => {
  const s = programSchedule(4, { startAt: 30, active: 20 })

  it('activates step 0 at startAt', () => {
    expect(s.activeAt[0]).toBe(30)
  })

  it('with no advance given, each step starts exactly when the previous settles', () => {
    for (let i = 0; i < 3; i++) {
      expect(s.activeAt[i + 1]).toBe(s.doneAt[i])
    }
  })

  it('every step is active for the configured frames', () => {
    for (let i = 0; i < 4; i++) {
      expect(s.doneAt[i] - s.activeAt[i]).toBe(20)
    }
  })

  it('allDoneAt is the last settle', () => {
    expect(s.allDoneAt).toBe(30 + 4 * 20)
  })

  it('defaults: startAt 0, a usable active duration', () => {
    const d = programSchedule(2)
    expect(d.activeAt[0]).toBe(0)
    expect(d.doneAt[0]).toBeGreaterThan(0)
  })
})

describe('programSchedule · cascade and gaps', () => {
  it('advance < active overlaps steps (the Prod02 cascade)', () => {
    const s = programSchedule(5, { active: 14, advance: 5 })
    // step 1 starts while step 0 is still running
    expect(s.activeAt[1]).toBeLessThan(s.doneAt[0])
    // three steps in flight at frame 12: 0 (0–14), 1 (5–19), 2 (10–24)
    const inFlight = [0, 1, 2, 3, 4].filter((i) => stepState(s, i, 12) === 'active')
    expect(inFlight).toEqual([0, 1, 2])
  })

  it('advance > active leaves travel gaps (the Prod01 click rhythm)', () => {
    const s = programSchedule(3, { active: 10, advance: 26 })
    expect(s.activeAt[1]).toBe(26)
    expect(s.doneAt[0]).toBe(10)
    // between 10 and 26 nothing is active
    expect(stepState(s, 0, 18)).toBe('done')
    expect(stepState(s, 1, 18)).toBe('pending')
  })

  it('allDoneAt is the max settle, not necessarily the last step', () => {
    // step 0 runs long while the cascade races past it
    const s = programSchedule(4, { active: (i) => (i === 0 ? 50 : 5), advance: 2 })
    expect(s.doneAt[0]).toBe(50)
    expect(s.doneAt[3]).toBe(11)
    expect(s.allDoneAt).toBe(50)
  })

  it('per-step functions drive both durations', () => {
    const s = programSchedule(3, { active: (i) => 10 + i, advance: (i) => 20 + i })
    expect(s.doneAt.map((d, i) => d - s.activeAt[i])).toEqual([10, 11, 12])
    expect(s.activeAt).toEqual([0, 20, 41])
  })
})

describe('programSchedule · holds', () => {
  it('a hold delays its step and everything after, not the steps before', () => {
    const base = programSchedule(4, { active: 10 })
    const held = programSchedule(4, { active: 10, holds: [{ before: 2, frames: 30 }] })
    expect(held.activeAt[0]).toBe(base.activeAt[0])
    expect(held.activeAt[1]).toBe(base.activeAt[1])
    expect(held.activeAt[2]).toBe(base.activeAt[2] + 30)
    expect(held.activeAt[3]).toBe(base.activeAt[3] + 30)
  })

  it('a hold before step 0 delays the whole run', () => {
    const s = programSchedule(2, { startAt: 10, active: 5, holds: [{ before: 0, frames: 20 }] })
    expect(s.activeAt[0]).toBe(30)
  })

  it('multiple holds on the same step accumulate', () => {
    const s = programSchedule(2, {
      active: 5,
      holds: [
        { before: 1, frames: 10 },
        { before: 1, frames: 15 },
      ],
    })
    expect(s.activeAt[1]).toBe(5 + 25)
  })

  it('an empty program is settled at startAt', () => {
    const s = programSchedule(0, { startAt: 40 })
    expect(s.allDoneAt).toBe(40)
    expect(s.activeAt).toEqual([])
  })
})

describe('stepState / doneCount / currentStepNumber', () => {
  const s = programSchedule(3, { startAt: 10, active: 20 }) // active at 10/30/50, done at 30/50/70

  it('transitions exactly on the scheduled frames', () => {
    expect(stepState(s, 0, 9)).toBe('pending')
    expect(stepState(s, 0, 10)).toBe('active')
    expect(stepState(s, 0, 29)).toBe('active')
    expect(stepState(s, 0, 30)).toBe('done')
  })

  it('doneCount counts settled steps and is monotone', () => {
    expect(doneCount(s, 0)).toBe(0)
    expect(doneCount(s, 30)).toBe(1)
    expect(doneCount(s, 69)).toBe(2)
    expect(doneCount(s, 70)).toBe(3)
    let prev = -1
    for (let f = 0; f <= 80; f++) {
      const n = doneCount(s, f)
      expect(n).toBeGreaterThanOrEqual(prev)
      prev = n
    }
  })

  it('the "paso X/N" counter is 0 before the run, then the latest activation, clamped', () => {
    expect(currentStepNumber(s, 9)).toBe(0)
    expect(currentStepNumber(s, 10)).toBe(1)
    expect(currentStepNumber(s, 49)).toBe(2)
    expect(currentStepNumber(s, 50)).toBe(3)
    expect(currentStepNumber(s, 999)).toBe(3) // never past N
  })
})

describe('progressFill', () => {
  const s = programSchedule(4, { active: 10 }) // done at 10/20/30/40

  it('is 0 before any step settles and 1 once everything has ramped in', () => {
    expect(progressFill(s, 0)).toBe(0)
    expect(progressFill(s, 9)).toBe(0)
    expect(progressFill(s, s.allDoneAt + 10)).toBe(1)
  })

  it('reaches k/count after step k has fully ramped', () => {
    expect(progressFill(s, 20, 10)).toBeCloseTo(1 / 4) // step 0 ramped, step 1 just settling
    expect(progressFill(s, 30, 5)).toBeCloseTo(2 / 4)
  })

  it('is monotone non-decreasing and bounded to [0, 1]', () => {
    let prev = 0
    for (let f = 0; f <= 60; f++) {
      const p = progressFill(s, f)
      expect(p).toBeGreaterThanOrEqual(prev)
      expect(p).toBeLessThanOrEqual(1)
      prev = p
    }
  })

  it('handles an empty program without dividing by zero', () => {
    expect(progressFill(programSchedule(0), 100)).toBe(0)
  })
})

describe('focusIndex', () => {
  const s = programSchedule(5, { active: 20 }) // activations at 0/20/40/60/80

  it('starts at 0 and lands on i exactly when step i activates', () => {
    expect(focusIndex(s, 0)).toBe(0)
    expect(focusIndex(s, 20)).toBe(1)
    expect(focusIndex(s, 60)).toBe(3)
  })

  it('is fractional mid-handover (easing toward the next step)', () => {
    const mid = focusIndex(s, 16, 8) // halfway through the lead into step 1
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })

  it('is monotone and never exceeds count - 1', () => {
    let prev = 0
    for (let f = 0; f <= 120; f++) {
      const x = focusIndex(s, f)
      expect(x).toBeGreaterThanOrEqual(prev)
      prev = x
    }
    expect(focusIndex(s, 9999)).toBe(4)
  })
})

describe('programDuration', () => {
  it('covers the run plus the tail', () => {
    const s = programSchedule(2, { active: 15 })
    expect(programDuration(s)).toBe(s.allDoneAt + 45)
    expect(programDuration(s, 10)).toBe(s.allDoneAt + 10)
  })
})

describe('validateProgramTempo', () => {
  it('accepts a sane tempo', () => {
    expect(validateProgramTempo(50, { active: 12, advance: 18, holds: [{ before: 6, frames: 24 }] })).toEqual([])
    expect(validateProgramTempo(3)).toEqual([])
  })

  it('rejects sub-frame durations', () => {
    expect(validateProgramTempo(2, { active: 0 }).length).toBeGreaterThan(0)
    expect(validateProgramTempo(2, { active: 10, advance: 0 }).length).toBeGreaterThan(0)
  })

  it('rejects holds pointing at missing steps or negative frames', () => {
    expect(validateProgramTempo(3, { holds: [{ before: 3, frames: 10 }] }).length).toBeGreaterThan(0)
    expect(validateProgramTempo(3, { holds: [{ before: 1, frames: -5 }] }).length).toBeGreaterThan(0)
  })
})

describe('schedule is consumable as plain data', () => {
  it('exposes readonly arrays a scene can choreograph against', () => {
    const s: ProgramSchedule = programSchedule(3, { active: 8, advance: 12 })
    // a cursor script would click at each activation — they must be sorted
    const sorted = [...s.activeAt].sort((a, b) => a - b)
    expect([...s.activeAt]).toEqual(sorted)
    expect(s.count).toBe(3)
  })
})
