/**
 * tejidoArranqueScript — pure frame-driven brain of «Tejido (arranque)».
 * ───────────────────────────────────────────────────────────────────────────
 * The ignition of the living tissue, as ONE continuous process — all a pure
 * function of (frame), so the studio and the render agree frame-for-frame and
 * the whole choreography is unit-testable without rendering.
 *
 *   1 · CUADRO  — a centred 2×2 (just four cells), drawn as a CLOSED little
 *                 square (its bounding box + cross, nothing beyond it). A single
 *                 raised arrow rises in a cell and sinks, then the next over rises
 *                 pointing the way, baton-passing clockwise (↑→↓←) for two laps so
 *                 one arrow seems to CIRCLE the square. The arrow never travels.
 *   2 · ABRE    — the square OPENS: its lines grow outward FROM the centre into a
 *                 huge field that bleeds off every edge (KIT_BLUE pen-tips, ring by
 *                 ring) while the camera pulls back. No frame, no tray — not a
 *                 panel, just graph paper. The arrow stays put in the centre.
 *   3 · MÓDULOS — all 16 AiKit modules emerge, scattered wide, as bare raised icon
 *                 plates (no names) — the catalogue.
 *   4 · TEJIDO  — the SAME arrow, from those four central cells, sets off and
 *                 threads EVERY module on one long, slow route; the chevrons it
 *                 raises now STAY, weaving a permanent trail across the field.
 *
 * The whole thing is one 4-connected CHAIN: two laps of the centre loop (the
 * cells light & sink — ephemeral) → the route out through every module (the cells
 * light & STAY — persistent). A single `head` walks it: it circles in beat 1,
 * RESTS on the first central cell through beats 2–3, then advances in beat 4.
 *
 * The visual shell (TejidoArranqueVideo) only reads these anchors; the plate
 * renderer is storeFlowScene's `FlowPlate` and the line renderer GridDrawIn's
 * `Stroke`, both reused verbatim.
 */
import { dirBetween, solve, type Coord, type Dir } from '@/lib/pathfinding'
import { CELL } from '@/lib/neumorphism'
import { type ModuleName } from '@/stories/neo/modules/modules'

// ── grid + global config (30 fps) ──────────────────────────────────────────────

export const FPS = 30
// A big field — many more rows & columns than fit on screen, so once it opens the
// grid bleeds off every edge (it is NOT a tidy panel that fills the frame).
export const COLUMNS = 24
export const ROWS = 16
export { CELL }
export const GRID_W = COLUMNS * CELL // 3072
export const GRID_H = ROWS * CELL // 2048
export const GRID_CENTER: [number, number] = [GRID_W / 2, GRID_H / 2] // [1536, 1024]

/** The two interior line indices the central 2×2 box is built around. */
export const CENTER_VLINE = COLUMNS / 2 // 12  (box verticals 11,12,13)
export const CENTER_HLINE = ROWS / 2 // 8  (box horizontals 7,8,9)
/** Pixel centre the field opens out from (= grid centre). */
export const ORIGIN_X = CENTER_VLINE * CELL // 1536
export const ORIGIN_Y = CENTER_HLINE * CELL // 1024

// ── small pure math ─────────────────────────────────────────────────────────────

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Quintic smootherstep — zero 1st & 2nd derivative at both ends (no jerk). */
export function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

// ── the central 2×2 loop (the four cells, clockwise) ────────────────────────────

const CV = CENTER_VLINE
const CH = CENTER_HLINE
/** The 4 cells of the centred 2×2, clockwise — each points at the next (↑→↓←). */
export const RELAY_CELLS: ReadonlyArray<{ at: Coord; dir: Dir }> = [
  { at: [CV, CH + 1], dir: 'up' }, // bottom-left → up
  { at: [CV, CH], dir: 'right' }, // top-left → right
  { at: [CV + 1, CH], dir: 'down' }, // top-right → down
  { at: [CV + 1, CH + 1], dir: 'left' }, // bottom-right → left
]
const LAPS = 2 // how many times the arrow circles before it sets off

// ── beat 3 layout · the 16 modules, scattered wide (also the visiting order) ────

/**
 * Placement IS the visiting order: a serpentine spread across the visible field —
 * top band L→R, down the right, middle band R→L, then the bottom band L→R — so
 * the route threads them with a long, clean weave and minimal self-crossing. Kept
 * inside the central ~15×8 region (cols 5–19, rows 5–12) so every icon stays on
 * screen while the rest of the grid bleeds off-edge.
 */
