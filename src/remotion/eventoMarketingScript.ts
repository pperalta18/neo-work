/**
 * eventoMarketingScript — pure frame-driven brain of «Evento · Marketing».
 * ──────────────────────────────────────────────────────────────────────────
 * Act A of the scene: the AI runs a real process over the flat neumorphic grid
 * to **prepare the marketing of an event** — read exactly like StoreFlow, a 2D
 * pathfinding route whose elevated plates emerge step by step while a virtual
 * camera pans plate-to-plate. The chain ends on the **Google Calendar** plate
 * («Consultando timeline de montaje»): the AI checks the build timeline to
 * schedule the campaign — and that consultation is what hands the scene off to
 * the conversation (Act B, authored in the Video shell), where the AI questions
 * why the assembly day falls before the graphic material arrives.
 *
 * Everything here is a pure function of `frame` (no React, no asset imports) so
 * the route geometry + camera choreography are node-testable and stay in lockstep
 * with the render. The visual shell (EventoMarketingVideo) reuses StoreFlow's
 * `FlowPlate` renderer over a full-bleed gridlines plane (no tray, no nodes, no
 * module icons) and only reads these anchors. Camera math is
 * the StoreFlow pattern (quintic-eased windows, arrow rises then plate rises),
 * re-derived for this route — StoreFlow's own math stays its single source of
 * truth, untouched.
 */
import { CELL } from '@/lib/neumorphism'
import {
  footprint,
  reflowRoute,
  routeArrows,
  type Dir,
  type RouteStep,
} from '@/lib/pathfinding'

// ── the route: a marketing-prep process, climaxing on the calendar ─────────────
// Straight serpentine-free chain (camera pans left→right): three AiKit modules
// preparing the campaign, then the Google Calendar consultation as the climax.
// The calendar plate is wide (colSpan 4) so its long label fits on one line; its
// brand logo is injected by the Video via `iconNode` (see CAL_INDEX).

const RAW_ROUTE: RouteStep[] = [
  { at: [1, 2], colSpan: 2, text: { main: 'Brief del evento' } },
  { at: [3, 2] },
  { at: [4, 2], colSpan: 2, text: { main: 'Piezas creativas' } },
  { at: [6, 2] },
  { at: [7, 2], colSpan: 2, text: { main: 'Programar campaña' } },
  { at: [9, 2] },
  // climax — the Google Calendar consultation (brand logo injected by the shell)
  { at: [10, 2], colSpan: 4, text: { main: 'Consultando timeline de montaje' } },
]

/** The reflowed route (plates sit edge-to-edge, never overlapping). */
export const ROUTE = reflowRoute(RAW_ROUTE)
/** Index of the Google Calendar plate (last step) — the shell swaps in its logo. */
export const CAL_INDEX = ROUTE.length - 1
export const TOTAL_STEPS = ROUTE.length

export const COLUMNS = Math.max(...ROUTE.map((s) => footprint(s).c1))
export const ROWS = 3
export const GRID_W = COLUMNS * CELL
export const GRID_H = ROWS * CELL
/** The grid-space row the route sits on (cell centre y = (ROUTE_ROW − 0.5)·CELL). */
export const ROUTE_ROW = 2
/** Arrow direction per step (off-grid goal to the right keeps the last arrow flat). */
export const ARROWS: Dir[] = routeArrows(ROUTE, [COLUMNS + 1, ROUTE_ROW])

const hasContent = (s: RouteStep) => Boolean(s.text || s.image || s.icon || s.module)

/** Pixel centre of a step's footprint, in grid space. */
function stepCenterPx(step: RouteStep): [number, number] {
  const fp = footprint(step)
  return [((fp.c0 + fp.c1 - 1) / 2) * CELL, ((fp.r0 + fp.r1 - 1) / 2) * CELL]
}

