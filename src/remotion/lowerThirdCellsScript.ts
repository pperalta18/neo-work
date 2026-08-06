/**
 * lowerThirdCellsScript — choreography for the "cells" speaker nameplate.
 * ──────────────────────────────────────────────────────────────────────────
 * SkillForge / StoreFlow ELEVATION PILLS in DARK mode, no background grid — small,
 * elegant cells rising on transparent (alpha), lower-left:
 *   [ icon · Pablo Yusta ]  ›  [ icon · Founder of AiKit ]
 *
 * Motion craft: each cell RISES with a soft spring overshoot + a focus-in blur,
 * then its CONTENT (icon + label) populates a beat later; the connector chevron
 * gives a small one-shot nudge in the flow direction. Out = blur + scale + fade.
 *
 * Pure math + constants only; `LowerThirdCellsVideo` is a thin renderer.
 */

export const FPS = 30

export const CANVAS_W = 1920
export const CANVAS_H = 1080

/** Lower-left anchor — low and tucked in. */
export const MARGIN_X = 88
export const MARGIN_BOTTOM = 88
export const PILL_H = 84
export const GAP = 16

// ── timeline (frames @30fps) ────────────────────────────────────────────────
export const NAME_START = 4
export const ARROW_START = 12
export const TITLE_START = 18
export const RISE = 17
export const CONTENT_DELAY = 4 // content fills the pill a beat after the plate
/** Per-cell start frames, in render order. */
export const STARTS = [NAME_START, ARROW_START, TITLE_START]
export const REVEAL_END = TITLE_START + CONTENT_DELAY + RISE

export const HOLD = 112 // static hold (~3.7s) — extend freely for the editor
export const OUT = 24
export const OUT_START = REVEAL_END + HOLD

/** Total composition length in frames. */
export const DURATION = OUT_START + OUT

// ── easing helpers ──────────────────────────────────────────────────────────
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const ramp01 = (frame: number, start: number, len: number) => clamp01((frame - start) / len)
export const easeOutQuad = (t: number) => 1 - (1 - clamp01(t)) * (1 - clamp01(t))
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3)
export const easeInCubic = (t: number) => Math.pow(clamp01(t), 3)
/** Decelerate with a gentle overshoot past 1 then settle to exactly 1 (spring-ish). */
export const easeOutBack = (t: number, s = 1.1) => {
  const x = clamp01(t) - 1
  return 1 + x * x * ((s + 1) * x + s)
}

// ── frame-driven reads ──────────────────────────────────────────────────────
/** Spring-ish rise 0→(overshoot)→1 — drives scale + translateY of the plate. */
export const cellRise = (frame: number, start: number) => easeOutBack(ramp01(frame, start, RISE), 1.1)
/** Monotonic settle 0→1 — drives opacity + relief depth (never overshoots). */
export const cellSettle = (frame: number, start: number) => easeOutCubic(ramp01(frame, start, RISE))
/** Focus-in blur 1→0 (px multiplier). */
export const cellBlur = (frame: number, start: number) => 1 - easeOutQuad(ramp01(frame, start, RISE * 0.7))
/** Content (icon + label) populates the pill, a beat behind the plate. */
export const contentIn = (frame: number, start: number) =>
  easeOutCubic(ramp01(frame, start + CONTENT_DELAY, RISE * 0.7))

/** One-shot nudge of the connector chevron in the flow direction (px). */
export const arrowNudge = (frame: number) => {
  const t = ramp01(frame, ARROW_START + RISE + 5, 16)
  return Math.sin(t * Math.PI) * 4
}

/** Outro 0→1 (drives fade + downward drift + blur + slight scale-down). */
export const outProg = (frame: number) => easeInCubic(ramp01(frame, OUT_START, OUT))
export const globalOut = (frame: number) => 1 - outProg(frame)
