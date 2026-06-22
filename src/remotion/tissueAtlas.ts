/**
 * tissueAtlas — the living-tissue **equirectangular Canvas2D atlas** for «Globo Vivo».
 * ──────────────────────────────────────────────────────────────────────────
 * The neumorphic process-grid is mapped onto the 3D globe as a single
 * **equirectangular** texture (4096×2048, 2:1 POT) the host binds as a
 * `CanvasTexture`. {@link renderAtlas} repaints that canvas each frame; the host
 * (next checkbox) blends it over the photoreal Earth by the geodesic growth mask
 * ({@link tissueMaskAt} in `globoVivoScript.ts`).
 *
 * **Perf strategy** (spec: Restricciones — rendimiento). The expensive part of
 * the neumorphic look is the soft `shadowBlur` double-shadow. We pay it **once**:
 * a small ramp of plate sprites is **pre-rasterized** to offscreen canvases
 * (`bakePlateSprite`, one per grow level, blur baked in). Per frame we only
 * **stamp** them with `drawImage` — no per-frame blur — animating reveal / decay
 * / opacity / a travelling `KIT_BLUE` pulse by picking which baked level to draw.
 * That is what lets the atlas carry hundreds of tiny plates across ~900 frames.
 *
 * **Determinism** (spec: Restricciones — determinismo). Every value is a pure
 * function of the frame (no `Date.now()` / `Math.random()` / `useFrame` clock);
 * per-cell variation comes from a seeded integer hash of its (row, col). Two
 * renders of the same frame stamp byte-identical calls.
 *
 * **Scope now is Phase 3**: the atlas stamps the **live flow schedule** each
 * frame. {@link renderAtlas} reads {@link activeCellGrowsAt} from
 * `globoVivoScript.ts` (built on `processLibrary.ts`) and stamps a pre-baked
 * neumorphic plate for every cell carrying a flow that frame, sized by the flow's
 * head-first grow / reverse decay, with the travelling `KIT_BLUE` pulse riding the
 * live tissue. Cells with no flow stay bare grid. See plans/globo-vivo.md ·
 * specs/globo-vivo.md.
 *
 * No React / three imports here: the layout + animation math is node-testable,
 * and the canvas work goes through an **injectable factory** so the stamping
 * pipeline can be exercised against a fake 2D context in unit tests.
 */
import { KIT_BLUE, lightTheme } from '@/lib/neumorphism'
import {
  clamp01,
  BAND_DEG,
  ROWS,
  COLS_EQ,
  MIN_COLS,
  rowCenterLat,
  colsInRow,
  hash01,
  lonLatToUV,
  uvToLonLat,
  SURFACE_CELLS,
  activeCellGrowsAt,
  type SurfaceCell,
} from './globoVivoScript'

// The logical banded grid now lives in `globoVivoScript.ts` (the choreography
// module) so the flow schedule and this pixel atlas share one source of truth.
// Re-export it here so existing consumers keep importing it from `./tissueAtlas`.
export { BAND_DEG, ROWS, COLS_EQ, MIN_COLS, rowCenterLat, colsInRow, hash01, lonLatToUV, uvToLonLat }

// ── Atlas dimensions + palette ──────────────────────────────────────────────

/** Equirectangular atlas width (px). 4096×2048 = 2:1 power-of-two → clean mipmaps. */
export const ATLAS_W = 4096
/** Equirectangular atlas height (px). Half the width (a full lon × lat sheet). */
export const ATLAS_H = 2048

/** Neumorphic plate face — the kit light surface (#f4f4fa family, never cream). */
export const ATLAS_SURFACE = lightTheme.surface
/** Lit (top-left) edge colour of a raised plate. */
export const ATLAS_HIGHLIGHT = lightTheme.highlight
/** Shaded (bottom-right) edge colour of a raised plate. */
export const ATLAS_SHADOW = lightTheme.shadow

// ── Equirectangular projection (pure) ───────────────────────────────────────
// Convention matches the vendored NASA maps: image row 0 (top) = north pole
// (lat +90), leftmost column = lon −180. So `tissueMaskAt(lat, lon, frame)` and
// the atlas address the same texels and the host blend lines up. `lonLatToUV` /
// `uvToLonLat` are owned by `globoVivoScript.ts` (re-exported above).

