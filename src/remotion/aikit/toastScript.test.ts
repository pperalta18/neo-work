import { describe, expect, it } from 'vitest'
import {
  TOAST_ENTER,
  TOAST_EXIT,
  type ToastSpec,
  enterPhase,
  exitPhase,
  isGone,
  isOnScreen,
  presence,
  toastCascade,
  toastPose,
  toastSlot,
  toastStackDuration,
  validateToastScript,
} from './toastScript'

/** A representative stack: one stayer, one that leaves, one late arrival. */
const SCRIPT: ToastSpec[] = [
  { title: 'Proceso adaptado', showAt: 10, hideAt: 120 },
  { title: 'App publicada', showAt: 40 },
  { title: 'Propuesta nueva', showAt: 200 },
]

describe('enterPhase / exitPhase', () => {
  const t = SCRIPT[0]

  it('rises 0→1 across [showAt, showAt + TOAST_ENTER], clamped', () => {
    expect(enterPhase(t, 0)).toBe(0)
    expect(enterPhase(t, t.showAt)).toBe(0)
    expect(enterPhase(t, t.showAt + TOAST_ENTER)).toBe(1)
    expect(enterPhase(t, 10_000)).toBe(1)
  })

  it('eases out (decelerates): first half covers more than half the rise', () => {
    expect(enterPhase(t, t.showAt + TOAST_ENTER / 2)).toBeGreaterThan(0.5)
  })

  it('grows monotonically frame by frame', () => {
    let prev = -1
    for (let f = t.showAt - 2; f <= t.showAt + TOAST_ENTER + 2; f++) {
      const cur = enterPhase(t, f)
      expect(cur).toBeGreaterThanOrEqual(prev)
      prev = cur
    }
  })

  it('exit is 0 until hideAt, 1 at hideAt + TOAST_EXIT, and 0 forever for a stayer', () => {
    expect(exitPhase(t, t.hideAt! - 1)).toBe(0)
    expect(exitPhase(t, t.hideAt!)).toBe(0)
    expect(exitPhase(t, t.hideAt! + TOAST_EXIT)).toBe(1)
    expect(exitPhase(SCRIPT[1], 10_000)).toBe(0)
  })

  it('exit eases in (accelerates): first half covers less than half the slide', () => {
    expect(exitPhase(t, t.hideAt! + TOAST_EXIT / 2)).toBeLessThan(0.5)
  })
})

describe('presence / isGone / isOnScreen', () => {
  const leaver = SCRIPT[0]

  it('presence is 0 before showAt, 1 settled, back to 0 after the exit', () => {
    expect(presence(leaver, 0)).toBe(0)
    expect(presence(leaver, leaver.showAt + TOAST_ENTER)).toBe(1)
    expect(presence(leaver, leaver.hideAt! + TOAST_EXIT)).toBe(0)
  })

  it('isGone only after the exit completes, never for a stayer', () => {
    expect(isGone(leaver, leaver.hideAt! + TOAST_EXIT - 1)).toBe(false)
    expect(isGone(leaver, leaver.hideAt! + TOAST_EXIT)).toBe(true)
    expect(isGone(SCRIPT[1], 1_000_000)).toBe(false)
  })

  it('isOnScreen spans [showAt, hideAt + TOAST_EXIT)', () => {
    expect(isOnScreen(leaver, leaver.showAt - 1)).toBe(false)
    expect(isOnScreen(leaver, leaver.showAt)).toBe(true)
    expect(isOnScreen(leaver, leaver.hideAt! + TOAST_EXIT - 1)).toBe(true)
    expect(isOnScreen(leaver, leaver.hideAt! + TOAST_EXIT)).toBe(false)
  })
})

