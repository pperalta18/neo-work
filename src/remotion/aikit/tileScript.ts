/**
 * tileScript.ts — pure frame-driven logic for the workspace tile.
 * ───────────────────────────────────────────────────────────────
 * The maths behind WorkspaceTile/TileMorph: the 128px workspace/process
 * tile that screens collapse into (Prod03's landing, Prod04's "se encienden
 * 3 / 8 tiles"). Two mechanics, both absorbed from proven pieces:
 *
 *   - tileIgnitePose — graphScript's GoalDisc power-on, relief remapped so a
 *     settled tile rests at InventoryTableVideo's tile relief (dist 8 / blur
 *     16 at 128px), keeping morph-landed and ignited tiles identical;
 *   - tileMorphPose — InventoryTableVideo's outro generalised: ONE box that
 *     fades its screen content, shrinks/travels to a landing centre and
 *     resolves the tile face in. Same beats (fade 12 · collapse +8/34 ·
 *     glyph +20/20 · at rest 48 frames after startAt).
 *
 * Pure data/maths — no React, no remotion — so scenes choreograph cursors/
 * cameras against the same numbers the visual renders, and it all unit-tests.
 *
 * Sequencing contract (the kit convention): `tileSettledAt` /
 * `tileMorphSettledAt` give the first frame the tile is at rest — start the
 * next beat there.
 */

import { IGNITE_SETTLED, ignitePose, phase01, type IgnitePose, type Vec } from './graphScript'

// ── the tile (InventoryTableVideo's grid module, the kit constant) ───────────

/** Tile edge (px) — the Figma 128px module InventoryTableVideo collapses to. */
export const TILE_SIZE = 128
export const TILE_RADIUS = 26
/** The settled tile relief at TILE_SIZE (InventoryTableVideo's morph end). */
export const TILE_DIST = 8
export const TILE_BLUR = 16

// ignitePose's settled relief at its 96px reference (graphScript lerp targets)
// — the remap below rescales the whole arc so a tile settles at TILE_DIST/BLUR.
const IGNITE_REST_DIST = 11
const IGNITE_REST_BLUR = 27

const cubicOut = (t: number) => 1 - (1 - t) ** 3
const cubicIn = (t: number) => t * t * t
const cubicInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * The tile's power-on beat: ignitePose with distance/blur rescaled to settle
 * exactly at the tile relief, and the glow rescaled to the TILE_SIZE
 * reference. All returned values are "at 128px" — visuals scale by
 * `size / TILE_SIZE` for other sizes.
 */
export function tileIgnitePose(frame: number, at: number): IgnitePose {
  const p = ignitePose(frame, at)
  return {
    ...p,
    distance: p.distance * (TILE_DIST / IGNITE_REST_DIST),
    blur: p.blur * (TILE_BLUR / IGNITE_REST_BLUR),
    glowBlur: p.glowBlur * (TILE_SIZE / 96),
  }
}

// ── avatar stack (the KanbanWidget chips, popping in) ────────────────────────

/** Frames after the tile's `at` before the first avatar pops. */
export const AVATAR_LEAD = 14
/** Frames between consecutive avatar pops. */
export const AVATAR_STAGGER = 4
/** Frames one avatar's pop takes. */
export const AVATAR_POP = 12

/** Eased 0→1 pop of avatar `index` on a tile igniting at `at`. */
export function avatarPop(frame: number, at: number, index: number): number {
  const start = at + AVATAR_LEAD + index * AVATAR_STAGGER
  return cubicOut(phase01(frame, start, start + AVATAR_POP))
}

/** First frame an ignited tile (and its `people` avatars) is fully at rest. */
export function tileSettledAt(at: number, people = 0): number {
  const ignite = at + IGNITE_SETTLED
  if (people <= 0) return ignite
  return Math.max(ignite, at + AVATAR_LEAD + (people - 1) * AVATAR_STAGGER + AVATAR_POP)
}

// ── cascade authoring (Prod04's "3 tiles… 8 tiles se encienden") ─────────────

/** Assign staggered ignite frames to a list of tiles, first at `startAt`. */
export function tileCascade<T extends object>(
  tiles: readonly T[],
  opts: { startAt?: number; stagger?: number } = {},
): (T & { at: number })[] {
  const startAt = opts.startAt ?? 0
  const stagger = opts.stagger ?? 12
  return tiles.map((t, i) => ({ ...t, at: startAt + i * stagger }))
}

// ── screen → tile morph (InventoryTableVideo's outro, generalised) ───────────

export type TileMorphRect = {
  /** Top-left of the source screen box (stage px). */
  x: number
  y: number
  width: number
  height: number
  /** Source chrome — defaults to SCREEN_RELIEF (InventoryTable's card). */
  radius?: number
  distance?: number
  blur?: number
}

/** Default source relief — InventoryTableVideo's card at rest. */
export const SCREEN_RELIEF = { radius: 40, distance: 12, blur: 28 } as const

