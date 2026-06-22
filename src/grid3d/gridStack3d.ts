/**
 * gridStack3d — the math behind the 3D stacked-process generator.
 * ──────────────────────────────────────────────────────────────────────────
 * A pure, dependency-free module (like cameraScript.ts): the single source of
 * truth for the front→back depth-wave timeline (each plane runs a StoreFlow-
 * style emergence over its OWN route), the exploded-iso-fan plane layout
 * (CSS-3D translate3d, px), the atmospheric rack-focus (opacity + blur by
 * depth), and the iso camera (a calm drift over a configurable base pose).
 *
 * Shared verbatim by BOTH hosts: the interactive studio (grid3d.html) and the
 * Remotion composition. No React, no three, no remotion — so it runs in the
 * vitest `node` project and stays unit-testable, and the easing is hand-rolled
 * (smootherstep) so the camera move is a pure function of the frame → the
 * Remotion render is deterministic.
 *
 * House rules (specs/motion-language.md): ease-out, NO bounce; depth reads from
 * relief + atmospheric haze, never coloured glows.
 */

// ── per-plane process timeline (frames @30fps) ───────────────────────────────

/** Quiet hold before a plane's first plate emerges. */
export const PLANE_INTRO = 10;
/** Frames between consecutive plate emergences within a plane (the build beat). */
export const PLANE_BEAT = 15;
/** Hold after a plane's last plate lands, before it's "done". */
export const PLANE_TAIL = 16;
/** Next plane starts this far (fraction) into the previous plane's build → the
 *  front→back depth wave (overlapping, so planes flow rather than queue). */
export const STACK_STAGGER_FRACTION = 0.45;
/** Soft end-hold after the deepest plane lands, so the shot breathes. */
export const STACK_BREATHE = 24;

export type StackTiming = { intro: number; beat: number; tail: number; stagger: number };

/** Frames one plane takes to build a `steps`-long route in full. */
export function planeProcessFrames(steps: number, timing: Partial<StackTiming> = {}): number {
  const intro = timing.intro ?? PLANE_INTRO;
  const beat = timing.beat ?? PLANE_BEAT;
  const tail = timing.tail ?? PLANE_TAIL;
  return intro + Math.max(0, steps) * beat + tail;
}

export type StackTimeline = {
  planes: number;
  /** When plane k begins its build (frame). planeStart(0) === 0. */
  planeStart: (k: number) => number;
  /** Frames plane k takes to build its route. */
  planeFrames: (k: number) => number;
  /** Continuous revealedCount for plane k at a global frame (0..steps_k). */
  planeReveal: (k: number, frame: number) => number;
  /** Total frames for the whole stacked reveal (deepest plane end + breathe). */
  total: number;
};

/**
 * Derive the front→back depth-wave timeline from each plane's step count. PURE —
 * the source of truth shared by the composition's `durationInFrames` and the
 * per-plane reveal in the scene. Planes have DIFFERENT routes, so the stagger
 * keys off each plane's own build length.
 */
export function gridStackTimeline(stepCounts: number[], timing: Partial<StackTiming> = {}): StackTimeline {
  const counts = stepCounts.length ? stepCounts : [0];
  const n = counts.length;
  const stagger = timing.stagger ?? STACK_STAGGER_FRACTION;
  const intro = timing.intro ?? PLANE_INTRO;
  const beat = timing.beat ?? PLANE_BEAT;

  const frames = counts.map((s) => planeProcessFrames(s, timing));
  const starts: number[] = [0];
  for (let k = 1; k < n; k++) {
    starts[k] = starts[k - 1] + Math.max(1, Math.round(frames[k - 1] * stagger));
  }
  const total = Math.ceil(Math.max(...starts.map((s, k) => s + frames[k])) + STACK_BREATHE);

  const clampK = (k: number) => Math.max(0, Math.min(n - 1, k));
  const planeReveal = (k: number, frame: number): number => {
    const i = clampK(k);
    const local = frame - starts[i];
    if (local <= intro) return 0;
    return Math.max(0, Math.min(counts[i], (local - intro) / beat));
  };

  return {
    planes: n,
    planeStart: (k) => starts[clampK(k)],
    planeFrames: (k) => frames[clampK(k)],
    planeReveal,
    total,
  };
}

// ── layout (exploded iso fan, CSS-3D world = px) ─────────────────────────────

/** The staging knobs. Distances in px (CSS-3D world). The studio tweaks these
 *  live; the Remotion comp reads the chosen values from the doc. */