describe('toastSlot', () => {
  it('keeps the newest toast at the anchor (slot 0)', () => {
    expect(toastSlot(SCRIPT, 1, 100)).toBe(0) // nothing newer present at 100
    expect(toastSlot(SCRIPT, 2, 10_000)).toBe(0)
  })

  it('pushes an older toast one slot per settled newer toast', () => {
    expect(toastSlot(SCRIPT, 0, 40 + TOAST_ENTER)).toBe(1)
  })

  it('pushes fractionally while a newer toast is entering', () => {
    const mid = toastSlot(SCRIPT, 0, 40 + TOAST_ENTER / 2)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })

  it('releases the slot when a newer toast leaves', () => {
    const script: ToastSpec[] = [
      { title: 'older', showAt: 0 },
      { title: 'newer', showAt: 30, hideAt: 60 },
    ]
    expect(toastSlot(script, 0, 59)).toBe(1)
    const leaving = toastSlot(script, 0, 60 + TOAST_EXIT / 2)
    expect(leaving).toBeLessThan(1)
    expect(toastSlot(script, 0, 60 + TOAST_EXIT)).toBe(0)
  })

  it('breaks showAt ties by script order (later = newer)', () => {
    const tie: ToastSpec[] = [
      { title: 'first', showAt: 0 },
      { title: 'second', showAt: 0 },
    ]
    const settled = TOAST_ENTER
    expect(toastSlot(tie, 0, settled)).toBe(1) // pushed by its newer twin
    expect(toastSlot(tie, 1, settled)).toBe(0)
  })

  it('a toast not yet shown displaces nothing', () => {
    expect(toastSlot(SCRIPT, 0, 39)).toBe(0) // toast 1 lands at 40, toast 2 at 200
  })
})

describe('toastPose', () => {
  const t = SCRIPT[0]

  it('starts the rise invisible, 12px below the anchor', () => {
    expect(toastPose(t, t.showAt)).toEqual({ opacity: 0, x: 0, y: 12 })
  })

  it('settles fully opaque at rest', () => {
    expect(toastPose(t, t.showAt + TOAST_ENTER)).toEqual({ opacity: 1, x: 0, y: 0 })
  })

  it('slides right and fades during the exit, ending invisible', () => {
    const mid = toastPose(t, t.hideAt! + TOAST_EXIT / 2)
    expect(mid.x).toBeGreaterThan(0)
    expect(mid.opacity).toBeLessThan(1)
    const end = toastPose(t, t.hideAt! + TOAST_EXIT)
    expect(end.opacity).toBe(0)
    expect(end.x).toBe(24)
  })

  it('is deterministic per frame', () => {
    for (const f of [0, 17, 124]) {
      expect(toastPose(t, f)).toEqual(toastPose(t, f))
    }
  })
})

describe('toastCascade', () => {
  const items = [{ title: 'a' }, { title: 'b', message: 'm' }, { title: 'c' }] as const

  it('staggers arrivals from startAt', () => {
    const script = toastCascade(items, { startAt: 50, stagger: 10 })
    expect(script.map((t) => t.showAt)).toEqual([50, 60, 70])
  })

  it('defaults to startAt 0 / stagger 12 and preserves authored fields', () => {
    const script = toastCascade(items)
    expect(script.map((t) => t.showAt)).toEqual([0, 12, 24])
    expect(script[1].message).toBe('m')
  })

  it('keeps an authored hideAt', () => {
    const script = toastCascade([{ title: 'x', hideAt: 99 }], { startAt: 5 })
    expect(script[0]).toMatchObject({ showAt: 5, hideAt: 99 })
  })
})

describe('toastStackDuration', () => {
  it('covers the last entrance or exit plus the tail', () => {
    // Latest event in SCRIPT: toast 2 settling at 200 + TOAST_ENTER.
    expect(toastStackDuration(SCRIPT, 45)).toBe(200 + TOAST_ENTER + 45)
    expect(toastStackDuration(SCRIPT, 0)).toBe(200 + TOAST_ENTER)
  })

  it('an exit later than every entrance sets the duration', () => {
    const script: ToastSpec[] = [{ title: 'x', showAt: 0, hideAt: 300 }]
    expect(toastStackDuration(script, 0)).toBe(300 + TOAST_EXIT)
  })

  it('is just the tail for an empty script', () => {
    expect(toastStackDuration([], 45)).toBe(45)
  })
})

describe('validateToastScript', () => {
  it('accepts the well-formed script', () => {
    expect(validateToastScript(SCRIPT)).toEqual([])
  })

  it('rejects an exit at or before the entrance', () => {
    expect(validateToastScript([{ title: 'x', showAt: 50, hideAt: 50 }])).toHaveLength(1)
    expect(validateToastScript([{ title: 'x', showAt: 50, hideAt: 20 }])).toHaveLength(1)
  })

  it('rejects a negative showAt', () => {
    expect(validateToastScript([{ title: 'x', showAt: -1 }])).toHaveLength(1)
  })
})
