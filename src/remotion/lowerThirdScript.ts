/**
 * lowerThirdScript — frame-driven choreography for the speaker nameplate
 * ("letrero de ponente"). Pure math + constants; `LowerThirdVideo` is a thin
 * renderer that reads these every frame.
 * ──────────────────────────────────────────────────────────────────────────
 * Apple/Google motion-design voice: type IS the design. No card, no grid — just
 * a hairline brand accent and a masked TEXT RISE (each line eases up into view
 * from behind an invisible baseline), staggered, with a confident quint-out.
 * Light type + a soft shadow carry it over the speaker's video (alpha export).
 *   1. ACCENT — a short blue kicker rule wipes in.
 *   2. RISE   — name rises into view; role follows a beat later.
 *   3. HOLD   — static plate the editor can sit on / trim.
 *   4. OUT    — the lockup drifts down a touch and fades.
 *
 * Keep all timing/easing HERE; the component never computes easings.
 */

export const FPS = 30

export const CANVAS_W = 1920
export const CANVAS_H = 1080

/** Lower-left anchor (generous margins — let it breathe). */
export const MARGIN_X = 150
export const MARGIN_BOTTOM = 150

// ── timeline (frames @30fps) ────────────────────────────────────────────────
export const KICK_START = 2
export const KICK_LEN = 22
export const NAME_START = 7
export const NAME_LEN = 24
export const ROLE_START = 16
export const ROLE_LEN = 22
export const REVEAL_END = ROLE_START + ROLE_LEN

export const HOLD = 112 // static hold (~3.7s) — extend freely for the editor
export const OUT = 22
export const OUT_START = REVEAL_END + HOLD

/** Total composition length in frames. */
export const DURATION = OUT_START + OUT

// ── easing helpers ──────────────────────────────────────────────────────────
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Linear 0→1 over a window. */
export const ramp01 = (frame: number, start: number, len: number) => clamp01((frame - start) / len)

/** Confident decelerations for type — fast out, soft settle, no bounce. */
export const easeOutQuint = (t: number) => 1 - Math.pow(1 - clamp01(t), 5)
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3)
export const easeInCubic = (t: number) => Math.pow(clamp01(t), 3)

// ── frame-driven reads ──────────────────────────────────────────────────────
/** Blue kicker rule: scaleX 0→1 (origin left). */
export const kickReveal = (f: number) => easeOutCubic(ramp01(f, KICK_START, KICK_LEN))

/** Name: vertical rise 0→1 (translateY %), and its own fade. */
export const nameRise = (f: number) => easeOutQuint(ramp01(f, NAME_START, NAME_LEN))
export const nameFade = (f: number) => easeOutCubic(ramp01(f, NAME_START, NAME_LEN * 0.6))

/** Role: rise + fade, a beat behind the name. */
export const roleRise = (f: number) => easeOutQuint(ramp01(f, ROLE_START, ROLE_LEN))
export const roleFade = (f: number) => easeOutCubic(ramp01(f, ROLE_START, ROLE_LEN * 0.6))

/** Outro: ease-in fade (hangs, then leaves) + downward drift in px. */
export const outProg = (f: number) => easeInCubic(ramp01(f, OUT_START, OUT))
export const globalOut = (f: number) => 1 - outProg(f)