export const MODULE_LAYOUT: ReadonlyArray<{ name: ModuleName; at: Coord }> = [
  { name: 'hotpot', at: [5, 5] },
  { name: 'sqlsense', at: [9, 6] },
  { name: 'udon', at: [12, 5] },
  { name: 'sushimi', at: [16, 6] },
  { name: 'docusense', at: [19, 5] },
  { name: 'junction', at: [19, 9] },
  { name: 'skillHub', at: [16, 8] },
  { name: 'glimpse', at: [14, 9] },
  { name: 'foresight', at: [10, 8] },
  { name: 'actionRunner', at: [7, 9] },
  { name: 'actionScript', at: [5, 8] },
  { name: 'teamwork', at: [6, 12] },
  { name: 'feedbackLoop', at: [9, 11] },
  { name: 'heartbeat', at: [12, 12] },
  { name: 'smartProcess', at: [16, 11] },
  { name: 'forge', at: [19, 12] },
]

// ── the one continuous chain: loop laps (ephemeral) → route (persistent) ────────

const key = (c: Coord) => `${c[0]},${c[1]}`

/** Concatenate BFS hops between successive cells into one 4-connected chain. */
function buildChain(cells: Coord[]): Coord[] {
  if (cells.length === 0) return []
  const chain: Coord[] = [cells[0]]
  for (let i = 1; i < cells.length; i += 1) {
    const seg = solve(cells[i - 1], cells[i], { columns: COLUMNS, rows: ROWS })
    for (let s = 1; s < seg.length; s += 1) chain.push(seg[s]) // skip the dup start
  }
  return chain
}

// laps around the loop — the 4 cells are mutually adjacent, so this is 4-connected.
const RELAY_SEQ: Coord[] = Array.from({ length: LAPS }, () => RELAY_CELLS.map((c) => c.at)).flat()
/** Index where the loop ends and the persistent route begins — the resting cell. */
export const RELAY_LEN = RELAY_SEQ.length // 8

// the route starts AT the resting cell (continuity) and threads every module.
const REST_CELL: Coord = RELAY_CELLS[0].at // [12,9]
const ROUTE_SEQ: Coord[] = buildChain([REST_CELL, ...MODULE_LAYOUT.map((m) => m.at)])

export const CHAIN: Coord[] = [...RELAY_SEQ, ...ROUTE_SEQ]
export const CHAIN_LEN = CHAIN.length
/** Direction each chain cell points (toward the next). Length = CHAIN_LEN - 1. */
export const CHAIN_DIRS: Dir[] = CHAIN.slice(0, -1).map((c, i) => dirBetween(c, CHAIN[i + 1]))

/** Cells whose chevron rises and SINKS again (the circling laps); the rest STAY. */
export const isPersistent = (i: number) => i >= RELAY_LEN

const MODULE_KEYS = new Set(MODULE_LAYOUT.map((m) => key(m.at)))
/** A chain cell that holds a module icon (its chevron is suppressed — it's a station). */
export const isModuleCell = (c: Coord) => MODULE_KEYS.has(key(c))

// ── timeline (30 fps) ──────────────────────────────────────────────────────────

export const P1_START = 8 // the closed square is ALREADY there from frame 0; the relay starts promptly
const STEP1 = 16 // frames the head advances per loop cell
export const P1_END = P1_START + RELAY_LEN * STEP1 // 146 — head reaches the resting cell

export const P2_START = P1_END + 2 // 148 — the square opens
export const LINE_DRAW = 16 // frames one half-line takes to trace out from the centre
export const STROKE_SETTLE = 11 // pen tip → neutral hairline
const RING_STAGGER = 3 // delay between rings spreading out from the centre
export const ZOOMOUT = 58 // frames the camera takes to pull from the box to the field
export const P2_END = P2_START + ZOOMOUT + 4 // 210

/** Start frame for the half-strokes of the interior vertical line at boundary `j`. */
export function vLineStart(j: number): number {
  return P2_START + Math.abs(j - CENTER_VLINE) * RING_STAGGER
}
/** Start frame for the half-strokes of the interior horizontal line at boundary `i`. */
export function hLineStart(i: number): number {
  return P2_START + Math.abs(i - CENTER_HLINE) * RING_STAGGER
}

