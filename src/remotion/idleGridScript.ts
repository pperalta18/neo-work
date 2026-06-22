/**
 * idleGridScript — the deterministic brain behind {@link IdleGridVideo}.
 * ────────────────────────────────────────────────────────────────────────────
 * The idle screen between presentations: a dense, ALWAYS-PRESENT 64px grid
 * (it does not draw itself in) on which blank neumorphic plates — *elevations* —
 * rise and sink in random cells. No paths, no arrows, no goal, no glows: just
 * the field quietly breathing, so it never pulls focus from the presenter.
 *
 * Pure + seeded (Remotion forbids `Math.random()` at frame time): one mulberry32
 * PRNG schedules every plate event up front, so the render is byte-identical
 * every time. The static grid is constant across the whole clip, so the loop is
 * seamless without any fade — the field is simply empty at both ends.
 */

// ── Stage & grid ─────────────────────────────────────────────────────────────
export const W = 1920
export const H = 1728
// 64px module → a dense 30×27 field (matches the wall idle's column density),
// dividing both axes exactly so the grid bleeds edge to edge with no margin.
export const CELL = 64
export const COLS = Math.round(W / CELL) // 30
export const ROWS = Math.round(H / CELL) // 27

export const PLATE_INSET = 9
export const PLATE = CELL - PLATE_INSET * 2 // 46
export const PLATE_RADIUS = 5

// ── Palette (the keynote dark slides) ────────────────────────────────────────
export const SURFACE_DARK = '#161a20'
export const GRID_LINE = 'rgba(54, 64, 79, 0.5)'
export const SLIDE_BACKGROUND =
  'linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.01) 100%), linear-gradient(90deg, rgb(22, 26, 32) 0%, rgb(22, 26, 32) 100%)'
/** Small neumorphic protrude, scaled to the 46px plate (light source top-left).
 *  Pure relief — no coloured glow. */
export const PLATE_RAISED_SHADOW = '-3px -3px 7px #212830, 3px 3px 7px rgba(0, 0, 0, 0.45)'

/** Top-left of a plate, from a 0-indexed cell. */
export const cellOrigin = (c: number, r: number) => ({
  x: c * CELL + PLATE_INSET,
  y: r * CELL + PLATE_INSET,
})

// ── Cadence (frames @30fps) ──────────────────────────────────────────────────
// Calm: a plate eases up over ~0.6s, rests a couple seconds, eases back down.
// Several spawn per beat so the field always has a gentle scatter of elevations
// without ever feeling busy.
export const PLATE_RISE = 18
export const PLATE_SINK = 24
const HOLD_MIN = 48
const HOLD_MAX = 132
const SPAWN_EVERY_MIN = 9
const SPAWN_EVERY_MAX = 17
const PER_SPAWN_MIN = 1
const PER_SPAWN_MAX = 2

const START = 30
// A long idle loop (~4 min) so it doesn't visibly repeat between talks.
export const IDLE_GRID_DURATION = 7200
const STOP = IDLE_GRID_DURATION - (PLATE_RISE + HOLD_MAX + PLATE_SINK + 30) // empty before the loop point

export type PlateEvent = { c: number; r: number; appear: number; hold: number }

// ── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────
function mulberry32(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const randInt = (rng: () => number, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1))

// ── Event schedule ───────────────────────────────────────────────────────────
// Walk the timeline, spawning a few elevations per beat in random cells. A cell
// can't be re-lit while a previous elevation there is still on screen (a light
// occupancy map avoids re-pop flicker).
function buildEvents(): PlateEvent[] {
  const rng = mulberry32(0x1d1e_64) // "idle" · 64px
  const events: PlateEvent[] = []
  const lastEnd = new Map<number, number>()
  let t = START

  while (t < STOP) {
    const count = randInt(rng, PER_SPAWN_MIN, PER_SPAWN_MAX)
    for (let i = 0; i < count; i += 1) {
      let c = 0
      let r = 0
      let free = false
      for (let attempt = 0; attempt < 8 && !free; attempt += 1) {
        c = randInt(rng, 0, COLS - 1)
        r = randInt(rng, 0, ROWS - 1)
        free = (lastEnd.get(r * COLS + c) ?? -1) < t
      }
      if (!free) continue
      const hold = randInt(rng, HOLD_MIN, HOLD_MAX)
      events.push({ c, r, appear: t, hold })
      lastEnd.set(r * COLS + c, t + PLATE_RISE + hold + PLATE_SINK)
    }
    t += randInt(rng, SPAWN_EVERY_MIN, SPAWN_EVERY_MAX)
  }
  return events
}

export const EVENTS = buildEvents()