/** Lon/lat (degrees) → atlas pixel (defaults to the full {@link ATLAS_W}×{@link ATLAS_H}). */
export function lonLatToPx(
  lonDeg: number,
  latDeg: number,
  w: number = ATLAS_W,
  h: number = ATLAS_H,
): [number, number] {
  const [u, v] = lonLatToUV(lonDeg, latDeg)
  return [u * w, v * h]
}

// ── Pixel layout over the logical banded grid (pure) ─────────────────────────
// The cosine-banded LOGICAL grid (bands, cos-weighted columns, lat/lon/uv, seed)
// lives in `globoVivoScript.ts` ({@link SURFACE_CELLS}). Here we only project it
// into atlas pixels: each cell keeps its logical fields and gains an x/y centre
// + a width (wider near the poles → un-stretches on the sphere) + a band height.

/** One atlas cell: the logical {@link SurfaceCell} plus its baked atlas pixels. */
export type AtlasCell = SurfaceCell & {
  /** Centre pixel X in the atlas. */
  xPx: number
  /** Centre pixel Y in the atlas. */
  yPx: number
  /** Cell width in atlas px (wider near the poles → un-stretches on the sphere). */
  wPx: number
  /** Cell height in atlas px (constant per band). */
  hPx: number
}

/** Project the logical {@link SURFACE_CELLS} into atlas pixels (pure, deterministic). */
export function buildGridCells(): AtlasCell[] {
  const hPx = ATLAS_H / ROWS
  return SURFACE_CELLS.map((cell) => ({
    ...cell,
    xPx: cell.u * ATLAS_W,
    yPx: cell.v * ATLAS_H,
    wPx: ATLAS_W / colsInRow(cell.row),
    hPx,
  }))
}

/** The colonized-grid cells (built once at module load). */
export const GRID_CELLS: AtlasCell[] = buildGridCells()
/** Total plate count across the whole orb. */
export const CELL_COUNT = GRID_CELLS.length

// ── Frame-driven animation (pure) ───────────────────────────────────────────

/** Pre-rasterized grow levels of the plate sprite (more = smoother emergence). */
export const GROW_LEVELS = 16

/** Grow value [0,1] baked into sprite `level` (level 0 = invisible, top = full). */
export function growForLevel(level: number): number {
  return GROW_LEVELS <= 1 ? 1 : clamp01(level / (GROW_LEVELS - 1))
}

/** Map a continuous grow [0,1] to the nearest baked sprite level [0, GROW_LEVELS−1]. */
export function quantizeGrow(grow: number): number {
  return Math.round(clamp01(grow) * (GROW_LEVELS - 1))
}

/** Frames for the `KIT_BLUE` pulse band to sweep once around the longitude. */
export const PULSE_PERIOD = 150
/** Half-width (in U units) of the travelling pulse band's Gaussian falloff. */
export const PULSE_WIDTH = 0.06

/**
 * `KIT_BLUE` pulse intensity [0,1] on `cell` at `frame`: a soft band sweeping the
 * longitude (wrapping at the seam), Gaussian across {@link PULSE_WIDTH}. The lone
 * colour accent on the white grid — the "pulso viajero" of the FlowPlate identity.
 * Pure function of (cell, frame).
 */
export function pulseIntensityAt(cell: AtlasCell, frame: number): number {
  const band = (((frame / PULSE_PERIOD) % 1) + 1) % 1
  let d = Math.abs(cell.u - band)
  d = Math.min(d, 1 - d) // shortest way around the longitude seam
  const x = d / PULSE_WIDTH
  return clamp01(Math.exp(-x * x))
}

/**
 * Cells carrying a live flow plate (a non-blank sprite level) at `frame` — the
 * count of primary plate stamps {@link renderAtlas} makes (seam-wrapped edge
 * cells add extra `drawImage`s). Reads the same {@link activeCellGrowsAt} schedule
 * the render loop does, so it tracks the visible tissue exactly: `0` before the
 * first flow colonizes, rising toward the vast end state.
 */
export function visibleCellCountAt(frame: number): number {
  let n = 0
  for (const fc of activeCellGrowsAt(frame)) if (quantizeGrow(fc.grow) > 0) n += 1
  return n
}