export const P3_START = P2_END + 4 // 214
const ICON_STAGGER = 3
const ICON_DRAW = 16
export const P3_END = P3_START + (MODULE_LAYOUT.length - 1) * ICON_STAGGER + ICON_DRAW // 275

/** Emergence of module #`index` (in layout/serpentine order). */
export function iconGrow(frame: number, index: number): number {
  const start = P3_START + index * ICON_STAGGER
  return smoother(clamp01((frame - start) / ICON_DRAW))
}

export const P4_START = P3_END + 8 // 283 — the arrow sets off from the centre
const PER_CELL = 4 // frames the head advances per route cell — slow & deliberate
export const P4_END = Math.ceil(P4_START + (CHAIN_LEN - RELAY_LEN) * PER_CELL + 2)

/**
 * Scene frame at which the head reaches each module (in MODULE_LAYOUT order) — the
 * cue to fire that module's Rive clip as the arrow passes through its cell.
 */
export const MODULE_TRIGGER: number[] = MODULE_LAYOUT.map((m) => {
  const idx = CHAIN.findIndex((c) => c[0] === m.at[0] && c[1] === m.at[1])
  return Math.round(P4_START + (idx - RELAY_LEN) * PER_CELL)
})

/**
 * The head's position along the CHAIN at `frame`: it circles the loop in beat 1
 * (0 → RELAY_LEN), RESTS on the first route cell through beats 2–3, then advances
 * along the route in beat 4. This single walk is what gives the continuity Pablo
 * asked for — the arrow never restarts; it picks up from where it was resting.
 */
export function headAt(frame: number): number {
  if (frame < P1_START) return -2
  if (frame < P1_END) return (frame - P1_START) / STEP1 // 0 → RELAY_LEN
  if (frame < P4_START) return RELAY_LEN // resting on the centre cell
  return RELAY_LEN + (frame - P4_START) / PER_CELL // advancing the route
}

/**
 * Emergence of the chevron at chain `index`. Loop cells (i < RELAY_LEN) ride a
 * travelling bump — they rise as the head reaches them and SINK as it leaves
 * (the circling). Route cells (i ≥ RELAY_LEN) ease up to full as the head reaches
 * them and STAY — the permanent woven trail (and the resting arrow at the centre).
 */
export function cellGrow(frame: number, index: number): number {
  const head = headAt(frame)
  if (!isPersistent(index)) {
    const x = head - index
    return Math.abs(x) >= 1 ? 0 : Math.cos((Math.PI * x) / 2) ** 2
  }
  return smoother(clamp01(head - index + 1)) // full when head reaches it, then held
}

// ── outro + total ──────────────────────────────────────────────────────────────

const OUTRO = 50
export const DURATION = P4_END + OUTRO

// ── camera (P, Z) — P stays on the centre; Z pulls back to the bleeding field ───

const VISIBLE_COLS = 17 // how many columns the field framing shows across the width
const SEED_FILL = 0.6 // the closed square fills ~60% of the height (clear air around it)
const PUSH = 0.025 // a whisper of cinematic push-in across the weave, eased back on the outro

/** Field framing: shows ~VISIBLE_COLS columns; the grid is bigger, so it bleeds off-edge. */
export function fieldZoom(W: number, _H: number): number {
  return W / (VISIBLE_COLS * CELL)
}
/** Tight on the closed 2×2 square at the start — four cells floating with air around. */
export function seedZoom(_W: number, H: number): number {
  return (SEED_FILL * H) / (2 * CELL)
}

export function cameraPZ(frame: number, W: number, H: number): { P: [number, number]; Z: number } {
  const z1 = seedZoom(W, H)
  const zf = fieldZoom(W, H)
  let Z = z1
  if (frame >= P2_START + ZOOMOUT) Z = zf
  else if (frame > P2_START) Z = lerp(z1, zf, smoother((frame - P2_START) / ZOOMOUT))

  if (frame >= P4_START) {
    const tIn = smoother(clamp01((frame - P4_START) / (P4_END - P4_START)))
    const tOut = smoother(clamp01((frame - P4_END) / OUTRO))
    Z = zf * (1 + PUSH * tIn * (1 - tOut))
  }
  return { P: GRID_CENTER, Z }
}
