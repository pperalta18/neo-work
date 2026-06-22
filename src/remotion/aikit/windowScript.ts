/**
 * windowScript.ts — pure frame-driven logic for the AppWindow entrance.
 * ─────────────────────────────────────────────────────────────────────
 * AppWindow is the kit's neumorphic app window (chrome + recessed viewport).
 * This module derives its entrance timeline as pure data so the choreography
 * is unit-testable and pieces can sequence against it (e.g. start a cursor
 * only once the window is settled).
 *
 * Entrance kinds:
 *   - 'draw' — the window's outline traces itself (GridDrawIn's frame gesture),
 *     then the solid plate + chrome materialise beneath and the hairline
 *     dissolves. The Prod01 "cada app se dibuja" entrance.
 *   - 'rise' — the whole window settles up from slightly below + faded (the
 *     chat-bubble idiom). For windows that join an already-running scene.
 *   - 'none' — already there; every phase reports settled.
 */

export type WindowEnter = 'draw' | 'rise' | 'none'

export type AppWindowTiming = {
  /** Frames the outline takes to trace the full perimeter ('draw'). */
  trace: number
  /** Pen-tip fade after the trace completes (the settle). */
  traceSettle: number
  /** The plate starts materialising this many frames before the trace ends. */
  surfaceOverlap: number
  /** Plate + relief + chrome fade-in duration. */
  surfaceIn: number
  /** Delay between chrome elements (dots → title → url) as they settle. */
  chromeStagger: number
  /** Viewport content fade-in duration (starts after the chrome leads). */
  contentIn: number
  /** Duration of the whole 'rise' entrance. */
  rise: number
}

/** Defaults @30fps, mapped to the motion tokens: the trace is a `grand`
 * traversal (full perimeter), the surface a `reveal`, content a `base`+. */
export const DEFAULT_WINDOW_TIMING: AppWindowTiming = {
  trace: 24,
  traceSettle: 11,
  surfaceOverlap: 6,
  surfaceIn: 14,
  chromeStagger: 4,
  contentIn: 12,
  rise: 12,
}

export type AppWindowTimeline = {
  enter: WindowEnter
  enterAt: number
  /** Outline tracing window — collapsed (start === end) unless 'draw'. */
  traceStart: number
  traceEnd: number
  /** Plate / relief / chrome fade-in window. */
  surfaceStart: number
  surfaceEnd: number
  /** Viewport content fade-in window. */
  contentStart: number
  contentEnd: number
  /** First frame everything is at rest — safe to start acting inside. */
  settledAt: number
}

/**
 * Derive the entrance timeline. Pure — the single source of truth shared by
 * the component and the scenes sequencing around the window.
 */
export function appWindowTimeline(
  enter: WindowEnter = 'none',
  enterAt = 0,
  timing: Partial<AppWindowTiming> = {},
): AppWindowTimeline {
  const t = { ...DEFAULT_WINDOW_TIMING, ...timing }

  if (enter === 'draw') {
    const traceStart = enterAt
    const traceEnd = enterAt + t.trace
    // never before the trace begins, even with an oversized overlap
    const surfaceStart = Math.max(enterAt, traceEnd - t.surfaceOverlap)
    const surfaceEnd = surfaceStart + t.surfaceIn
    const contentStart = surfaceStart + 2 * t.chromeStagger
    const contentEnd = contentStart + t.contentIn
    return {
      enter,
      enterAt,
      traceStart,
      traceEnd,
      surfaceStart,
      surfaceEnd,
      contentStart,
      contentEnd,
      settledAt: Math.max(traceEnd + t.traceSettle, surfaceEnd, contentEnd),
    }
  }

  if (enter === 'rise') {
    return {
      enter,
      enterAt,
      traceStart: enterAt,
      traceEnd: enterAt,
      surfaceStart: enterAt,
      surfaceEnd: enterAt + t.rise,
      contentStart: enterAt,
      contentEnd: enterAt + t.rise,
      settledAt: enterAt + t.rise,
    }
  }

  return {
    enter,
    enterAt,
    traceStart: enterAt,
    traceEnd: enterAt,
    surfaceStart: enterAt,
    surfaceEnd: enterAt,
    contentStart: enterAt,
    contentEnd: enterAt,
    settledAt: enterAt,
  }
}

/**
 * Linear 0→1 progress of `frame` across [start, end], clamped — degenerate
 * windows (end ≤ start, the collapsed phases above) become a step at `end`.
 * The visual layer shapes it with a motion CURVE; keeping the raw phase pure
 * avoids interpolate()'s monotonic-range crash on collapsed windows.
 */
export function phase(frame: number, start: number, end: number): number {
  if (end <= start) return frame >= end ? 1 : 0
  return Math.min(1, Math.max(0, (frame - start) / (end - start)))
}