export type TileMorphSpec = {
  /** The screen being folded down. */
  from: TileMorphRect
  /** Landing CENTRE of the tile (e.g. a BaGraph layout.pos). Defaults to the
   * source rect's centre — collapse in place. */
  to?: Vec
  /** Tile edge at the end. Default TILE_SIZE. */
  size?: number
  /** Frame the morph begins (content starts fading). */
  startAt: number
}

/** The morph's beats, in frames from `startAt` (InventoryTableVideo's). */
export const TILE_MORPH = {
  /** Source content fade-out — leads, so the box folds down "empty". */
  FADE: 12,
  /** The box starts shrinking this many frames in. */
  COLLAPSE_DELAY: 8,
  /** Shrink + travel duration. */
  COLLAPSE: 34,
  /** The tile face starts resolving this far into the collapse. */
  GLYPH_DELAY: 20,
  /** Tile-face resolve duration. */
  GLYPH: 20,
} as const

/** Frames from `startAt` until the box (and glyph) are at rest. */
export const TILE_MORPH_SETTLE =
  TILE_MORPH.COLLAPSE_DELAY + Math.max(TILE_MORPH.COLLAPSE, TILE_MORPH.GLYPH_DELAY + TILE_MORPH.GLYPH)

/** Frame the tile face starts resolving (avatars pop relative to this). */
export function tileMorphGlyphStart(spec: TileMorphSpec): number {
  return spec.startAt + TILE_MORPH.COLLAPSE_DELAY + TILE_MORPH.GLYPH_DELAY
}

/** First frame the landed tile (and its `people` avatars) is at rest. */
export function tileMorphSettledAt(spec: TileMorphSpec, people = 0): number {
  const base = spec.startAt + TILE_MORPH_SETTLE
  if (people <= 0) return base
  return Math.max(
    base,
    tileMorphGlyphStart(spec) + AVATAR_LEAD + (people - 1) * AVATAR_STAGGER + AVATAR_POP,
  )
}

export type TileMorphPose = {
  /** Top-left + size of the ONE morphing box. */
  x: number
  y: number
  width: number
  height: number
  radius: number
  /** Raised-relief params for elevation(). */
  distance: number
  blur: number
  /** Source screen content opacity 1→0 (fades before the fold). */
  source: number
  /** Tile face resolve 0→1 (glyph scale/fade; avatars key off glyph start). */
  glyph: number
}

/**
 * The one-box morph at `frame`: before `startAt` the pose IS the source rect
 * at rest; then content fades (accelerating), the box shrinks and travels to
 * `to` (standard in-out) while radius + relief interpolate to the tile's, and
 * the tile face resolves in (decelerating). No crossfade — same box.
 */
export function tileMorphPose(spec: TileMorphSpec, frame: number): TileMorphPose {
  const size = spec.size ?? TILE_SIZE
  const k = size / TILE_SIZE
  const f = spec.from
  const cx0 = f.x + f.width / 2
  const cy0 = f.y + f.height / 2
  const to = spec.to ?? { x: cx0, y: cy0 }

  const fade = cubicIn(phase01(frame, spec.startAt, spec.startAt + TILE_MORPH.FADE))
  const collapseStart = spec.startAt + TILE_MORPH.COLLAPSE_DELAY
  const c = cubicInOut(phase01(frame, collapseStart, collapseStart + TILE_MORPH.COLLAPSE))
  const glyphStart = tileMorphGlyphStart(spec)
  const glyph = cubicOut(phase01(frame, glyphStart, glyphStart + TILE_MORPH.GLYPH))

  const width = lerp(f.width, size, c)
  const height = lerp(f.height, size, c)
  const cx = lerp(cx0, to.x, c)
  const cy = lerp(cy0, to.y, c)

  return {
    x: cx - width / 2,
    y: cy - height / 2,
    width,
    height,
    radius: lerp(f.radius ?? SCREEN_RELIEF.radius, TILE_RADIUS * k, c),
    distance: lerp(f.distance ?? SCREEN_RELIEF.distance, TILE_DIST * k, c),
    blur: lerp(f.blur ?? SCREEN_RELIEF.blur, TILE_BLUR * k, c),
    source: 1 - fade,
    glyph,
  }
}

// ── validation ───────────────────────────────────────────────────────────────

/** Sanity-check an authored morph. Returns human-readable problems (empty = valid). */
export function validateTileMorph(spec: TileMorphSpec): string[] {
  const errors: string[] = []
  if (spec.from.width <= 0) errors.push(`from.width ${spec.from.width} must be > 0`)
  if (spec.from.height <= 0) errors.push(`from.height ${spec.from.height} must be > 0`)
  if (spec.size != null && spec.size <= 0) errors.push(`size ${spec.size} must be > 0`)
  if (spec.startAt < 0) errors.push(`startAt ${spec.startAt} must be ≥ 0`)
  return errors
}
