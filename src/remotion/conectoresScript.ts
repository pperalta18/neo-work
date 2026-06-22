/**
 * conectoresScript — pure frame-driven brain of «Conectores (rodeo)».
 * ───────────────────────────────────────────────────────────────────────────
 * The flip side of [[tejido-arranque-scene]]: the real third-party tools
 * (Notion, Zapier, Gmail, Jira, Outlook) sit on raised plates across the field,
 * and the arrow's route goes TO each one — but instead of passing THROUGH it (as
 * it does the AiKit modules) it goes AROUND it: it skirts the full 8-cell ring
 * that encircles the logo, leaving a box of arrows around each tool, then carries
 * on to the next. The logo cells are obstacles (blocked); BFS connects the rings.
 *
 * Everything is a pure function of (frame); the shell only reads these anchors.
 * The plate renderer is storeFlowScene's `FlowPlate` (reused verbatim, with the
 * logo injected via its `iconNode` slot); the trail is its `Chevron` plate.
 */
import { dirBetween, solve, type Coord, type Dir } from '@/lib/pathfinding'
import { CELL } from '@/lib/neumorphism'

export const FPS = 30
export const COLUMNS = 20
export const ROWS = 12
export { CELL }
export const GRID_W = COLUMNS * CELL // 2560
export const GRID_H = ROWS * CELL // 1536
export const GRID_CENTER: [number, number] = [GRID_W / 2, GRID_H / 2] // [1280, 768]

// ── small pure math ─────────────────────────────────────────────────────────────

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

// ── the five connectors, scattered on a clockwise perimeter tour ───────────────

export type LogoName = 'outlook' | 'notion' | 'zapier' | 'jira' | 'gmail'
/** Order IS the visiting order — a clockwise sweep around the field. */
export const LOGOS: ReadonlyArray<{ name: LogoName; at: Coord }> = [
  { name: 'outlook', at: [5, 4] },
  { name: 'notion', at: [10, 3] },
  { name: 'zapier', at: [15, 4] },
  { name: 'jira', at: [15, 9] },
  { name: 'gmail', at: [6, 9] },
]

/** The 8 cells encircling a logo, as a 4-connected cycle (clockwise from left). */
function ring([c, r]: Coord): Coord[] {
  return [
    [c - 1, r],
    [c - 1, r - 1],
    [c, r - 1],
    [c + 1, r - 1],
    [c + 1, r],
    [c + 1, r + 1],
    [c, r + 1],
    [c - 1, r + 1],
  ]
}

// ── the route: appears at the left, skirts the ring of each logo, never enters ──

const START: Coord = [2, 6]
const LOGO_CENTERS: Coord[] = LOGOS.map((l) => l.at) // obstacles — the route goes around them

function buildChain(): Coord[] {
  const chain: Coord[] = [START]
  for (const logo of LOGOS) {
    const rg = ring(logo.at)
    // travel from where we are to the ring's entry, AROUND every logo (blocked)
    const seg = solve(chain[chain.length - 1], rg[0], {
      columns: COLUMNS,
      rows: ROWS,
      blocked: LOGO_CENTERS,
    })
    for (let s = 1; s < seg.length; s += 1) chain.push(seg[s])
    // skirt the ring (rg[0] is already the last cell of `seg`)
    for (let k = 1; k < rg.length; k += 1) chain.push(rg[k])
  }
  return chain
}

export const CHAIN: Coord[] = buildChain()
export const CHAIN_LEN = CHAIN.length
export const CHAIN_DIRS: Dir[] = CHAIN.slice(0, -1).map((c, i) => dirBetween(c, CHAIN[i + 1]))

// ── timeline (30 fps) ──────────────────────────────────────────────────────────

export const LOGO_START = 12
const LOGO_STAGGER = 8
const LOGO_DRAW = 14
export const LOGO_END = LOGO_START + (LOGOS.length - 1) * LOGO_STAGGER + LOGO_DRAW

/** Emergence of logo #`index` (in visiting order). */
export function logoGrow(frame: number, index: number): number {
  const start = LOGO_START + index * LOGO_STAGGER
  return smoother(clamp01((frame - start) / LOGO_DRAW))
}

export const PATH_START = LOGO_END + 12
const PER_CELL = 4 // frames the head advances per route cell — calm, so the skirt reads
const CELL_RAMP = 6
export const PATH_END = Math.ceil(PATH_START + CHAIN_LEN * PER_CELL + CELL_RAMP)

export function headAt(frame: number): number {
  if (frame < PATH_START) return -2
  return (frame - PATH_START) / PER_CELL
}

/** Emergence of the trail chevron at chain `index` — rises as the head reaches it, then STAYS. */
export function trailGrow(frame: number, index: number): number {
  const head = headAt(frame)
  return smoother(clamp01(head - index + 1))
}

const OUTRO = 50
export const DURATION = PATH_END + OUTRO

// ── camera (P, Z) — wide on the whole field; a whisper of push across the route ─

const VISIBLE_COLS = 18
const PUSH = 0.03

export function fieldZoom(W: number, _H: number): number {
  return W / (VISIBLE_COLS * CELL)
}

export function cameraPZ(frame: number, W: number, H: number): { P: [number, number]; Z: number } {
  const zf = fieldZoom(W, H)
  let Z = zf
  if (frame >= PATH_START) {
    const tIn = smoother(clamp01((frame - PATH_START) / (PATH_END - PATH_START)))
    const tOut = smoother(clamp01((frame - PATH_END) / OUTRO))
    Z = zf * (1 + PUSH * tIn * (1 - tOut))
  }
  return { P: GRID_CENTER, Z }
}
