import type { CursorState } from './Cursor'

/**
 * cursorTimeline — pure choreography for the Cursor.
 * ───────────────────────────────────────────────────
 * A scripted cursor move is a list of keyframes (where to be, when, in what
 * state). `sampleCursorTimeline(kfs, t)` is a PURE function of time → it returns
 * the cursor props at instant `t`. Drive `t` from a rAF clock today
 * (`useCursorTimeline`) or from Remotion's `useCurrentFrame()` later — same
 * function, frame-perfect either way.
 */

export type Pt = { x: number; y: number }

export type EaseName = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring'

export type CursorKeyframe = {
  /** Position the cursor REACHES at time `t`. */
  at: Pt
  /** Time in ms when the cursor arrives at `at`. */
  t: number
  /** State active from this keyframe onward (defaults to the previous one). */
  state?: CursorState
  /** Easing for the segment leading INTO this keyframe. */
  ease?: EaseName
  /** Play a click ripple on arrival. */
  click?: boolean
}

export type CursorSample = {
  at: Pt
  state: CursorState
  clicking: boolean
}

const EASES: Record<EaseName, (x: number) => number> = {
  linear: (x) => x,
  easeIn: (x) => x * x,
  easeOut: (x) => 1 - (1 - x) * (1 - x),
  easeInOut: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
  // "Back out" easing: eases out with a slight overshoot then settles — the
  // designed, springy feel without a full physics sim.
  spring: (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    const c = 1.70158 * 1.2
    return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2)
  },
}

/** Total duration of a timeline (ms) — the last keyframe time. */
export function timelineDuration(kfs: CursorKeyframe[]): number {
  return kfs.length ? kfs[kfs.length - 1].t : 0
}

/** Window (ms) during which a `click` keyframe reports `clicking: true`. */
const CLICK_WINDOW = 90

/** Sample the cursor props at time `t` (ms). Pure. */
export function sampleCursorTimeline(kfs: CursorKeyframe[], t: number): CursorSample {
  if (kfs.length === 0) return { at: { x: 0, y: 0 }, state: 'arrow', clicking: false }
  if (t <= kfs[0].t) {
    return { at: kfs[0].at, state: kfs[0].state ?? 'arrow', clicking: false }
  }
  const last = kfs[kfs.length - 1]
  if (t >= last.t) {
    const clicking = !!last.click && t - last.t <= CLICK_WINDOW
    return { at: last.at, state: stateAt(kfs, t), clicking }
  }

  // Find the segment [a, b] containing t.
  let b = 1
  while (b < kfs.length && kfs[b].t < t) b++
  const a = kfs[b - 1]
  const kb = kfs[b]
  const span = kb.t - a.t || 1
  const raw = (t - a.t) / span
  const eased = EASES[kb.ease ?? 'easeInOut'](Math.max(0, Math.min(1, raw)))

  const at = {
    x: a.at.x + (kb.at.x - a.at.x) * eased,
    y: a.at.y + (kb.at.y - a.at.y) * eased,
  }

  // A click registers in a short window right after arriving at a keyframe.
  const clicking = kfs.some((k) => k.click && t >= k.t && t - k.t <= CLICK_WINDOW)

  return { at, state: stateAt(kfs, t), clicking }
}

/** The active state = the latest keyframe (with a state) whose time has passed. */
function stateAt(kfs: CursorKeyframe[], t: number): CursorState {
  let state: CursorState = kfs[0].state ?? 'arrow'
  for (const k of kfs) {
    if (k.t <= t && k.state) state = k.state
  }
  return state
}
