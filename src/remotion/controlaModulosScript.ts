/**
 * controlaModulosScript — pure frame-driven brain of «Controla · módulos».
 * ───────────────────────────────────────────────────────────────────────────
 * A simple HORIZONTAL pan: one arrow sweeps left→right along a single row of the
 * Controla (data · blue) modules. Each module is a named plate (icon + wordmark)
 * and plays its Rive logo the moment the arrow head passes through it; the chevrons
 * it raises stay, weaving a trail behind it. The camera only pans horizontally
 * (constant Y, constant zoom) — «solo un paneo horizontal» — and rests on each
 * module for two seconds before easing on to the next.
 *
 * Everything is a pure function of (frame) — studio and render agree, and the
 * choreography is unit-testable without rendering.
 */
import { type Coord, type Dir } from '@/lib/pathfinding'
import { CELL } from '@/lib/neumorphism'
import { MODULES, type ModuleName } from '@/stories/neo/modules/modules'

// ── grid + global config (30 fps) ──────────────────────────────────────────────

export const FPS = 30
export { CELL }

/** The row the module line lives on (centre-ish); the grid bleeds above & below. */
export const ROW = 8
export const ROWS = 16
/** Each named module plate spans this many cells (icon + wordmark). */
export const MODULE_SPAN = 3
const GAP = 2 // empty cells between modules (the chevron trail runs through them)
const STEP = MODULE_SPAN + GAP // 5 — module-to-module pitch
const START_COL = 3 // first module's left cell

/** The Controla modules — the DATA (blue, #4569FC) group — in pan order. */
export const DATA_MODULES: readonly ModuleName[] = [
  'hotpot',
  'sqlsense',
  'udon',
  'sushimi',
  'docusense',
  'junction',
  'glimpse',
  'foresight',
]

/** Each module: its left column, centre column, wordmark. */
export const MODULES_ROW = DATA_MODULES.map((name, k) => {
  const col = START_COL + k * STEP
  return { name, col, centerCol: col + 1, label: MODULES[name].name }
})

const LAST = MODULES_ROW[MODULES_ROW.length - 1]
/**
 * The «objetivo» — a goal node a gap past the last module. The line no longer
 * trails off into chevrons; it ARRIVES here («se acaba el grid y llega»). The
 * chain ENDS at this cell, so the head walks in and stops on the objective.
 */
export const GOAL_NODE: Coord = [LAST.col + MODULE_SPAN + GAP, ROW]
export const END_COL = GOAL_NODE[0]
export const COLUMNS = END_COL + 1
export const GRID_W = COLUMNS * CELL
export const GRID_H = ROWS * CELL

// ── small pure math ─────────────────────────────────────────────────────────────

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

// ── the chain — a straight horizontal line of cells along ROW ───────────────────

/** chain[i] is the cell at column (i + 1) on ROW; the head walks it left→right. */
export const CHAIN: Coord[] = Array.from({ length: END_COL }, (_, i) => [i + 1, ROW] as Coord)
export const CHAIN_LEN = CHAIN.length
export const CHAIN_DIRS: Dir[] = CHAIN.slice(0, -1).map(() => 'right' as Dir)

const moduleCols = new Set<number>()
for (const m of MODULES_ROW) for (let c = m.col; c < m.col + MODULE_SPAN; c += 1) moduleCols.add(c)
/** A chain cell covered by a module plate (its chevron is suppressed — a station). */
export const isModuleCell = (c: Coord) => c[1] === ROW && moduleCols.has(c[0])
/** The goal/objetivo cell — its chevron is suppressed too; the disc lives here. */
export const isGoalCell = (c: Coord) => c[1] === ROW && c[0] === GOAL_NODE[0]

// ── timeline · a stop-and-go horizontal sweep — rests on each module ────────────

export const START = 12 // the head sets off
export const PER_CELL = 9 // frames per cell while travelling between modules
export const DWELL = 60 // 2 s @ 30 fps — the camera rests on each module
export const OUTRO = 44
const START_I = 0 // head begins at chain index 0 (column 1)
const END_I = CHAIN_LEN - 1 // the head walks all the way to the goal cell

