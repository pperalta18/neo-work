/**
 * graphScript.ts — pure frame-driven logic for the /ba/ graph (BaGraph).
 * ──────────────────────────────────────────────────────────────────────
 * The organism engine of the deck: typed nodes (procesos, apps, BBDD,
 * personas) on a seeded organic layout, joined by curved comet edges. It
 * absorbs three proven mechanics as pure maths —
 *
 *   - buildField's mulberry32 scatter (SourcesActionsVideo) → best-candidate
 *     sampling that spreads any node count organically, 3 to 40+;
 *   - GoalDisc's power-on (ObjectiveVideo) → `ignitePose`, the per-node
 *     emerge → ignite → glow-swell → settle beat;
 *   - GridDrawIn's comet (via trace.ts) → `edgeGeometry` provides the curved
 *     path + real length the tip dashes need.
 *
 * Everything is pure data/maths — no React, no remotion — so scenes (Prod03's
 * landing node, Prod04's colmena, Yusta04/06 constellations) choreograph
 * against the same layout/timing the visual renders, and it all unit-tests.
 *
 * Sequencing contract (the kit convention): `baGraphTiming(...).settledAt` is
 * the first frame the whole graph is at rest — point cameras/cursors there.
 */

import { mulberry32, seeded } from './rand'

export type Vec = { x: number; y: number }

/** The /ba/ taxonomy the guión counts ("7 apps · 12 procesos · 3 BBDD · 24 personas"). */
export type BaNodeKind = 'proceso' | 'app' | 'bbdd' | 'persona'

/** Node diameter (px) per kind — apps read largest, personas are dots. */
export const BA_NODE_SIZE: Record<BaNodeKind, number> = {
  proceso: 68,
  app: 84,
  bbdd: 76,
  persona: 36,
}

export type BaNodeSpec = {
  id: string
  kind: BaNodeKind
  /** Quiet caption under the node (and the initials source for personas). */
  label?: string
  /** AiKit module id (modules.ts) whose icon fills the node, e.g. 'hotpot'. */
  module?: string
  /** Pin the node here (px, stage space). Unanchored nodes are laid out by seed. */
  anchor?: Vec
  /** Authored ignite frame — wins over the computed growth schedule. */
  at?: number
  /** Diameter override (px). Defaults to BA_NODE_SIZE[kind]. */
  size?: number
}

export type BaEdgeSpec = {
  from: string
  to: string
  /** Authored draw-start frame — wins over the computed schedule. */
  at?: number
  /** Curve bow (px, signed). Defaults seeded by the pair; 0 = straight. */
  bow?: number
  /** Re-run a faint comet along the settled edge every N frames (organism alive). */
  pulseEvery?: number
}

export const nodeDiameter = (n: BaNodeSpec): number => n.size ?? BA_NODE_SIZE[n.kind]

// ── layout ───────────────────────────────────────────────────────────────────

export type BaLayoutOpts = {
  width?: number
  height?: number
  seed?: number
  /** Clearance from the stage bounds. */
  margin?: number
  /** Best-candidate samples per node — higher spreads more evenly. */
  quality?: number
}

export type BaLayout = {
  width: number
  height: number
  /** Node centre per id, px. */
  pos: Record<string, Vec>
  /** Mean of all node centres — the organism's heart. */
  centroid: Vec
  nodes: readonly BaNodeSpec[]
}

/**
 * Seeded organic layout. Anchored nodes keep their exact position; the rest
 * land by Mitchell best-candidate inside an inset ellipse — each node tries
 * `quality` seeded candidates and keeps the one farthest from everything
 * already placed (radius-aware), so 3 nodes spread wide and 40 pack evenly
 * without overlapping. Deterministic: same nodes + seed → same layout.
 */
