/**
 * trace.ts — pure stroke-trace math for self-drawing lines.
 * ─────────────────────────────────────────────────────────
 * The dash mechanics GridDrawIn pioneered (a neutral "ink" revealed up to the
 * draw front + an accent tip riding that front), extracted as pure functions
 * so any kit piece can trace any SVG path the same way: AppWindow's outline
 * entrance, BaGraph's comet edges, future connector draws. Unit-testable
 * without rendering; the visual layer just spreads the returned dash attrs.
 *
 * Coordinate model: a path of real length `length` px. The draw front sits at
 * `progress * length`. The permanent ink uses pathLength=1 normalisation (no
 * length math needed); the tip segments use real px so their size is anchored
 * to `unit` (a reference cell, not the path), keeping proportions at any scale.
 */

export type TraceStyle =
  /** A blue "pen" draws the line, then dries to the neutral hairline. */
  | 'pen'
  /** Drawn straight in the resting neutral hairline — silent. */
  | 'hairline'
  /** A bright leading head with a long trail — for live connections. */
  | 'comet'

export type TipSeg = {
  /** Segment length as a fraction of `unit`. */
  len: number
  opacity: number
  /** Extra stroke width over the base line. */
  width: number
}

/** The pen profile: a bright moving tip fading through a ~1-cell trail. */
export const PEN_TIP: readonly TipSeg[] = [
  { len: 0.12, opacity: 1, width: 0.4 },
  { len: 0.34, opacity: 0.55, width: 0.2 },
  { len: 0.66, opacity: 0.3, width: 0.05 },
  { len: 1.1, opacity: 0.12, width: 0 },
]

/** The comet profile: brighter head, longer tail — reads as energy in motion. */
export const COMET_TIP: readonly TipSeg[] = [
  { len: 0.1, opacity: 1, width: 1 },
  { len: 0.32, opacity: 0.62, width: 0.4 },
  { len: 0.72, opacity: 0.34, width: 0.1 },
  { len: 1.35, opacity: 0.16, width: 0 },
]

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * Dash attrs for the permanent neutral ink, revealed up to the draw front.
 * Spread onto any SVG shape: pathLength=1 normalises the path so the reveal
 * needs no length math — scales for free.
 */
export function inkReveal(progress: number): {
  pathLength: number
  strokeDasharray: number
  strokeDashoffset: number
} {
  return { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - clamp01(progress) }
}

export type TipDash = {
  strokeDasharray: string
  strokeDashoffset: number
  opacity: number
  /** Add to the base stroke width. */
  widthDelta: number
}

/**
 * The accent tip riding the draw front: stacked segments that all END at the
 * front, opacity decreasing as they reach back — only the leading edge glows
 * and it fades into the ink behind. `fade` (0..1) lifts the whole tip off once
 * the line completes (the settle). Returns [] for 'hairline' or a dead fade.
 */
export function tipDashes(
  progress: number,
  length: number,
  unit: number,
  style: TraceStyle = 'pen',
  fade = 1,
): TipDash[] {
  if (style === 'hairline' || fade <= 0.001 || progress <= 0) return []
  const front = clamp01(progress) * length
  const profile = style === 'comet' ? COMET_TIP : PEN_TIP
  return profile.map((seg) => {
    const segLen = seg.len * unit
    return {
      // a single lit segment of `segLen` px ending exactly at the front
      strokeDasharray: `${segLen} ${length + segLen}`,
      strokeDashoffset: segLen - front,
      opacity: seg.opacity * fade,
      widthDelta: seg.width,
    }
  })
}

/**
 * Perimeter of a rounded rect — the real path length the tip math needs when
 * tracing an outline. `r` is clamped to the largest geometrically valid radius.
 */
export function roundedRectPerimeter(w: number, h: number, r: number): number {
  const rr = Math.min(Math.max(0, r), Math.min(w, h) / 2)
  return 2 * (w - 2 * rr) + 2 * (h - 2 * rr) + 2 * Math.PI * rr
}
