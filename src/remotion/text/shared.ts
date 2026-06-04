/**
 * text/shared.ts — the kinetic-typography toolkit
 * ──────────────────────────────────────────────────────────────────────────
 * A small, flat (NON-neumorphic) design system for animated headings / titles
 * that appear in AiKit motion-graphics videos. Each "variant" is a self-contained
 * React component that renders one headline with one reveal technique, driven
 * purely by `useCurrentFrame()` (deterministic — no Date/random).
 *
 * Shared rules (so every variant reads as one family):
 *   · Flat type on a clean surface. NO neumorphic relief, NO coloured glows.
 *   · Motion grammar = the house ./motion tokens (ease-out, NO bounce/spring).
 *   · Display weight for the hero line; one accent colour (KIT_BLUE) only.
 *   · A variant ENTERS, HOLDS, and (optionally) settles inside its `duration`.
 *
 * The only things borrowed from the neumorphism lib are the *brand tokens*
 * (font families + KIT_BLUE) — not the relief engine.
 */
import { Easing, interpolate } from 'remotion';
import { DISPLAY_FONT, TEXT_FONT, KIT_BLUE } from '@/lib/neumorphism';

// Re-export so a variant has ONE import site for everything it needs.
export { DISPLAY_FONT, TEXT_FONT, KIT_BLUE };
export { CURVE, DUR, ease } from '../motion';

// ── palette ───────────────────────────────────────────────────────────────
export type Palette = {
  /** Scene background. */
  bg: string;
  /** Primary headline colour. */
  fg: string;
  /** Secondary / subtitle colour. */
  muted: string;
  /** The one accent — KIT_BLUE by default. */
  accent: string;
  /** A hairline / divider colour (low-contrast). */
  line: string;
};

/** The default — a clean light surface, brand blue accent. */
export const PALETTE: Palette = {
  bg: '#f5f6fa',
  fg: '#13131a',
  muted: '#6b6b86',
  accent: KIT_BLUE,
  line: 'rgba(20,20,30,0.10)',
};

/** A dark theatrical surface for high-contrast title cards. */
export const DARK_PALETTE: Palette = {
  bg: '#0c0d12',
  fg: '#f5f6fb',
  muted: '#9a9ab8',
  accent: '#4d9bff',
  line: 'rgba(255,255,255,0.12)',
};

// ── the contract every variant implements ──────────────────────────────────
export type TextAnimProps = {
  /** The hero line. Variants may split it into words / characters. */
  text: string;
  /** Optional secondary line (eyebrow, kicker or subtitle). */
  subtitle?: string;
  /** Colour scheme; defaults to PALETTE. */
  palette?: Palette;
};

/** A registry entry — the unit the showcase & the picker iterate over. */
export type TextAnim = {
  id: string;
  /** Human label (shown on the showcase chip). */
  name: string;
  /** One-line description of the technique. */
  blurb: string;
  /** Frames this variant needs to enter + hold (standalone & per showcase segment). */
  duration: number;
  Component: React.FC<TextAnimProps>;
};

/**
 * EASE — the refined, cinematic easing set for the text library.
 * ──────────────────────────────────────────────────────────────────────────
 * Smoother takeoff and a long, elegant settle than the blunt CURVE.* tokens —
 * but still strictly ease-out / no overshoot (control-point y stays ≤ 1, so
 * nothing bounces; house rule intact). These are the defaults for the headline
 * reveals; CURVE.* stays exported for any scene that wants the old feel.
 *
 *   out      expo-out: the default decelerate for type appearing / arriving
 *   outSoft  gentler, longer tail — large traversals & secondary motion
 *   outQuint crisp-but-smooth — small accents, short reveals
 *   inOut    smooth at both ends — camera dollies, light sweeps, wipes
 */
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  outSoft: Easing.bezier(0.22, 1, 0.4, 1),
  outQuint: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
} as const;

// ── tiny math helpers ───────────────────────────────────────────────────────
export const clampE = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const RAD = Math.PI / 180;

/** Eased progress of `frame` across [start, end] → [0,1], clamped. Expo-out by default. */
export const prog = (
  frame: number,
  start: number,
  end: number,
  easing: (t: number) => number = EASE.out,
) => interpolate(frame, [start, end], [0, 1], { ...clampE, easing });

/** Split a string into trimmed words (whitespace collapsed). */
export const splitWords = (s: string): string[] => s.trim().split(/\s+/).filter(Boolean);

/** Split into individual characters (spaces preserved, as a NBSP for layout). */
export const splitChars = (s: string): string[] => Array.from(s);

/** Per-index start frame for a staggered sequence. */
export const stagger = (i: number, step: number, base = 0) => base + i * step;

/**
 * A symmetrical enter→hold→exit envelope (0→1→…→1→0). `inDur`/`outDur` are the
 * ramp lengths; the middle is a flat hold at 1. Use it to fade a whole scene or
 * an overlay in and back out across `total` frames.
 */
export const envelope = (
  frame: number,
  total: number,
  inDur: number,
  outDur: number,
  easing: (t: number) => number = EASE.out,
) => {
  const enter = interpolate(frame, [0, inDur], [0, 1], { ...clampE, easing });
  const exit = interpolate(frame, [total - outDur, total], [1, 0], { ...clampE, easing });
  return Math.min(enter, exit);
};
