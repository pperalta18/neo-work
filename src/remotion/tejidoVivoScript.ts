/**
 * tejidoVivoScript — pure frame-driven brain of «Tejido vivo».
 * ───────────────────────────────────────────────────────────────────────────
 * A HUGE light-neumorphic grid (StoreFlow's exact surface) seen wide, teeming
 * with MANY micro-process flows running at once — "un organismo vivo en el que
 * hay muchos procesos que pasan al mismo tiempo". Each flow is an AUTHORED REAL
 * business process (Pedido→Validar→Pago→Factura→Avisar→Stock→Reponer, Ticket→
 * Asignar→Resolver→Cerrar, …) — a coherent serpentine of AiKit module steps
 * (tools) and concrete action steps (verbs), joined by arrows. The routes mean
 * something; they are processes, not decoration. The field FILLS over time;
 * ephemeral flows emerge, run and DISSIPATE back to bare grid (apoptosis), while
 * a minority of PERSISTENT flows calcify and STAY — the structure the tissue
 * accumulates.
 *
 * Same authoring contract as flowBuilderScript / prod01Script: EVERYTHING is a
 * pure function of (frame) — the whole choreography is generated ONCE at module
 * load from a seeded PRNG (no Date.now / Math.random), so the studio and the
 * Remotion render agree frame-for-frame and the scheduler is unit-testable
 * without rendering. The visual shell (TejidoVivoVideo) only reads these anchors;
 * the plate renderer is storeFlowScene's FlowPlate, reused verbatim.
 */
import { footprint, routeArrows, type Dir, type RouteStep } from '@/lib/pathfinding'
import { CELL } from '@/lib/neumorphism'
import { type ModuleName } from '@/stories/neo/modules/modules'
import { type IconName } from '@/components/icons'

// ── global scene config (30 fps) ───────────────────────────────────────────────

export const FPS = 30
export const COLUMNS = 22
export const ROWS = 13
export { CELL }
export const GRID_W = COLUMNS * CELL // 2816
export const GRID_H = ROWS * CELL // 1664
export const GRID_CENTER: [number, number] = [GRID_W / 2, GRID_H / 2]

export const TOTAL = 1620 // 54 s
export const INTRO_END = 45 // gentle push-out as the first seeds light
export const SETTLE_START = 1440 // stop emitting ephemerals; let the field wind down
export const SETTLE_RAMP = TOTAL - SETTLE_START // 180

const SEED = 0xa1c0fed

// Concurrency band for EPHEMERAL flows (persistents are budgeted separately).
export const CAP_EPH = 9 // never floods past this many live ephemerals
export const FLOOR_EPH = 4 // refill fast below this
export const MAX_PERSIST = 7 // the accreting lattice stays a minority

export const PER_STEP_RUN = 9 // frames the emergence front spends per step index
export const HOLD_MIN = 40 // ephemeral dwell at full before dissipating
export const HOLD_JIT = 50
export const FADE = 22 // dissipation window per step
export const RETRACT = 1.5 // reverse-order stagger: last step recoils first
const CORDON = 1 // Chebyshev gutter kept clear around every flow
const SEED_RETRY = 16 // placement attempts before giving up a spawn

// ── tiny pure utilities ─────────────────────────────────────────────────────────

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Quintic smootherstep — zero 1st & 2nd derivative at both ends (no jerk). */
export function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** A normalized 0→1→0 bell over a window centred on `center`, width `width`. */
export function hump(frame: number, center: number, width: number): number {
  const t = (frame - (center - width / 2)) / width
  if (t <= 0 || t >= 1) return 0
  return smoother(t) * smoother(1 - t) * 4 // peak ≈ 1 at t = 0.5
}

/** Deterministic PRNG (mulberry32) — one stream seeded once, no global RNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Pixel centre of a step's footprint, in grid space (matches storeFlowScene). */
function stepCenterPx(step: RouteStep): [number, number] {
  const fp = footprint(step)
  return [((fp.c0 + fp.c1 - 1) / 2) * CELL, ((fp.r0 + fp.r1 - 1) / 2) * CELL]
}

const cellKey = (c: number, r: number) => `${c},${r}`
const isContent = (s: RouteStep) => Boolean(s.module || s.text || s.icon)

// ── the real processes (authored sequences of tools + actions) ──────────────────
//
// Each process is a meaningful chain: module steps are AiKit tools (icon), action
// steps are concrete verbs (text + icon). `serpentine()` lays the chain out as a
// boustrophedon snake (turns down at row breaks, alternating direction) so the
// path reads as a winding, non-trivial process — never a decorative straight bar.