export function baGraphLayout(nodes: readonly BaNodeSpec[], opts: BaLayoutOpts = {}): BaLayout {
  const width = opts.width ?? 1920
  const height = opts.height ?? 1080
  const margin = opts.margin ?? 90
  const quality = opts.quality ?? 28
  const rnd = mulberry32(opts.seed ?? 1)
  const cx = width / 2
  const cy = height / 2

  const pos: Record<string, Vec> = {}
  const placed: { p: Vec; r: number }[] = []
  const put = (n: BaNodeSpec, p: Vec) => {
    pos[n.id] = p
    placed.push({ p, r: nodeDiameter(n) / 2 })
  }

  for (const n of nodes) if (n.anchor) put(n, { x: n.anchor.x, y: n.anchor.y })

  for (const n of nodes) {
    if (n.anchor) continue
    const r = nodeDiameter(n) / 2
    const rx = Math.max(1, width / 2 - margin - r)
    const ry = Math.max(1, height / 2 - margin - r)
    let best: Vec | null = null
    let bestScore = -Infinity
    for (let k = 0; k < quality; k++) {
      const ang = rnd() * Math.PI * 2
      const u = Math.sqrt(rnd()) // uniform density over the ellipse
      const c = { x: cx + Math.cos(ang) * u * rx, y: cy + Math.sin(ang) * u * ry }
      // First node prefers the heart; later nodes maximise breathing room.
      const score =
        placed.length === 0
          ? -Math.hypot(c.x - cx, c.y - cy)
          : placed.reduce(
              (min, q) => Math.min(min, Math.hypot(c.x - q.p.x, c.y - q.p.y) - (r + q.r)),
              Infinity,
            )
      if (score > bestScore) {
        bestScore = score
        best = c
      }
    }
    put(n, best!)
  }

  const all = nodes.map((n) => pos[n.id])
  const centroid =
    all.length === 0
      ? { x: cx, y: cy }
      : {
          x: all.reduce((s, p) => s + p.x, 0) / all.length,
          y: all.reduce((s, p) => s + p.y, 0) / all.length,
        }

  return { width, height, pos, centroid, nodes }
}

// ── growth schedule ──────────────────────────────────────────────────────────

export type GrowthOpts = {
  startAt?: number
  /** Frames from the first ignite to the last (before jitter). */
  span?: number
  /** Seeded extra delay per node, frames. */
  jitter?: number
  seed?: number
}

/**
 * Centre-out growth: each node's ignite frame grows with its distance from
 * the centroid (the buildField bloom, on a graph) plus seeded jitter — the
 * organism spreads from the heart outward. Single node → startAt.
 */
export function radialGrowth(layout: BaLayout, opts: GrowthOpts = {}): Record<string, number> {
  const startAt = opts.startAt ?? 0
  const span = opts.span ?? 45
  const jitter = opts.jitter ?? 6
  const rnd = mulberry32(opts.seed ?? 7)
  const dist = (id: string) =>
    Math.hypot(layout.pos[id].x - layout.centroid.x, layout.pos[id].y - layout.centroid.y)
  const max = layout.nodes.reduce((m, n) => Math.max(m, dist(n.id)), 0)
  const at: Record<string, number> = {}
  for (const n of layout.nodes) {
    const norm = max <= 0 ? 0 : dist(n.id) / max
    at[n.id] = Math.round(startAt + norm * span + rnd() * jitter)
  }
  return at
}

// ── ignite pose (the GoalDisc power-on, per node) ────────────────────────────

/** Frames from a node's `at` until it is fully settled (glow at rest). */
export const IGNITE_SETTLED = 32

/** Cubic ease-out — the pure stand-in for CURVE.enter in script space. */
const easeOut = (t: number) => 1 - (1 - t) ** 3
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Linear 0→1 across [start, end]; collapsed windows degrade to a step. */
export const phase01 = (frame: number, start: number, end: number): number => {
  if (end <= start) return frame >= end ? 1 : 0
  return clamp01((frame - start) / (end - start))
}

export type IgnitePose = {
  /** The plate's emergence 0→1 (drives scale/opacity). */
  emerge: number
  opacity: number
  scale: number
  /** elevation() params at the 96px reference — scale by diameter/96. */
  distance: number
  blur: number
  /** The inner content (icon/dot) scale-in 0→1. */
  content: number
  /** Accent halo: blur px at the 96px reference + alpha 0..1. */
  glowBlur: number
  glowAlpha: number
}

/**
 * The per-node power-on beat, ported from ObjectiveVideo's GoalDisc and
 * compressed for a crowd: emerge (plate presses up) → content ignites →
 * glow over-swells a beat behind (follow-through) → everything settles.
 */
export function ignitePose(frame: number, at: number): IgnitePose {
  const emerge = easeOut(phase01(frame, at, at + 10))
  const deepen = easeOut(phase01(frame, at + 6, at + 16))
  const content = easeOut(phase01(frame, at + 6, at + 18))
  const swell = easeOut(phase01(frame, at + 8, at + 22))
  const settle = easeOut(phase01(frame, at + 22, at + IGNITE_SETTLED))

  let distance = lerp(4, 9, emerge)
  distance = lerp(distance, 13, deepen)
  distance = lerp(distance, 11, settle)
  let blur = lerp(11, 22, emerge)
  blur = lerp(blur, 30, deepen)
  blur = lerp(blur, 27, settle)

  return {
    emerge,
    opacity: clamp01(emerge * 1.4),
    scale: lerp(0.92, 1, emerge),
    distance,
    blur,
    content,
    glowBlur: lerp(lerp(0, 48, swell), 26, settle),
    glowAlpha: lerp(lerp(0, 0.45, swell), 0.34, settle),
  }
}

