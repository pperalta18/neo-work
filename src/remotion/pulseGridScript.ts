/**
 * pulseGridScript — pure frame-driven brain of «Pulse Grid».
 * ───────────────────────────────────────────────────────────────────────────
 * A full-bleed field grid with one raised CIRCLE at the very centre, spanning a
 * 4×4 block of cells. The circle *pulses*: on every beat a blue core swells, a
 * shockwave ring rides out from its rim, and — in ALL directions — a burst of
 * pathfinding comets is fired. Each comet is the kit's arrow-trail (raised
 * `FlowPlate` chevrons): it streaks outward along its own Manhattan staircase,
 * leaves the frame, and its tail DISSOLVES behind the head as it goes. The lens
 * stays pinned on the centre and pulls back a hair over the whole take, so each
 * fresh burst reads against a slowly widening field.
 *
 * Sibling of [[conectores-rodeo-scene]] / [[tejido-arranque-scene]]: same field
 * (`GridLines`), same plate (`FlowPlate`), same chevron — only the choreography
 * is new (radial emission + a comet trail that fades instead of staying).
 *
 * Everything here is a pure function of `frame`; the shell only reads anchors.
 */
import { dirBetween, type Coord, type Dir } from '@/lib/pathfinding'
import { CELL } from '@/lib/neumorphism'

export const FPS = 30

// ── the field ─────────────────────────────────────────────────────────────────
// Big enough that even at the most zoomed-out moment the hairlines bleed off
// every edge (no visible border): 28×18 cells against a 1920×1080 lens.
export const COLUMNS = 28
export const ROWS = 18
export { CELL }
export const GRID_W = COLUMNS * CELL // 3584
export const GRID_H = ROWS * CELL // 2304
export const GRID_CENTER: [number, number] = [GRID_W / 2, GRID_H / 2] // [1792, 1152]

export const SCREEN_W = 1920
export const SCREEN_H = 1080

// Camera zoom band (grid px → screen px). Declared up here because the radial
// route lengths are sized against the most-zoomed-out frame (Z_END).
export const Z_START = 0.92 // close on the circle at the top
export const Z_END = 0.7 // pulled back, the field wide (still bleeds: cover ≈ 0.54)

// ── the central 4×4 circle ──────────────────────────────────────────────────────
// Inclusive cell bounds of the plate (1-indexed). Centred on the grid.
export const PLATE = { c0: 13, c1: 16, r0: 8, r1: 11 } as const
/** Circle centre, in fractional 1-indexed cell coords (14.5, 9.5 → grid centre). */
const CC: [number, number] = [(PLATE.c0 + PLATE.c1 + 1) / 2, (PLATE.r0 + PLATE.r1 + 1) / 2]
/** Half-extent of the plate block, in cells (2 → a 4×4 reaches ±2 from centre). */
const PLATE_HALF = (PLATE.c1 - PLATE.c0 + 1) / 2

/** Pixel geometry of the circle container (consumed by the shell). */
export const CIRCLE_LEFT = (PLATE.c0 - 1) * CELL // 1536
export const CIRCLE_TOP = (PLATE.r0 - 1) * CELL // 896
export const CIRCLE_SIZE = (PLATE.c1 - PLATE.c0 + 1) * CELL // 512

// ── small pure math ─────────────────────────────────────────────────────────────

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Quintic smootherstep — zero 1st & 2nd derivative at both ends (no jerk). */
export function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** Deterministic 0..1 PRNG (mulberry32) — no Math.random in render. */
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Centre of a (possibly off-grid) cell, in grid pixels. 1-indexed coords. */
export function cellCenterPx([c, r]: Coord): [number, number] {
  return [(c - 0.5) * CELL, (r - 0.5) * CELL]
}

const inPlate = (c: number, r: number) =>
  c >= PLATE.c0 && c <= PLATE.c1 && r >= PLATE.r0 && r <= PLATE.r1

// ── radial route builder ───────────────────────────────────────────────────────
// March a ray out of the circle and quantise it to a 4-connected Manhattan
// staircase. Pure cardinals stay straight; everything else zig-zags, the corner
// turned this way then that, so every spoke "takes a different path".

const SAMPLE = 0.32 // ray sampling step (cells)
const START_R = PLATE_HALF + 0.55 // first cell sits just off the plate rim

function buildRoute(angle: number, lenCells: number, startParity: 0 | 1): Coord[] {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  const out: Coord[] = []
  let prev: Coord | null = null
  let parity = startParity

  const pushStep = (c: Coord) => {
    if (inPlate(c[0], c[1])) return
    const last = out[out.length - 1]
    if (last && last[0] === c[0] && last[1] === c[1]) return
    out.push(c)
  }

  for (let r = START_R; r <= lenCells; r += SAMPLE) {
    const cell: Coord = [Math.round(CC[0] + dx * r), Math.round(CC[1] + dy * r)]
    if (prev && cell[0] === prev[0] && cell[1] === prev[1]) continue

    if (prev) {
      // Walk one cardinal step at a time from prev → cell so the chain is always
      // 4-connected, alternating the turned axis at each corner (the zig-zag).
      let cur: Coord = [prev[0], prev[1]]
      while (cur[0] !== cell[0] || cur[1] !== cell[1]) {
        const needC = cell[0] - cur[0]
        const needR = cell[1] - cur[1]
        let sc = 0
        let sr = 0
        if (needC !== 0 && needR !== 0) {
          if (parity === 0) sc = Math.sign(needC)
          else sr = Math.sign(needR)
          parity = parity === 0 ? 1 : 0
        } else if (needC !== 0) {
          sc = Math.sign(needC)
        } else {
          sr = Math.sign(needR)
        }
        cur = [cur[0] + sc, cur[1] + sr]
        pushStep(cur)
      }
    } else {
      pushStep(cell)
    }
    prev = cell
  }
  return out
}