type Stage = { module: ModuleName } | { action: string; icon: IconName }
const m = (name: ModuleName): Stage => ({ module: name }) // tool step (icon only, 1 cell)
const a = (action: string, icon: IconName): Stage => ({ action, icon }) // verb step (label, 2 cells)

const stageSpan = (s: Stage) => ('module' in s ? 1 : 2)
function stageStep(s: Stage, c0: number, r: number): RouteStep {
  if ('module' in s) return { at: [c0, r], module: s.module }
  return { at: [c0, r], colSpan: 2, text: { main: s.action }, icon: s.icon }
}

/** Lay a chain of stages along a snake: arrow between stages, elbow + flip at row breaks. */
function serpentine(stages: Stage[], perRow: number): RouteStep[] {
  const steps: RouteStep[] = []
  let r = 1
  let dir = 1 // +1 rightward, -1 leftward
  let col = 1 // dir +1 → left edge of next token; dir -1 → right edge of next token
  let cnt = 0
  for (let i = 0; i < stages.length; i += 1) {
    const span = stageSpan(stages[i])
    const c0 = dir === 1 ? col : col - span + 1
    col += dir === 1 ? span : -span
    steps.push(stageStep(stages[i], c0, r))
    cnt += 1
    if (i === stages.length - 1) break
    if (cnt >= perRow) {
      const downCol = dir === 1 ? c0 + span - 1 : c0 // far edge in travel direction
      steps.push({ at: [downCol, r + 1] }) // bare elbow, drops to the next row
      r += 1
      dir = -dir
      col = dir === 1 ? downCol + 1 : downCol - 1
      cnt = 0
    } else {
      steps.push({ at: [col, r] }) // bare in-row connector
      col += dir === 1 ? 1 : -1
    }
  }
  return steps
}

type ProcessDef = { name: string; stages: Stage[]; perRow: number }
const PROCESSES: ProcessDef[] = [
  { name: 'Pedido', perRow: 3, stages: [m('docusense'), a('Validar', 'lock'), m('hotpot'), a('Factura', 'check'), a('Avisar', 'megaphone'), m('smartProcess'), a('Reponer', 'reload')] },
  { name: 'Soporte', perRow: 3, stages: [m('docusense'), a('Asignar', 'user'), m('actionRunner'), a('Resolver', 'check'), a('Cerrar', 'check')] },
  { name: 'Reseña', perRow: 3, stages: [a('Reseña', 'star'), m('glimpse'), a('Responder', 'megaphone'), m('forge'), a('Publicar', 'global')] },
  { name: 'Reserva', perRow: 2, stages: [a('Reservar', 'calendar'), m('junction'), a('Confirmar', 'check'), a('Recordar', 'bell')] },
  { name: 'Venta', perRow: 3, stages: [m('junction'), a('Calificar', 'target'), m('teamwork'), a('Llamar', 'call'), m('hotpot'), a('Cobrar', 'target')] },
  { name: 'Marketing', perRow: 3, stages: [m('glimpse'), a('Segmentar', 'user'), m('forge'), a('Enviar', 'bell'), m('foresight'), a('Medir', 'target')] },
  { name: 'Inventario', perRow: 3, stages: [m('sqlsense'), a('Stock', 'reload'), m('foresight'), a('Prever', 'target'), m('smartProcess'), a('Pedir', 'check')] },
  { name: 'Onboarding', perRow: 3, stages: [m('docusense'), a('Alta', 'user'), m('junction'), a('Verificar', 'lock'), m('teamwork')] },
  { name: 'Logística', perRow: 3, stages: [m('docusense'), a('Albarán', 'check'), m('junction'), a('Rutar', 'arrow'), m('actionRunner'), a('Enviar', 'bell'), a('Entregado', 'check')] },
  { name: 'Nómina', perRow: 3, stages: [m('sqlsense'), a('Horas', 'clock'), m('hotpot'), a('Nómina', 'check'), a('Pagar', 'check')] },
  { name: 'Contenido', perRow: 3, stages: [m('skillHub'), a('Brief', 'star'), m('forge'), a('Generar', 'sparkles'), m('glimpse'), a('Publicar', 'global')] },
  { name: 'Monitor', perRow: 3, stages: [m('heartbeat'), a('Vigilar', 'target'), m('foresight'), a('Alertar', 'flag'), m('teamwork')] },
  { name: 'Factura', perRow: 3, stages: [m('docusense'), a('Factura', 'check'), a('Cobrar', 'target')] },
  { name: 'Difusión', perRow: 3, stages: [m('feedbackLoop'), a('Reseña', 'star'), a('Responder', 'megaphone'), a('Publicar', 'global')] },
]