// ── Perf quality tiers + leaner fallback (Checkpoint B) ──────────────────────
// Checkpoint B (plans/globo-vivo.md · spec: Restricciones — rendimiento) proved
// the full render is fast enough: a worst-case 90-frame render (every frame
// stamps all CELL_COUNT plates + re-uploads the whole atlas) at 1920×1080 ran at
// **≈0.28 s/frame** (8× concurrency, swangle software WebGL, full 4096×2048
// atlas) — so the ~900-frame scene is **≈4 min** of deterministic offline render.
// **No cap is taken; the full tier stays live** ({@link ACTIVE_ATLAS_QUALITY}).
//
// We still keep a **leaner fallback on hand** as the plan asks. The dominant
// per-frame cost is the atlas pixel area (the ground fill + the GPU texture
// re-upload, both ∝ width×height), so the lever is the **atlas resolution**: the
// cells/sprites/projection are defined in the canonical {@link ATLAS_W}×{@link
// ATLAS_H} space and {@link renderAtlas} scales every draw to the chosen tier, so
// a tier change is **look-preserving** (same plates, same layout) — only sharpness
// drops. To engage it on a slower host, flip {@link ACTIVE_ATLAS_QUALITY} to
// {@link ATLAS_QUALITY_LEAN}; the host (`useAtlasTexture` → `renderAtlas`) picks
// it up with no other change. Tier swaps stay fully deterministic.

/** A render-resolution tier for the equirectangular atlas (2:1 preserved). */
export type AtlasQuality = {
  /** Short label for logs / the active-tier decision. */
  name: string
  /** Atlas canvas width in px. */
  width: number
  /** Atlas canvas height in px (kept at width / 2). */
  height: number
}

/** Full tier — the proven default (4096×2048, ≈0.28 s/frame at 1920×1080). */
export const ATLAS_QUALITY_FULL: AtlasQuality = { name: 'full', width: ATLAS_W, height: ATLAS_H }

/** Leaner fallback — half-linear-res (2048×1024) → a quarter of the per-frame
 *  pixel load; same plates/layout, softer. Engaged only if a host proves too slow. */
export const ATLAS_QUALITY_LEAN: AtlasQuality = { name: 'lean', width: ATLAS_W / 2, height: ATLAS_H / 2 }

/**
 * The tier {@link renderAtlas} renders at by default (what the host binds).
 * **Checkpoint B verdict: full retained** (perf headroom). A future slower host
 * flips this one constant to {@link ATLAS_QUALITY_LEAN}; nothing else changes.
 */
export const ACTIVE_ATLAS_QUALITY: AtlasQuality = ATLAS_QUALITY_FULL

/**
 * Per-frame **pixel load** proxy for a tier: the atlas pixel count (= width ×
 * height). The ground clear/fill and the per-frame `CanvasTexture` GPU re-upload
 * both scale with it, so it is the cost the resolution lever actually moves —
 * `ATLAS_QUALITY_LEAN` is exactly a quarter of `ATLAS_QUALITY_FULL`. Pure.
 */
export function atlasPixelLoad(quality: AtlasQuality): number {
  return quality.width * quality.height
}

// ── Canvas plumbing (injectable so the pipeline is unit-testable) ────────────
// Minimal structural views of the Canvas2D API the atlas actually uses. A real
// HTMLCanvasElement / CanvasRenderingContext2D satisfies these; unit tests pass a
// recording fake. Default factory uses the DOM (Remotion headless Chromium has it),
// but `document` is only touched when the factory is *called*, never at import —
// so this module loads fine in node.

export interface Ctx2DLike {
  fillStyle: string
  globalAlpha: number
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  save(): void
  restore(): void
  clearRect(x: number, y: number, w: number, h: number): void
  fillRect(x: number, y: number, w: number, h: number): void
  beginPath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void
  closePath(): void
  fill(): void
  drawImage(image: CanvasLike, dx: number, dy: number, dWidth: number, dHeight: number): void
}

export interface CanvasLike {
  width: number
  height: number
  getContext(contextId: '2d'): Ctx2DLike | null
}

export type CanvasFactory = (w: number, h: number) => CanvasLike