export type GridStackLayout = {
  /** Depth between consecutive planes (−translateZ px) — card separation. */
  gapPx: number;
  /** Lateral fan per plane (+translateX px) — spread to one side. */
  fanX: number;
  /** Vertical fan per plane (−translateY px, i.e. up the screen) — cascade. */
  fanY: number;
  /** Opacity of each plane's surface fill behind the hairlines. 0 = glass
   *  (see-through), 1 = solid card. */
  fillOpacity: number;
  /** Far-plane opacity target (rack-focus). 1 = no fade. */
  dimFloor: number;
  /** Blur (px) applied to the farthest plane, ramping from 0 at the front. */
  blurFar: number;
  /** Base camera pose (the studio's orbit edits these; a drift rides on top). */
  rotX: number; // deg — tilt down toward the stack
  rotY: number; // deg — swing to one side (the iso 3/4)
  scale: number; // overall fit
  /** CSS perspective distance (px). Smaller = stronger perspective. */
  perspective: number;
};

export const GRID_STACK3D_LAYOUT: GridStackLayout = {
  gapPx: 300,
  fanX: 44,
  fanY: 74,
  fillOpacity: 1,
  dimFloor: 0.6,
  blurFar: 2.5,
  rotX: 14,
  rotY: -20,
  scale: 0.82,
  perspective: 2200,
};

export function resolveLayout(partial?: Partial<GridStackLayout>): GridStackLayout {
  return { ...GRID_STACK3D_LAYOUT, ...(partial ?? {}) };
}

export type Vec3 = [number, number, number];

/** Per-plane offset (px). k=0 nearest the camera (z=0); planes recede in −z
 *  while fanning +x / up. Centred so the whole stack straddles the origin. */
export function planeTransform(k: number, planes: number, layout: GridStackLayout = GRID_STACK3D_LAYOUT): Vec3 {
  const kk = Math.max(0, k);
  const n = Math.max(1, planes);
  const mid = (n - 1) / 2; // centre the stack on the origin
  return [(kk - mid) * layout.fanX, -(kk - mid) * layout.fanY, -(kk - mid) * layout.gapPx];
}

/** Atmospheric rack-focus opacity: 1 at the front plane, easing to `dimFloor`. */
export function dimFactor(k: number, planes: number, layout: GridStackLayout = GRID_STACK3D_LAYOUT): number {
  const n = Math.max(1, planes);
  if (n <= 1) return 1;
  const t = Math.min(1, Math.max(0, k / (n - 1)));
  return 1 - t * (1 - layout.dimFloor);
}

/** Atmospheric blur (px): 0 at the front plane, ramping to `blurFar` at the back. */
export function blurFactor(k: number, planes: number, layout: GridStackLayout = GRID_STACK3D_LAYOUT): number {
  const n = Math.max(1, planes);
  if (n <= 1) return 0;
  const t = Math.min(1, Math.max(0, k / (n - 1)));
  return t * layout.blurFar;
}

// ── camera (calm iso drift over the doc's base pose, frame-pure) ──────────────

/** Quintic smootherstep — zero 1st & 2nd derivative at both ends (no jerk). */
function smoother(x: number): number {
  const t = x < 0 ? 0 : x > 1 ? 1 : x;
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export type CameraPose = { rotX: number; rotY: number; scale: number };

/**
 * The live camera pose: the doc's base iso pose with a calm multi-step drift
 * (a gentle swing + a slight push-in) eased over the whole timeline — ease-out,
 * no bounce. Pure in `frame`, so the render is deterministic.
 */
export function cameraPoseAt(frame: number, total: number, layout: GridStackLayout = GRID_STACK3D_LAYOUT): CameraPose {
  const u = total > 0 ? Math.min(1, Math.max(0, frame / total)) : 0;
  // establish (all deltas 0 at frame 0) → calm swing + slight push-in → settle.
  const dRotY = smoother(u) * 4; // swing 0→4°
  const dRotX = smoother(Math.min(1, u * 1.4)) * 2; // tilt in 2°
  const dScale = 1 + smoother(Math.min(1, u * 1.2)) * 0.04; // 4% push-in
  return {
    rotX: layout.rotX + dRotX,
    rotY: layout.rotY + dRotY,
    scale: layout.scale * dScale,
  };
}

// ── CSS transform string builders (pure, testable) ───────────────────────────

/** The per-plane CSS transform (placed inside the preserve-3d camera layer). */
export function planeTransformCss(k: number, planes: number, layout: GridStackLayout = GRID_STACK3D_LAYOUT): string {
  const [x, y, z] = planeTransform(k, planes, layout);
  // translate(-50%,-50%) centres the grid on its own anchor point.
  return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) translate(-50%, -50%)`;
}

/** The camera-layer CSS transform (rotates/scales the whole preserve-3d stack). */
export function cameraTransformCss(pose: CameraPose): string {
  return `scale(${pose.scale.toFixed(4)}) rotateX(${pose.rotX.toFixed(3)}deg) rotateY(${pose.rotY.toFixed(3)}deg)`;
}