// ── breathing (the organism is alive) ────────────────────────────────────────

export type BreathPose = { dy: number; scale: number }

/**
 * Subtle seeded idle motion for a settled node — phase/rate vary per index so
 * the crowd never moves in lockstep. Deterministic per frame.
 */
export function breathPose(frame: number, index: number, amp = 1): BreathPose {
  const ph = seeded(index, 11) * Math.PI * 2
  const rate = 0.7 + seeded(index, 13) * 0.6
  return {
    dy: Math.sin(frame * 0.045 * rate + ph) * 1.7 * amp,
    scale: 1 + Math.sin(frame * 0.028 * rate + ph * 1.7) * 0.007 * amp,
  }
}

// ── edge geometry (the comet's road) ─────────────────────────────────────────

/** Stable hash of an id pair → [0,1), for seeded per-edge variation. */
export function hashPair(a: string, b: string): number {
  let h = 2166136261
  for (const ch of `${a} ${b}`) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

export type EdgeGeometry = {
  /** SVG path: a quadratic curve rim to rim. */
  d: string
  /** Real polyline length (px) — what tipDashes needs. */
  length: number
  a: Vec
  b: Vec
  ctrl: Vec
}

/**
 * The curved road between two nodes: trimmed to each node's rim (plus a small
 * air gap) and bowed perpendicular by a seeded magnitude, so a dense graph
 * reads organic instead of spoke-like. `bow` overrides the seeded curve
 * (0 = straight); sign flips by seed for variety.
 */
export function edgeGeometry(
  layout: BaLayout,
  from: string,
  to: string,
  opts: { bow?: number; gap?: number } = {},
): EdgeGeometry {
  const na = layout.nodes.find((n) => n.id === from)
  const nb = layout.nodes.find((n) => n.id === to)
  if (!na || !nb) throw new Error(`edgeGeometry: unknown node in ${from} → ${to}`)
  const pa = layout.pos[from]
  const pb = layout.pos[to]
  const gap = opts.gap ?? 6
  const dx = pb.x - pa.x
  const dy = pb.y - pa.y
  const span = Math.hypot(dx, dy) || 1
  const ux = dx / span
  const uy = dy / span

  const a = { x: pa.x + ux * (nodeDiameter(na) / 2 + gap), y: pa.y + uy * (nodeDiameter(na) / 2 + gap) }
  const b = { x: pb.x - ux * (nodeDiameter(nb) / 2 + gap), y: pb.y - uy * (nodeDiameter(nb) / 2 + gap) }

  const r = hashPair(from, to)
  const bow =
    opts.bow ?? (Math.min(56, Math.max(10, span * 0.14)) * (0.6 + r * 0.8) * (r < 0.5 ? -1 : 1))
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const ctrl = { x: mid.x + -uy * bow, y: mid.y + ux * bow }

  // numeric length of the quadratic (32 segments is plenty at stage scale)
  let length = 0
  let prev = a
  for (let i = 1; i <= 32; i++) {
    const p = quadAt(a, ctrl, b, i / 32)
    length += Math.hypot(p.x - prev.x, p.y - prev.y)
    prev = p
  }

  return { d: `M ${a.x} ${a.y} Q ${ctrl.x} ${ctrl.y} ${b.x} ${b.y}`, length, a, b, ctrl }
}

const quadAt = (a: Vec, c: Vec, b: Vec, t: number): Vec => {
  const s = 1 - t
  return {
    x: s * s * a.x + 2 * s * t * c.x + t * t * b.x,
    y: s * s * a.y + 2 * s * t * c.y + t * t * b.y,
  }
}

/** Point on the edge at t ∈ [0,1] — for tokens travelling a settled edge. */
export function quadPoint(g: EdgeGeometry, t: number): Vec {
  return quadAt(g.a, g.ctrl, g.b, clamp01(t))
}

// ── timing (the sequencing contract) ─────────────────────────────────────────

/** Frames the comet tip lingers after an edge finishes drawing. */
export const EDGE_TIP_SETTLE = 8

export type BaTimingOpts = GrowthOpts & {
  /** Frames after both endpoints ignite before their edge draws. Default 6. */
  edgeLead?: number
  /** Frames an edge takes to draw. Default 18. */
  edgeDur?: number
}

export type BaGraphTiming = {
  /** Ignite frame per node id. */
  nodeAt: Record<string, number>
  /** Draw window per edge, indexed like the `edges` array. */
  edgeAt: readonly { start: number; end: number }[]
  /** First frame the whole graph is at rest — sequence the next beat here. */
  settledAt: number
}

/**
 * Bundle the run: centre-out node ignites (authored `at` wins), each edge
 * drawing once both endpoints are alight. The single source of truth shared
 * by the BaGraph visual and the scene choreographing around it.
 */
export function baGraphTiming(
  layout: BaLayout,
  edges: readonly BaEdgeSpec[],
  opts: BaTimingOpts = {},
): BaGraphTiming {
  const edgeLead = opts.edgeLead ?? 6
  const edgeDur = opts.edgeDur ?? 18
  const grown = radialGrowth(layout, opts)
  const nodeAt: Record<string, number> = {}
  for (const n of layout.nodes) nodeAt[n.id] = n.at ?? grown[n.id]

  const edgeAt = edges.map((e) => {
    const start = e.at ?? Math.max(nodeAt[e.from] ?? 0, nodeAt[e.to] ?? 0) + edgeLead
    return { start, end: start + edgeDur }
  })

  const settledAt = Math.max(
    opts.startAt ?? 0,
    ...layout.nodes.map((n) => nodeAt[n.id] + IGNITE_SETTLED),
    ...edgeAt.map((e) => e.end + EDGE_TIP_SETTLE),
  )

  return { nodeAt, edgeAt, settledAt }
}

// ── organic edges (grow a web, not a wheel) ──────────────────────────────────

/**
 * Auto-edges for a grown organism: in centre-out order, every node links to
 * its nearest already-grown node (a tree that follows the growth), and every
 * `extraEvery`-th node adds a second link to its next-nearest — cross-links
 * that make it a web. Deterministic; scenes still author hero edges by hand.
 */
export function organicEdges(
  layout: BaLayout,
  opts: { extraEvery?: number; pulseEvery?: number } = {},
): BaEdgeSpec[] {
  const extraEvery = opts.extraEvery ?? 5
  const order = [...layout.nodes].sort(
    (a, b) =>
      Math.hypot(layout.pos[a.id].x - layout.centroid.x, layout.pos[a.id].y - layout.centroid.y) -
      Math.hypot(layout.pos[b.id].x - layout.centroid.x, layout.pos[b.id].y - layout.centroid.y),
  )
  const edges: BaEdgeSpec[] = []
  const seen = new Set<string>()
  const link = (from: string, to: string) => {
    const key = from < to ? `${from}|${to}` : `${to}|${from}`
    if (seen.has(key)) return
    seen.add(key)
    edges.push({ from, to, pulseEvery: opts.pulseEvery })
  }
  for (let i = 1; i < order.length; i++) {
    const me = order[i]
    const earlier = order.slice(0, i).sort(
      (a, b) =>
        Math.hypot(layout.pos[a.id].x - layout.pos[me.id].x, layout.pos[a.id].y - layout.pos[me.id].y) -
        Math.hypot(layout.pos[b.id].x - layout.pos[me.id].x, layout.pos[b.id].y - layout.pos[me.id].y),
    )
    link(me.id, earlier[0].id)
    if (i % extraEvery === 0 && earlier.length > 1) link(me.id, earlier[1].id)
  }
  return edges
}

// ── validation ───────────────────────────────────────────────────────────────

/** Sanity-check an authored graph. Returns human-readable problems (empty = valid). */
export function validateBaGraph(
  nodes: readonly BaNodeSpec[],
  edges: readonly BaEdgeSpec[] = [],
): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const n of nodes) {
    if (ids.has(n.id)) errors.push(`duplicate node id "${n.id}"`)
    ids.add(n.id)
    if (n.at != null && n.at < 0) errors.push(`node "${n.id}": at ${n.at} must be ≥ 0`)
    if (n.size != null && n.size <= 0) errors.push(`node "${n.id}": size ${n.size} must be > 0`)
  }
  for (const e of edges) {
    if (!ids.has(e.from)) errors.push(`edge ${e.from} → ${e.to}: unknown node "${e.from}"`)
    if (!ids.has(e.to)) errors.push(`edge ${e.from} → ${e.to}: unknown node "${e.to}"`)
    if (e.from === e.to) errors.push(`edge ${e.from} → ${e.to}: self-edges not allowed`)
    if (e.pulseEvery != null && e.pulseEvery < 1)
      errors.push(`edge ${e.from} → ${e.to}: pulseEvery ${e.pulseEvery} must be ≥ 1`)
  }
  return errors
}