export type RouteTemplate = {
  id: number
  name: string
  steps: RouteStep[] // normalized to origin [1,1], world content baked in
  arrows: Dir[]
  contentIdx: number[]
  cells: [number, number][]
  cols: number
  rows: number
}

function buildTemplate(def: ProcessDef, id: number): RouteTemplate {
  const laid = serpentine(def.stages, def.perRow)
  // Normalize to origin so every template anchors at [1,1].
  const minC = Math.min(...laid.map((s) => footprint(s).c0))
  const minR = Math.min(...laid.map((s) => footprint(s).r0))
  const steps: RouteStep[] = laid.map((s) => ({ ...s, at: [s.at[0] - (minC - 1), s.at[1] - (minR - 1)] }))

  const last = steps[steps.length - 1]
  const prev = steps[steps.length - 2] ?? { at: [last.at[0] - 1, last.at[1]] }
  const dc = Math.sign(last.at[0] - prev.at[0]) || 1
  const dr = Math.sign(last.at[1] - prev.at[1])
  const lf = footprint(last)
  const arrows = routeArrows(steps, [lf.c1 + dc, lf.r1 + dr])

  const cells: [number, number][] = []
  for (const s of steps) {
    const fp = footprint(s)
    for (let c = fp.c0; c <= fp.c1; c += 1) for (let r = fp.r0; r <= fp.r1; r += 1) cells.push([c, r])
  }
  return {
    id,
    name: def.name,
    steps,
    arrows,
    contentIdx: steps.map((s, i) => (isContent(s) ? i : -1)).filter((i) => i >= 0),
    cells,
    cols: Math.max(...cells.map((c) => c[0])),
    rows: Math.max(...cells.map((c) => c[1])),
  }
}

export const TEMPLATES: RouteTemplate[] = PROCESSES.map(buildTemplate)

// ── the scheduled flow events (generated ONCE, deterministically) ───────────────

export type FlowKind = 'ephemeral' | 'persistent'
export type PlacedStep = { step: RouteStep; dir: Dir; centerPx: [number, number] }

export type FlowEvent = {
  id: number
  tmpl: number
  kind: FlowKind
  off: [number, number] // [dCol, dRow] translation of the template into the field
  start: number
  N: number // step count (reveal sweep length)
  growDur: number
  hold: number // ephemeral only; persistent never dissipates
  occEnd: number // frame the flow frees its cells (Infinity for persistent)
  // baked world geometry (frame-independent), so render is O(active):
  placed: PlacedStep[]
  cells: [number, number][]
}

const quadrantOf = (c: number, r: number) => (c <= COLUMNS / 2 ? 0 : 1) + (r <= ROWS / 2 ? 0 : 2)

/** Lifetime past which an ephemeral has fully retracted and frees its cells. */
function ephemeralOccEnd(start: number, growDur: number, hold: number, N: number): number {
  return start + growDur + hold + FADE + (N - 1) * RETRACT + 2
}

/** Build the full master schedule by simulating the timeline forward.
 *  An optional `seed` yields a DIFFERENT field (different processes / placement)
 *  while keeping the exact same choreography contract — used to stack several
 *  living-tissue layers that each run their own processes. */