/** Default DOM-backed canvas factory (Remotion render / app preview). */
export const domCanvasFactory: CanvasFactory = (w, h) => {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return canvas as unknown as CanvasLike
}

/** Trace a rounded-rect path (no `ctx.roundRect` dependency → wider support). */
function roundRectPath(
  ctx: Ctx2DLike,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.lineTo(x + w - rr, y)
  ctx.arcTo(x + w, y, x + w, y + rr, rr)
  ctx.lineTo(x + w, y + h - rr)
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr)
  ctx.lineTo(x + rr, y + h)
  ctx.arcTo(x, y + h, x, y + h - rr, rr)
  ctx.lineTo(x, y + rr)
  ctx.arcTo(x, y, x + rr, y, rr)
  ctx.closePath()
}

// ── Pre-rasterized plate sprites (the perf core) ─────────────────────────────

/** Plate face size (px) inside the sprite — matches the kit's 128px module cell. */
export const SPRITE_FACE = 128
/** Transparent margin around the face so the soft shadow has room to bleed. */
export const SPRITE_MARGIN = 40
/** Full sprite canvas edge (face + both margins). */
export const SPRITE_SIZE = SPRITE_FACE + SPRITE_MARGIN * 2
/** Plate corner radius (px). */
export const PLATE_RADIUS = 26
/** Raised-plate shadow offset at full grow (scaled by grow). */
export const PLATE_DISTANCE = 8
/** Raised-plate shadow blur at full grow (scaled by grow). */
export const PLATE_BLUR = 16

/**
 * Bake ONE neumorphic plate sprite at grow `level` to an offscreen canvas: the
 * raised double-shadow (dark bottom-right + light top-left, light from top-left)
 * with the `shadowBlur` paid here, once. Grow scales the plate's scale / shadow
 * distance / blur / opacity exactly like the live `FlowPlate`. Pure given the
 * factory; called only while building the sprite cache.
 */
export function bakePlateSprite(
  level: number,
  factory: CanvasFactory = domCanvasFactory,
): CanvasLike {
  const canvas = factory(SPRITE_SIZE, SPRITE_SIZE)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
  const g = growForLevel(level)
  if (g <= 0.001) return canvas // invisible level → blank sprite (bare grid)

  const scale = 0.9 + 0.1 * g
  const face = SPRITE_FACE * scale
  const at = (SPRITE_SIZE - face) / 2
  const dist = PLATE_DISTANCE * g
  const blur = PLATE_BLUR * g

  ctx.globalAlpha = clamp01(g * 1.5)
  ctx.fillStyle = ATLAS_SURFACE
  roundRectPath(ctx, at, at, face, face, PLATE_RADIUS)

  // Dark shadow on the side away from the light (bottom-right).
  ctx.shadowColor = ATLAS_SHADOW
  ctx.shadowBlur = blur
  ctx.shadowOffsetX = dist
  ctx.shadowOffsetY = dist
  ctx.fill()

  // Light highlight on the lit side (top-left).
  ctx.shadowColor = ATLAS_HIGHLIGHT
  ctx.shadowOffsetX = -dist
  ctx.shadowOffsetY = -dist
  ctx.fill()

  // Crisp the face with the shadows off.
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.fill()

  ctx.globalAlpha = 1
  return canvas
}

let spriteCache: { factory: CanvasFactory; sprites: CanvasLike[] } | null = null

/** The baked sprite ramp, built once per factory and memoized. */
export function getSprites(factory: CanvasFactory = domCanvasFactory): CanvasLike[] {
  if (spriteCache && spriteCache.factory === factory) return spriteCache.sprites
  const sprites: CanvasLike[] = []
  for (let i = 0; i < GROW_LEVELS; i += 1) sprites.push(bakePlateSprite(i, factory))
  spriteCache = { factory, sprites }
  return sprites
}

let atlasState: { factory: CanvasFactory; w: number; h: number; canvas: CanvasLike } | null = null

/** The single reused atlas canvas (one per factory + size — never reallocated per
 *  frame; re-allocated only if the quality tier's dimensions change). */
