import { describe, expect, it } from 'vitest'
import {
  CLICK_PRESS,
  CLICK_SETTLE,
  CURSOR_FADE_IN,
  DEFAULT_TRAVEL,
  RIPPLE_DUR,
  type CursorWaypoint,
  clickLandFrame,
  cursorPose,
  cursorScriptDuration,
  pressPose,
  ripplePose,
  travelWindow,
  validateCursorScript,
} from './cursorScript'

/** A representative three-act script: enter → click a target → leave + vanish. */
const SCRIPT: CursorWaypoint[] = [
  { at: 10, x: 100, y: 100 },
  { at: 40, x: 300, y: 200, state: 'hand', click: true, travel: 20 },
  { at: 80, x: 500, y: 400, state: 'arrow', travel: 15, vanish: 20 },
]

describe('cursorPose · rest & travel', () => {
  it('rests on the first waypoint before anything begins', () => {
    const p = cursorPose(SCRIPT, 0)
    expect(p.x).toBe(100)
    expect(p.y).toBe(100)
    expect(p.moving).toBe(false)
  })

  it('holds the previous waypoint until the approach departs', () => {
    const { start } = travelWindow(SCRIPT, 1)
    expect(start).toBe(20) // 40 − travel 20
    const p = cursorPose(SCRIPT, start)
    expect(p.x).toBe(100)
    expect(p.moving).toBe(false)
  })

  it('interpolates the travel (linear with the default ease)', () => {
    const p = cursorPose(SCRIPT, 30) // halfway through [20, 40]
    expect(p.x).toBeCloseTo(200)
    expect(p.y).toBeCloseTo(150)
    expect(p.moving).toBe(true)
  })

  it('arrives exactly on the waypoint at `at` and rests there', () => {
    expect(cursorPose(SCRIPT, 40)).toMatchObject({ x: 300, y: 200, moving: false })
    expect(cursorPose(SCRIPT, 55)).toMatchObject({ x: 300, y: 200, moving: false })
  })

  it('shapes the travel with the provided ease', () => {
    const p = cursorPose(SCRIPT, 30, (t) => t * t) // t = 0.5 → e = 0.25
    expect(p.x).toBeCloseTo(100 + 200 * 0.25)
  })

  it('clamps an oversized travel so it departs no earlier than the previous arrival', () => {
    const script: CursorWaypoint[] = [
      { at: 10, x: 0, y: 0 },
      { at: 30, x: 100, y: 0, travel: 999 },
    ]
    expect(travelWindow(script, 1)).toEqual({ start: 10, end: 30 })
    // midpoint of the clamped window [10, 30]
    expect(cursorPose(script, 20).x).toBeCloseTo(50)
  })

  it('uses DEFAULT_TRAVEL when none is given', () => {
    const script: CursorWaypoint[] = [
      { at: 0, x: 0, y: 0 },
      { at: 100, x: 10, y: 0 },
    ]
    expect(travelWindow(script, 1).start).toBe(100 - DEFAULT_TRAVEL)
  })

  it('waypoint 0 has a collapsed travel window', () => {
    expect(travelWindow(SCRIPT, 0)).toEqual({ start: 10, end: 10 })
  })

  it('an empty script poses hidden', () => {
    expect(cursorPose([], 50)).toMatchObject({ opacity: 0, press: 0, ripple: null })
  })
})

describe('cursorPose · glyph state', () => {
  it('defaults to arrow and only adopts a state on ARRIVAL', () => {
    expect(cursorPose(SCRIPT, 39).state).toBe('arrow') // still travelling
    expect(cursorPose(SCRIPT, 40).state).toBe('hand')
  })

  it('persists the state until another waypoint declares one', () => {
    expect(cursorPose(SCRIPT, 79).state).toBe('hand')
    expect(cursorPose(SCRIPT, 80).state).toBe('arrow')
  })
})