export function generateMaster(seed: number = SEED): FlowEvent[] {
  const rng = mulberry32(seed)
  const events: FlowEvent[] = []
  let live: FlowEvent[] = [] // ephemerals currently occupying
  const persist: FlowEvent[] = []
  let id = 0
  let persistCount = 0

  // The soft clock: faster when the field is sparse, slower when it's busy.
  const tickStep = (band: number) => Math.round(lerp(14, 28, clamp01(band / CAP_EPH)))

  let tick = 12 // first activity after frame 0 → calm start seam
  while (tick < SETTLE_START) {
    live = live.filter((e) => e.occEnd > tick)
    const band = live.length

    let nSpawn = 0
    if (band < FLOOR_EPH) nSpawn = band < FLOOR_EPH - 2 ? 2 : 1
    else if (band < CAP_EPH) nSpawn = rng() < 0.7 ? 1 : 0

    for (let s = 0; s < nSpawn; s += 1) {
      if (live.length >= CAP_EPH) break

      // Occupancy at this tick = live ephemerals + all persistents so far.
      const occ = new Set<string>()
      for (const e of live) for (const [c, r] of e.cells) occ.add(cellKey(c, r))
      for (const e of persist) for (const [c, r] of e.cells) occ.add(cellKey(c, r))

      const wantPersist = persistCount < MAX_PERSIST && tick < SETTLE_START - 200 && id % 4 === 0
      const tmplIdx = Math.floor(rng() * TEMPLATES.length)
      const tmpl = TEMPLATES[tmplIdx]

      const off = solvePlacement(tmpl, occ, rng)
      if (!off) continue // field momentarily full here → skip (natural back-pressure)

      const N = tmpl.steps.length
      const growDur = N * PER_STEP_RUN
      const hold = wantPersist ? 0 : HOLD_MIN + Math.floor(rng() * HOLD_JIT)
      const kind: FlowKind = wantPersist ? 'persistent' : 'ephemeral'

      const ev: FlowEvent = {
        id,
        tmpl: tmplIdx,
        kind,
        off,
        start: tick,
        N,
        growDur,
        hold,
        occEnd: wantPersist ? Infinity : ephemeralOccEnd(tick, growDur, hold, N),
        placed: tmpl.steps.map((st, i) => {
          const step: RouteStep = { ...st, at: [st.at[0] + off[0], st.at[1] + off[1]] }
          return { step, dir: tmpl.arrows[i], centerPx: stepCenterPx(step) }
        }),
        cells: tmpl.cells.map(([c, r]) => [c + off[0], r + off[1]] as [number, number]),
      }

      events.push(ev)
      id += 1
      if (wantPersist) {
        persist.push(ev)
        persistCount += 1
      } else {
        live.push(ev)
      }
    }

    tick += tickStep(band)
  }
  return events
}

/** Resolve a non-overlapping translation for `tmpl` against `occ`, or null. */
function solvePlacement(
  tmpl: RouteTemplate,
  occ: Set<string>,
  rng: () => number,
): [number, number] | null {
  // Per-quadrant occupancy → bias seeding toward the emptiest quadrant so the
  // whole field fills rather than clumping in one corner.
  const quad = [0, 0, 0, 0]
  for (const k of occ) {
    const [c, r] = k.split(',').map(Number)
    quad[quadrantOf(c, r)] += 1
  }
  const emptiest = quad.indexOf(Math.min(...quad))

  // Candidate seeds: every translation that keeps the template on the grid.
  // Weight by adjacency to live tissue (cluster attraction → organic spread)
  // and by the emptiest-quadrant bias.
  const cand: { off: [number, number]; w: number }[] = []
  for (let c = 1; c + tmpl.cols - 1 <= COLUMNS; c += 1) {
    for (let r = 1; r + tmpl.rows - 1 <= ROWS; r += 1) {
      const off: [number, number] = [c - 1, r - 1]
      let neigh = 0
      for (const [tc, tr] of tmpl.cells) {
        for (let dc = -2; dc <= 2; dc += 1)
          for (let dr = -2; dr <= 2; dr += 1)
            if (occ.has(cellKey(tc + off[0] + dc, tr + off[1] + dr))) neigh += 1
      }
      const q = quadrantOf(c, r)
      cand.push({ off, w: (1 + neigh) * (q === emptiest ? 3 : 1) })
    }
  }
  if (cand.length === 0) return null

  // Weighted sampling without replacement, up to SEED_RETRY tries.
  const pool = cand.slice()
  for (let attempt = 0; attempt < SEED_RETRY && pool.length; attempt += 1) {
    const total = pool.reduce((s, x) => s + x.w, 0)
    let t = rng() * total
    let idx = 0
    while (idx < pool.length - 1 && (t -= pool[idx].w) > 0) idx += 1
    const { off } = pool[idx]
    pool.splice(idx, 1)
    if (fits(tmpl, off, occ)) return off
  }
  return null
}

/** All footprint cells in-bounds, and the 1-cell cordon clear of `occ`. */
function fits(tmpl: RouteTemplate, off: [number, number], occ: Set<string>): boolean {
  for (const [tc, tr] of tmpl.cells) {
    const c = tc + off[0]
    const r = tr + off[1]
    if (c < 1 || c > COLUMNS || r < 1 || r > ROWS) return false
    for (let dc = -CORDON; dc <= CORDON; dc += 1)
      for (let dr = -CORDON; dr <= CORDON; dr += 1)
        if (occ.has(cellKey(c + dc, r + dr))) return false
  }
  return true
}

export const MASTER: FlowEvent[] = generateMaster()

// ── per-frame derivation (pure functions of frame; comp memoizes by frame) ──────

