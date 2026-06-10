/**
 * heroAltFamiliesKit — shared primitives for the "Ojos, manos, repetible" hero (alt B).
 * ──────────────────────────────────────────────────────────────────────────────
 * House motion language (specs/motion-language.md): Material 3 "emphasized" set,
 * ease-out as default, NO bounce. Everything here is a pure function of `frame`
 * (no Date/random) so the render is deterministic.
 */
import { Easing, interpolate } from 'remotion';
import { KIT_BLUE, lightTheme } from '@/lib/neumorphism';
import { MODULES, type ModuleName, type ModuleSpec } from '@/stories/neo/modules/modules';

export { KIT_BLUE };

// ── canvas ──────────────────────────────────────────────────────────────────
export const W = 1920;
export const H = 1080;

// ── house curves (Material 3 emphasized) ──────────────────────────────────────
export const CURVE = {
  enter: Easing.bezier(0.05, 0.7, 0.1, 1), // decelerate — appears / arrives (DEFAULT)
  exit: Easing.bezier(0.3, 0, 0.8, 0.15), //  accelerate — leaves / dissolves
  standard: Easing.bezier(0.2, 0, 0, 1), //   on-screen moves, sweeps, camera
} as const;

// ── pure helpers ──────────────────────────────────────────────────────────────
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
/** Deterministic 0..1 hash (no Date/random) — Math.sin folding. */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 11.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Eased ramp from 0→1 over [a,b]; clamps at the ends. */
export const ramp = (f: number, a: number, b: number, curve = CURVE.enter) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: curve });

/** A reveal-then-hide window: 0 → 1 over [in0,in1], hold, → 0 over [out0,out1]. */
export const window4 = (f: number, in0: number, in1: number, out0: number, out1: number) => {
  const up = ramp(f, in0, in1, CURVE.enter);
  const down = 1 - ramp(f, out0, out1, CURVE.exit);
  return Math.min(up, down);
};

// ── palette (no glows — relief + contrast only) ────────────────────────────────
export const INK = lightTheme.textStrong; // '#1e1e20'
export const MUTED = lightTheme.textMuted; // '#6c6c89'
export const HAIRLINE = 'rgba(120,134,160,0.22)';
export const FAINT = 'rgba(120,134,160,0.12)';
export const SURFACE = lightTheme.surface;

export const DISPLAY = "'Universal Sans Display', ui-sans-serif, system-ui, sans-serif";
export const TEXT = "'Universal Sans Text', ui-sans-serif, system-ui, sans-serif";

// ── module icon access (real brand SVGs) ──────────────────────────────────────
export type IconSpec = { src: string; name: string; rotate: number };
export const icon = (key: ModuleName): IconSpec => {
  const m = MODULES[key] as ModuleSpec;
  return { src: m.icon, name: m.name, rotate: m.rotate ?? 0 };
};

// ── slide timing (frames @30fps) ───────────────────────────────────────────────
// Sibling grammar: the four slides share the same title anchor + cross-fade gram.
export const SLIDES = {
  controla: { start: 0, end: 96 },
  delega: { start: 96, end: 186 },
  construye: { start: 186, end: 268 },
  flywheel: { start: 268, end: 348 },
} as const;

export const TOTAL = SLIDES.flywheel.end; // 348 f ≈ 11.6 s

// Shared title anchor — the three words live in the SAME place across slides.
export const TITLE = { x: 150, y: 250 } as const;