describe('click · press & ripple', () => {
  const CLICK_AT = SCRIPT[1].at // 40

  it('the press dips to 1 at the land frame and settles back to 0', () => {
    expect(pressPose(CLICK_AT - 1, CLICK_AT)).toBe(0)
    expect(pressPose(CLICK_AT + CLICK_PRESS, CLICK_AT)).toBe(1)
    expect(pressPose(CLICK_AT + CLICK_SETTLE, CLICK_AT)).toBe(0)
    expect(pressPose(CLICK_AT + 999, CLICK_AT)).toBe(0)
  })

  it('clickLandFrame = arrival + CLICK_PRESS', () => {
    expect(clickLandFrame(SCRIPT[1])).toBe(CLICK_AT + CLICK_PRESS)
  })

  it('the ripple is born the frame the click lands and dies after RIPPLE_DUR', () => {
    const land = clickLandFrame(SCRIPT[1])
    expect(ripplePose(land - 1, CLICK_AT)).toBeNull()
    expect(ripplePose(land, CLICK_AT)).toBe(0)
    expect(ripplePose(land + RIPPLE_DUR - 1, CLICK_AT)).toBeCloseTo((RIPPLE_DUR - 1) / RIPPLE_DUR)
    expect(ripplePose(land + RIPPLE_DUR, CLICK_AT)).toBeNull()
  })

  it('the pose carries the active click; quiet frames carry none', () => {
    expect(cursorPose(SCRIPT, CLICK_AT + CLICK_PRESS)).toMatchObject({ press: 1, ripple: 0 })
    expect(cursorPose(SCRIPT, CLICK_AT - 5)).toMatchObject({ press: 0, ripple: null })
    expect(cursorPose(SCRIPT, CLICK_AT + 30)).toMatchObject({ press: 0, ripple: null })
  })
})

describe('visibility · fade-in & vanish', () => {
  it('eases in across the CURSOR_FADE_IN window ending at the first waypoint', () => {
    const first = SCRIPT[0].at
    expect(cursorPose(SCRIPT, first - CURSOR_FADE_IN).opacity).toBe(0)
    expect(cursorPose(SCRIPT, first - 3).opacity).toBeCloseTo(4 / CURSOR_FADE_IN)
    expect(cursorPose(SCRIPT, first).opacity).toBe(1)
  })

  it('dissolves over the vanish window after arriving at the flagged waypoint', () => {
    expect(cursorPose(SCRIPT, 80).opacity).toBe(1)
    expect(cursorPose(SCRIPT, 90).opacity).toBeCloseTo(0.5)
    expect(cursorPose(SCRIPT, 100).opacity).toBe(0)
    expect(cursorPose(SCRIPT, 999).opacity).toBe(0)
  })
})

describe('cursorScriptDuration', () => {
  it('covers the vanish end plus the tail', () => {
    expect(cursorScriptDuration(SCRIPT, 0)).toBe(100) // 80 + vanish 20
    expect(cursorScriptDuration(SCRIPT)).toBe(145) // default 45-frame tail
  })

  it('covers a final ripple when the script ends on a click', () => {
    const script: CursorWaypoint[] = [
      { at: 0, x: 0, y: 0 },
      { at: 40, x: 10, y: 0, click: true },
    ]
    expect(cursorScriptDuration(script, 0)).toBe(40 + CLICK_PRESS + RIPPLE_DUR)
  })
})

describe('validateCursorScript', () => {
  it('accepts the representative script and an empty one', () => {
    expect(validateCursorScript(SCRIPT)).toEqual([])
    expect(validateCursorScript([])).toEqual([])
  })

  it('flags out-of-order arrivals', () => {
    const bad: CursorWaypoint[] = [
      { at: 50, x: 0, y: 0 },
      { at: 50, x: 1, y: 1, travel: 5 },
    ]
    expect(validateCursorScript(bad).join()).toMatch(/must arrive after/)
  })

  it('flags an approach that does not fit the gap', () => {
    const bad: CursorWaypoint[] = [
      { at: 10, x: 0, y: 0 },
      { at: 20, x: 1, y: 1, travel: 15 }, // would depart at 5, before 10
    ]
    expect(validateCursorScript(bad).join()).toMatch(/would depart/)
  })

  it('flags departing before the previous click settles', () => {
    const bad: CursorWaypoint[] = [
      { at: 10, x: 0, y: 0, click: true },
      { at: 20, x: 1, y: 1, travel: 5 }, // departs at 15 < 10 + CLICK_SETTLE
    ]
    expect(validateCursorScript(bad).join()).toMatch(/finishes its click/)
  })

  it('flags vanish anywhere but the last waypoint, and non-positive params', () => {
    const bad: CursorWaypoint[] = [
      { at: 10, x: 0, y: 0, vanish: 10 },
      { at: 50, x: 1, y: 1, travel: 0 },
      { at: 90, x: 2, y: 2, vanish: -3 },
    ]
    const errors = validateCursorScript(bad).join()
    expect(errors).toMatch(/vanish belongs on the last/)
    expect(errors).toMatch(/travel must be positive/)
    expect(errors).toMatch(/vanish must be positive/)
  })
})