/**
 * The chain indices the head pauses on — each module's CENTRE cell. Centring the
 * head on a module centres the camera on it (camera P = headX), so the pan stops
 * squarely on the plate for `DWELL` frames before easing off to the next.
 */
export const STOP_INDICES = MODULES_ROW.map((m) => m.centerCol - 1)

/**
 * The stop-and-go timeline, precomputed as legs. Each module is reached by an
 * eased travelling leg, then held by a dwell leg (index constant). A final leg
 * carries the head from the last module out to the goal cell.
 */
type Leg = { f0: number; f1: number; i0: number; i1: number; dwell: boolean }
const LEGS: Leg[] = (() => {
  const legs: Leg[] = []
  let f = START
  let i = START_I
  for (const stop of STOP_INDICES) {
    const travel = (stop - i) * PER_CELL
    legs.push({ f0: f, f1: f + travel, i0: i, i1: stop, dwell: false })
    f += travel
    legs.push({ f0: f, f1: f + DWELL, i0: stop, i1: stop, dwell: true })
    f += DWELL
    i = stop
  }
  legs.push({ f0: f, f1: f + (END_I - i) * PER_CELL, i0: i, i1: END_I, dwell: false })
  return legs
})()

const HEAD_END_FRAME = LEGS[LEGS.length - 1].f1
export const DURATION = HEAD_END_FRAME + OUTRO

/** The head's chain index at `frame` — eased travel between modules, flat dwells. */
export function headAt(frame: number): number {
  if (frame <= START) return START_I
  for (const leg of LEGS) {
    if (frame <= leg.f1) {
      if (leg.dwell || leg.f1 === leg.f0) return leg.i0
      return lerp(leg.i0, leg.i1, smoother((frame - leg.f0) / (leg.f1 - leg.f0)))
    }
  }
  return END_I
}

/**
 * Scene frame the head ARRIVES at (and starts resting on) each module — its Rive
 * fires here, so the logo plays through the 2 s the camera dwells on the plate.
 */
export const MODULE_TRIGGER: number[] = LEGS.filter((l) => l.dwell).map((l) => Math.round(l.f0))

/** Scene frame the head reaches the goal/objetivo cell — the moment it «arrives». */
export const GOAL_TRIGGER = Math.round(HEAD_END_FRAME)

/** Chevron at chain `index` rises as the head reaches it and STAYS (the trail). */
export function cellGrow(frame: number, index: number): number {
  return smoother(clamp01(headAt(frame) - index + 1))
}

const EMERGE_LEAD = 22 // a module plate forms this many frames before the head arrives
const EMERGE_DRAW = 13
/** Emergence of module #`k` — appears just before the arrow reaches it. */
export function moduleGrow(frame: number, k: number): number {
  return smoother(clamp01((frame - (MODULE_TRIGGER[k] - EMERGE_LEAD)) / EMERGE_DRAW))
}

/** Emergence of the goal/objetivo — forms just before the head arrives, then holds. */
export function goalGrow(frame: number): number {
  return smoother(clamp01((frame - (GOAL_TRIGGER - EMERGE_LEAD)) / EMERGE_DRAW))
}

// ── camera — a pure horizontal pan (constant Y, constant zoom) ──────────────────

export const VISIBLE_COLS = 11 // columns framed across the width

export function cellCenterPx(c: Coord): [number, number] {
  return [(c[0] - 0.5) * CELL, (c[1] - 0.5) * CELL]
}

/** Horizontal pixel position of the (fractional) head along the row. */
export function headX(frame: number): number {
  return (headAt(frame) + 0.5) * CELL // chain index i → column i+1 → centre (i+0.5)*CELL
}

export function followZoom(W: number): number {
  return W / (VISIBLE_COLS * CELL)
}

const ROW_Y = (ROW - 0.5) * CELL

export function cameraPZ(frame: number, W: number, _H: number): { P: [number, number]; Z: number } {
  return { P: [headX(frame), ROW_Y], Z: followZoom(W) }
}
