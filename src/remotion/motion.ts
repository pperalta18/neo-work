/**
 * motion.ts — AiKit's motion-for-video language. Single source of truth for the
 * named easing curves + duration tokens shared across Remotion scenes.
 * See specs/motion-language.md for the rationale (beats, principles, research).
 *
 * House rule: ease-out, NO bounce. We use eased `interpolate`, never an
 * overshooting `spring()` — a render has no gesture velocity to hand off, and
 * the AiKit look is calm, not playful.
 */
import { Easing, interpolate } from 'remotion';

/**
 * The Material 3 "emphasized" set — the benchmark video easing: snappy take-off,
 * soft landing. Exact béziers.
 */
export const CURVE = {
  enter: Easing.bezier(0.05, 0.7, 0.1, 1), // decelerate — appears / arrives  (DEFAULT)
  exit: Easing.bezier(0.3, 0, 0.8, 0.15), // accelerate — leaves / dissolves
  standard: Easing.bezier(0.2, 0, 0, 1), // on-screen moves, sweeps, camera
} as const;

/**
 * Duration tokens in frames @30fps (the ms in the spec, rounded). Pick by how far
 * the element travels: small move → short, full-frame move → long.
 */
export const DUR = {
  micro: 4, // ~130ms · tiny state flips, accents
  quick: 7, // ~230ms · small elements appearing
  base: 10, // ~330ms · the workhorse reveal
  reveal: 15, // ~500ms · a hero element forming
  grand: 21, // ~700ms · large traversals across the frame
} as const;

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Eased 0→1 progress of `frame` across [start, end], clamped. Ease-out by default. */
export const ease = (frame: number, start: number, end: number, curve = CURVE.enter) =>
  interpolate(frame, [start, end], [0, 1], { ...CLAMP, easing: curve });