/** Cells to leave the most-zoomed-out frame along `angle`, in cell units. */
function exitRadiusCells(angle: number): number {
  const halfWCells = SCREEN_W / Z_END / CELL / 2
  const halfHCells = SCREEN_H / Z_END / CELL / 2
  const cx = Math.max(Math.abs(Math.cos(angle)), 0.08)
  const cy = Math.max(Math.abs(Math.sin(angle)), 0.08)
  return Math.min(halfWCells / cx, halfHCells / cy)
}

// ── comet trail shape ───────────────────────────────────────────────────────────
// The head is a bright crest; the tail dissolves over TAIL cells behind it.

export const LEAD = 1.0 // how far ahead a cell starts to bloom (cells)
export const TAIL = 5.0 // how many cells of fading trail follow the head — a long, soft dissolve

/** Emergence 0..1 of the chevron at chain `index`, given the float head pos. */
export function cometGrow(head: number, index: number): number {
  const d = head - index
  if (d < -LEAD || d > TAIL) return 0
  const emerge = smoother(clamp01((d + LEAD) / LEAD))
  const fade = smoother(clamp01((TAIL - d) / TAIL))
  return emerge * fade
}

/** 0..1 nearness of the head to cell `index` — pops/glows the crest plate. */
export function headProx(head: number, index: number): number {
  const d = Math.abs(head - index)
  if (d > 1.1) return 0
  return smoother(1 - d / 1.1)
}

// ── timeline (30 fps) ──────────────────────────────────────────────────────────

export const PULSE0 = 18 // first emission
export const PERIOD = 60 // emission spacing — calm; the slow comets overlap gently
export const DURATION = 900 // ~30 s, meditative

const N_ROUTES = 12 // spokes per burst — a full radial fan
const PER_CELL_BASE = 3.9 // frames the head advances per cell — slow, graceful
const SPOKE_STAGGER = 3 // each spoke ignites after the last → the fan unfurls as a sweep

// Keep emitting while the burst can mostly clear the frame before the cut.
const LAST_OK = DURATION - 110
export const NUM_PULSES = Math.floor((LAST_OK - PULSE0) / PERIOD) + 1

export type CometRoute = {
  cells: Coord[]
  dirs: Dir[]
  startDelay: number
  perCell: number
  len: number
}
export type Burst = { index: number; frame: number; routes: CometRoute[] }

function buildBurst(index: number, frame: number): Burst {
  const pr = rng(0x9e37 + index * 2654435761)
  const rot = pr() * Math.PI * 2 // each burst spins, so no two look alike
  const routes: CometRoute[] = []
  for (let i = 0; i < N_ROUTES; i += 1) {
    const rr = rng((index + 1) * 100003 + (i + 1) * 6151)
    const slot = (i + 0.5) / N_ROUTES
    const jitter = (rr() - 0.5) * (Math.PI / N_ROUTES) * 0.8
    const angle = rot + slot * Math.PI * 2 + jitter
    const len = Math.max(8, Math.min(20, Math.ceil(exitRadiusCells(angle) + TAIL + 2)))
    const cells = buildRoute(angle, len, rr() < 0.5 ? 0 : 1)
    const dirs: Dir[] = cells.map((c, k) =>
      k < cells.length - 1 ? dirBetween(c, cells[k + 1]) : dirBetween(cells[Math.max(0, k - 1)], c),
    )
    routes.push({
      cells,
      dirs,
      // the sweep: spoke i ignites SPOKE_STAGGER after i-1 (+ a hair of jitter)
      startDelay: Math.max(0, Math.round(i * SPOKE_STAGGER + (rr() - 0.5) * 2)),
      perCell: PER_CELL_BASE + (rr() - 0.5) * 0.35,
      len: cells.length,
    })
  }
  return { index, frame, routes }
}

export const BURSTS: Burst[] = Array.from({ length: NUM_PULSES }, (_, p) =>
  buildBurst(p, PULSE0 + p * PERIOD),
)
export const PULSE_FRAMES: number[] = BURSTS.map((b) => b.frame)

/** Float head position of a comet along its chain at `frame` (−∞ before fired). */
export function routeHead(frame: number, burst: Burst, route: CometRoute): number {
  const t0 = burst.frame + route.startDelay
  if (frame < t0) return -99
  return (frame - t0) / route.perCell
}

/** Whether a comet has anything on screen at `frame` (head inside its window). */
export function routeAlive(frame: number, burst: Burst, route: CometRoute): boolean {
  const head = routeHead(frame, burst, route)
  return head >= -LEAD && head <= route.len - 1 + TAIL
}

// ── camera (P, Z) — pinned on the centre, one slow elegant pull-back ────────────

export function cameraZoom(frame: number): number {
  // a single, smooth, slow zoom-out across the whole take — nothing else
  return lerp(Z_START, Z_END, smoother(frame / DURATION))
}

export function cameraPZ(frame: number, _W: number, _H: number): { P: [number, number]; Z: number } {
  return { P: GRID_CENTER, Z: cameraZoom(frame) }
}