function getAtlasCanvas(factory: CanvasFactory, w: number, h: number): CanvasLike {
  if (atlasState && atlasState.factory === factory && atlasState.w === w && atlasState.h === h) {
    return atlasState.canvas
  }
  const canvas = factory(w, h)
  atlasState = { factory, w, h, canvas }
  return canvas
}

/** Reset the sprite + atlas caches (test isolation / hot-reload). */
export function resetAtlasCaches(): void {
  spriteCache = null
  atlasState = null
}

/** Base `KIT_BLUE` pulse pip edge (px), scaled by the cell + pulse intensity. */
export const PULSE_PIP = 16

/**
 * Repaint the equirectangular atlas for `frame` and return the (reused) canvas
 * for binding as a `CanvasTexture`. Fills the white grid ground, then walks the
 * **live flow schedule** ({@link activeCellGrowsAt}) and **stamps** a pre-baked
 * plate sprite for each cell carrying a flow, at the sprite level matching that
 * flow's per-cell grow (head-first reveal → run → reverse decay; persistents hold
 * full). Plates get an independent x/y scale → cells un-stretch on the sphere and
 * wrap at the longitude seam; a `KIT_BLUE` pulse pip rides any live plate the
 * travelling band passes. Cells with no flow stay bare grid. Pure function of
 * `frame` for a given factory + tier — same inputs → identical draw calls
 * (determinism holds across tiers).
 *
 * The cells/sprites/projection live in the canonical {@link ATLAS_W}×{@link
 * ATLAS_H} space; `opts.quality` (default {@link ACTIVE_ATLAS_QUALITY}) sets the
 * actual canvas size and every draw is scaled by `quality.width / ATLAS_W`, so a
 * leaner tier is **look-preserving** (same plates, fewer pixels — the Checkpoint-B
 * fallback). The DOM factory yields a real `HTMLCanvasElement`; the host casts it.
 */
export function renderAtlas(
  frame: number,
  opts: { createCanvas?: CanvasFactory; quality?: AtlasQuality } = {},
): CanvasLike {
  const factory = opts.createCanvas ?? domCanvasFactory
  const quality = opts.quality ?? ACTIVE_ATLAS_QUALITY
  const W = quality.width
  const H = quality.height
  // Canonical-space → tier-space scale (1 at full, 0.5 at the lean fallback).
  const res = W / ATLAS_W
  const sprites = getSprites(factory)
  const canvas = getAtlasCanvas(factory, W, H)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  // White grid ground (the orb drains to this as coverage completes).
  ctx.globalAlpha = 1
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = ATLAS_SURFACE
  ctx.fillRect(0, 0, W, H)

  // Phase 3: stamp ONLY the cells carrying a live flow this frame, each plate
  // sized by its flow's head-first grow / reverse decay (`activeCellGrowsAt`).
  // The placement solver guarantees no two active flows share a cell, so the
  // stamps never overlap; iteration order (flow id, then step) is deterministic.
  for (const fc of activeCellGrowsAt(frame)) {
    const level = quantizeGrow(fc.grow)
    if (level <= 0) continue // grow too small to read as a plate yet

    const cell = GRID_CELLS[fc.cellIndex]
    const sprite = sprites[level]
    const sx = cell.wPx / SPRITE_FACE
    const sy = cell.hPx / SPRITE_FACE
    const dW = SPRITE_SIZE * sx * res
    const dH = SPRITE_SIZE * sy * res
    const cx = cell.xPx * res
    const cy = cell.yPx * res
    const dx = cx - dW / 2
    const dy = cy - dH / 2

    ctx.globalAlpha = 1
    ctx.drawImage(sprite, dx, dy, dW, dH)
    // Wrap the longitude seam so an edge plate is whole around the sphere.
    if (dx < 0) ctx.drawImage(sprite, dx + W, dy, dW, dH)
    else if (dx + dW > W) ctx.drawImage(sprite, dx - W, dy, dW, dH)

    const pulse = pulseIntensityAt(cell, frame)
    if (pulse > 0.04) {
      const pip = PULSE_PIP * Math.min(sx, sy) * pulse * res
      ctx.globalAlpha = pulse
      ctx.fillStyle = KIT_BLUE
      ctx.fillRect(cx - pip / 2, cy - pip / 2, pip, pip)
    }
  }

  ctx.globalAlpha = 1
  return canvas
}
