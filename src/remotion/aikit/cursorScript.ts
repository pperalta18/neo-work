/**
 * cursorScript.ts — pure frame-driven logic for the scripted cursor.
 * ──────────────────────────────────────────────────────────────────
 * The OS-pointer choreography (Cursor.tsx's controlled mode + StorePitchVideo's
 * press), extracted as pure functions of (script, frame) so every piece scripts
 * the cursor the same way and the behaviour is unit-testable without rendering.
 * ScriptedCursor is the visual shell on top of these.
 *
 * Timeline contract per waypoint:
 *   - `at`     — frame the cursor ARRIVES here, exactly on (x, y), at rest.
 *   - `travel` — the approach takes this many frames and ENDS at `at`; until it
 *     begins the cursor rests on the previous waypoint. Scenes that need the
 *     departure frame read `travelWindow(script, k).start`.
 *   - `click`  — press-and-release on arrival. The mousedown LANDS at
 *     `clickLandFrame(wp)` — sync the UI reaction (cell selects, button gives)
 *     to that frame, never to `at`.
 *   - `vanish` — last waypoint only: the pointer dissolves over these frames
 *     after arriving (the Prod05 "la UI sigue sola" beat).
 */
import { phase } from './windowScript'

/**
 * Standard OS pointers (no cartoon hands): `arrow` (default), `text` (I-beam),
 * `cell` (the thick white "+" a spreadsheet shows over cells), `crosshair` (the
 * thin "+" for a fill-handle drag). `hand`/`grab`/`grabbing` are kept for the
 * web-link / pan gestures but are no longer used by the desktop-app scenes.
 */
export type CursorGlyphState = 'arrow' | 'text' | 'cell' | 'crosshair' | 'hand' | 'grab' | 'grabbing'

export type CursorWaypoint = {
  /** Frame the cursor arrives here (at rest, exactly on x/y). */
  at: number
  x: number
  y: number
  /** Glyph adopted on arrival; persists until another waypoint changes it. */
  state?: CursorGlyphState
  /** Press-and-release on arrival; the click lands at `clickLandFrame(wp)`. */
  click?: boolean
  /** Frames the approach takes (ends at `at`). Default DEFAULT_TRAVEL. */
  travel?: number
  /** Fade the pointer out over this many frames after arriving. Last waypoint only. */
  vanish?: number
}

/** The pointer eases in over this window ending at the first waypoint (DUR.quick). */
export const CURSOR_FADE_IN = 7
/** Press dip down to the click (≈DUR.micro). */
export const CLICK_PRESS = 3
/** Spring back up after the click. */
export const CLICK_RELEASE = 4
/** Full press-and-release envelope. */
export const CLICK_SETTLE = CLICK_PRESS + CLICK_RELEASE
/** Ripple ring lifetime — the 0.45s CSS ripple of Cursor.tsx, in frames @30fps. */
export const RIPPLE_DUR = 14
/** Default approach duration — an unhurried reach (DUR.reveal). */
export const DEFAULT_TRAVEL = 15

/** The frame a waypoint's click actually lands (mousedown) — sync UI reactions here. */
export function clickLandFrame(wp: CursorWaypoint): number {
  return wp.at + CLICK_PRESS
}

/**
 * The approach window toward waypoint `k`: starts `travel` frames before the
 * arrival, clamped so it never begins before the previous waypoint's arrival.
 * Waypoint 0 has a collapsed window (the cursor starts there).
 */
export function travelWindow(
  script: readonly CursorWaypoint[],
  k: number,
): { start: number; end: number } {
  const wp = script[k]
  if (k <= 0) return { start: wp.at, end: wp.at }
  const start = Math.max(script[k - 1].at, wp.at - (wp.travel ?? DEFAULT_TRAVEL))
  return { start, end: wp.at }
}

/**
 * Press envelope for a click starting at `clickAt`: 0→1 dip over CLICK_PRESS,
 * back to 0 by CLICK_SETTLE. Scale the glyph by 1 − 0.12·press (the 0.88 of
 * Cursor.tsx).
 */
export function pressPose(frame: number, clickAt: number): number {
  return (
    phase(frame, clickAt, clickAt + CLICK_PRESS) -
    phase(frame, clickAt + CLICK_PRESS, clickAt + CLICK_SETTLE)
  )
}

/**
 * Ripple progress (0..1) for a click starting at `clickAt`, or null while no
 * ring is live. The ring is born the frame the click lands.
 */
export function ripplePose(frame: number, clickAt: number): number | null {
  const start = clickAt + CLICK_PRESS
  if (frame < start || frame >= start + RIPPLE_DUR) return null
  return (frame - start) / RIPPLE_DUR
}