export const isActive = (ev: FlowEvent, frame: number) => frame >= ev.start && frame < ev.occEnd

export function activeFlowsAt(frame: number): FlowEvent[] {
  return MASTER.filter((ev) => isActive(ev, frame))
}

/** Continuous head-first reveal front (0..N) for a flow at `frame`. */
export function revealAt(ev: FlowEvent, frame: number): number {
  const age = frame - ev.start
  if (age <= 0) return 0
  return ev.N * smoother(clamp01(age / ev.growDur))
}

/** Per-step dissipation 0 (alive) .. 1 (gone). Reverse order: last step first. */
export function stepDecayAt(ev: FlowEvent, frame: number, i: number): number {
  if (ev.kind === 'persistent') return 0
  const dissStart = ev.start + ev.growDur + ev.hold
  const ageD = frame - dissStart
  if (ageD <= 0) return 0
  return clamp01((ageD - (ev.N - 1 - i) * RETRACT) / FADE)
}

/** Shared whole-tissue micro-breath (live plates only). */
export function breathAt(frame: number): number {
  return Math.sin((2 * Math.PI * frame) / 210) // -1..1
}

// ── camera (wide breathing dolly over the whole field — never a single chase) ───

/** Fit zoom so the whole GRID_W×GRID_H field reads inside the frame with air. */
export function fitZoom(W: number, H: number): number {
  return Math.min((W - 160) / GRID_W, (H - 160) / GRID_H)
}

// Two gentle "attention flicks" toward the busiest cluster, baked at gen time.
function hotspotAt(frame: number): [number, number] {
  const flows = activeFlowsAt(frame)
  if (!flows.length) return [...GRID_CENTER] as [number, number]
  let sx = 0
  let sy = 0
  let n = 0
  for (const e of flows)
    for (const p of e.placed) {
      sx += p.centerPx[0]
      sy += p.centerPx[1]
      n += 1
    }
  return n ? [sx / n, sy / n] : ([...GRID_CENTER] as [number, number])
}
const LEANS: { at: number; target: [number, number] }[] = [
  { at: 360, target: hotspotAt(360) },
  { at: 1080, target: hotspotAt(1080) },
]
const LEAN_W = 110

/** Camera centre P (grid px) and zoom Z for `frame`. */
export function cameraPZ(frame: number, W: number, H: number): { P: [number, number]; Z: number } {
  const fit = fitZoom(W, H)

  // Lazy Lissajous drift around centre — amplitude small so the field never exits.
  let px = GRID_CENTER[0] + 150 * Math.sin((2 * Math.PI * frame) / 660)
  let py = GRID_CENTER[1] + 90 * Math.sin((2 * Math.PI * frame) / 900 + 1.1)

  // Zoom: intro push-out → breathing fit → settle to exact fit (breath off).
  let Z: number
  if (frame < INTRO_END) {
    Z = lerp(fit * 1.13, fit, smoother(frame / INTRO_END))
  } else if (frame >= SETTLE_START) {
    const s = smoother((frame - SETTLE_START) / SETTLE_RAMP)
    const breathing = fit + fit * 0.02 * Math.sin((2 * Math.PI * SETTLE_START) / 540)
    Z = lerp(breathing, fit, s)
    px = lerp(px, GRID_CENTER[0], s)
    py = lerp(py, GRID_CENTER[1], s)
  } else {
    Z = fit + fit * 0.02 * Math.sin((2 * Math.PI * frame) / 540)
  }

  // Lean-ins: a small eased nudge in toward the busiest cluster, then release.
  for (const ln of LEANS) {
    const h = hump(frame, ln.at, LEAN_W)
    if (h > 0) {
      Z += fit * 0.06 * h
      px = lerp(px, ln.target[0], 0.5 * h)
      py = lerp(py, ln.target[1], 0.5 * h)
    }
  }

  return { P: [px, py], Z }
}

export const TEJIDO_VIVO_DURATION = TOTAL

// ── helpers exposed for the test suite ──────────────────────────────────────────

/** Live footprint cells at `frame` (union over active flows). */
export function occupancyAt(frame: number): Set<string> {
  const occ = new Set<string>()
  for (const ev of activeFlowsAt(frame)) for (const [c, r] of ev.cells) occ.add(cellKey(c, r))
  return occ
}

export const liveEphemeralCountAt = (frame: number) =>
  activeFlowsAt(frame).filter((e) => e.kind === 'ephemeral').length

export const liveCountAt = (frame: number) => activeFlowsAt(frame).length