export const CENTERS = ROUTE.map(stepCenterPx)
export const CONTENT_IDX = ROUTE.map((s, i) => (hasContent(s) ? i : -1)).filter((i) => i >= 0)
export const CONTENT_CENTERS = CONTENT_IDX.map((i) => CENTERS[i])
/** Number of meaningful steps (the plates the camera reads). */
export const M = CONTENT_IDX.length

// ── timeline (30 fps) ─────────────────────────────────────────────────────────

export const INTRO = 22 // brief push-in on the first plate
export const BEAT = 52 // one step (calm, so motion never snaps)
export const HOLD = 54 // settle tight on the calendar before the handoff to chat

export const A_BEATS_END = INTRO + M * BEAT
/** Total length of Act A (route) in frames. */
export const ACT_A_DURATION = A_BEATS_END + HOLD

// Within a beat: the connecting arrow rises early, the plate rises overlapping it,
// the camera settles a hair before the plate finishes — so steps flow, never snap.
const ARROW_IN: [number, number] = [0.04, 0.46]
const PLATE_IN: [number, number] = [0.38, 0.82]
const CAM_ARRIVE = 0.72

const Z_BASE = 2.0
const Z_INTRO = 1.6
const Z_CAL = 2.18 // a touch closer as the lens lands on the calendar

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Quintic smootherstep — zero 1st & 2nd derivative at both ends (no jerk). */
export function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

const window01 = (u: number, [lo, hi]: [number, number]) => smoother((u - lo) / (hi - lo))

type Zone = 'intro' | 'beat' | 'hold'
function zoneAt(frame: number): { zone: Zone; k: number; u: number } {
  if (frame < INTRO) return { zone: 'intro', k: 0, u: frame / INTRO }
  if (frame >= A_BEATS_END) return { zone: 'hold', k: M - 1, u: clamp01((frame - A_BEATS_END) / HOLD) }
  const f = frame - INTRO
  const k = Math.min(M - 1, Math.floor(f / BEAT))
  return { zone: 'beat', k, u: (f - k * BEAT) / BEAT }
}

/** Continuous `revealedCount` for the route (arrow then plate per beat). */
export function flowReveal(frame: number): number {
  if (frame < INTRO) return 0
  if (frame >= A_BEATS_END) return TOTAL_STEPS
  const { k, u } = zoneAt(frame)
  const cur = CONTENT_IDX[k]
  const baseline = k === 0 ? 0 : CONTENT_IDX[k - 1] + 1
  return baseline + (cur - baseline) * window01(u, ARROW_IN) + window01(u, PLATE_IN)
}

/** The grid-space point the lens centres on — eases between content centres. */
export function flowFocus(frame: number): [number, number] {
  if (frame < INTRO) return CONTENT_CENTERS[0]
  if (frame >= A_BEATS_END) return CONTENT_CENTERS[M - 1]
  const { k, u } = zoneAt(frame)
  const cur = CONTENT_CENTERS[k]
  const prev = k === 0 ? cur : CONTENT_CENTERS[k - 1]
  const t = smoother(u / CAM_ARRIVE)
  return [lerp(prev[0], cur[0], t), lerp(prev[1], cur[1], t)]
}

/** Zoom: ease in on the intro, hold across the flow, push closer on the calendar. */
export function flowZoom(frame: number): number {
  if (frame < INTRO) return lerp(Z_INTRO, Z_BASE, smoother(frame / INTRO))
  const lastBeatStart = INTRO + (M - 1) * BEAT
  if (frame >= lastBeatStart) {
    const t = smoother(clamp01((frame - lastBeatStart) / (BEAT + HOLD * 0.5)))
    return lerp(Z_BASE, Z_CAL, t)
  }
  return Z_BASE
}

/** Camera centre P and zoom Z for the route at `frame`. */
export function flowCameraPZ(frame: number): { P: [number, number]; Z: number } {
  return { P: flowFocus(frame), Z: flowZoom(frame) }
}