export type CursorPose = {
  x: number
  y: number
  state: CursorGlyphState
  /** 0..1 press dip — scale the glyph by 1 − 0.12·press. */
  press: number
  /** 0..1 ripple progress, or null when no ring is live. */
  ripple: number | null
  opacity: number
  /** True mid-travel between waypoints. */
  moving: boolean
}

/**
 * The cursor's full pose at `frame`. Pure — the single source of truth shared
 * by the component and the scenes reacting to the cursor. `ease` shapes the
 * travel (the visual layer passes a motion CURVE; the linear default keeps the
 * module dependency-free and the tests honest).
 */
export function cursorPose(
  script: readonly CursorWaypoint[],
  frame: number,
  ease: (t: number) => number = (t) => t,
): CursorPose {
  if (script.length === 0) {
    return { x: 0, y: 0, state: 'arrow', press: 0, ripple: null, opacity: 0, moving: false }
  }

  // ── position: rest on a waypoint, or eased travel toward the next.
  let k = 0
  for (let j = 1; j < script.length; j++) {
    if (frame >= travelWindow(script, j).start) k = j
  }
  let x = script[k].x
  let y = script[k].y
  let moving = false
  if (k > 0) {
    const { start, end } = travelWindow(script, k)
    const t = phase(frame, start, end)
    if (t < 1) {
      const e = ease(t)
      const from = script[k - 1]
      x = from.x + (script[k].x - from.x) * e
      y = from.y + (script[k].y - from.y) * e
      moving = t > 0
    }
  }

  // ── glyph: the last arrived waypoint that declares one.
  let state: CursorGlyphState = 'arrow'
  for (const wp of script) {
    if (wp.at <= frame && wp.state) state = wp.state
  }

  // ── click: the latest waypoint whose press has begun drives both effects.
  let press = 0
  let ripple: number | null = null
  for (const wp of script) {
    if (wp.click && frame >= wp.at) {
      press = pressPose(frame, wp.at)
      ripple = ripplePose(frame, wp.at)
    }
  }

  // ── visibility: ease in at the start; dissolve after a `vanish` waypoint.
  let opacity = phase(frame, script[0].at - CURSOR_FADE_IN, script[0].at)
  for (const wp of script) {
    if (wp.vanish != null && frame >= wp.at) {
      opacity *= 1 - phase(frame, wp.at, wp.at + wp.vanish)
    }
  }

  return { x, y, state, press, ripple, opacity, moving }
}

/** Composition duration that covers the whole script (ripples, vanish) plus a held tail. */
export function cursorScriptDuration(script: readonly CursorWaypoint[], tailFrames = 45): number {
  return (
    script.reduce((max, wp) => {
      const clickEnd = wp.click ? clickLandFrame(wp) + RIPPLE_DUR : wp.at
      const vanishEnd = wp.at + (wp.vanish ?? 0)
      return Math.max(max, wp.at, clickEnd, vanishEnd)
    }, 0) + tailFrames
  )
}

/**
 * Sanity-check an authored script. Returns human-readable problems (empty =
 * valid): arrivals must be ordered, approaches must fit the gap they're given
 * (a click needs its settle before the cursor leaves), vanish closes the act.
 */
export function validateCursorScript(script: readonly CursorWaypoint[]): string[] {
  const errors: string[] = []
  script.forEach((wp, i) => {
    const travel = wp.travel ?? DEFAULT_TRAVEL
    if (travel <= 0) {
      errors.push(`waypoint ${i}: travel must be positive (got ${wp.travel})`)
    }
    if (wp.vanish != null && wp.vanish <= 0) {
      errors.push(`waypoint ${i}: vanish must be positive (got ${wp.vanish})`)
    }
    if (wp.vanish != null && i !== script.length - 1) {
      errors.push(`waypoint ${i}: vanish belongs on the last waypoint`)
    }
    if (i === 0) return
    const prev = script[i - 1]
    if (wp.at <= prev.at) {
      errors.push(`waypoint ${i}: at ${wp.at} must arrive after waypoint ${i - 1} (${prev.at})`)
      return
    }
    const busyUntil = prev.at + (prev.click ? CLICK_SETTLE : 0)
    if (wp.at - travel < busyUntil) {
      errors.push(
        `waypoint ${i}: travel ${travel} would depart at ${wp.at - travel}, before waypoint ${
          i - 1
        } ${prev.click ? 'finishes its click' : 'arrives'} (${busyUntil})`,
      )
    }
  })
  return errors
}
