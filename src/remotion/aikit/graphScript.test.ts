import { describe, expect, it } from 'vitest'
import {
  type BaNodeSpec,
  BA_NODE_SIZE,
  EDGE_TIP_SETTLE,
  IGNITE_SETTLED,
  baGraphLayout,
  baGraphTiming,
  breathPose,
  edgeGeometry,
  hashPair,
  ignitePose,
  nodeDiameter,
  organicEdges,
  quadPoint,
  radialGrowth,
  validateBaGraph,
} from './graphScript'

const colmena = (count: number): BaNodeSpec[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `n${i}`,
    kind: (['proceso', 'app', 'bbdd', 'persona'] as const)[i % 4],
  }))

describe('baGraphLayout', () => {
  it('is deterministic: same nodes + seed → identical positions', () => {
    const a = baGraphLayout(colmena(40), { seed: 9 })
    const b = baGraphLayout(colmena(40), { seed: 9 })
    expect(a.pos).toEqual(b.pos)
  })

  it('different seeds produce different layouts', () => {
    const a = baGraphLayout(colmena(12), { seed: 1 })
    const b = baGraphLayout(colmena(12), { seed: 2 })
    const moved = Object.keys(a.pos).filter(
      (id) => Math.hypot(a.pos[id].x - b.pos[id].x, a.pos[id].y - b.pos[id].y) > 1,
    )
    expect(moved.length).toBeGreaterThan(0)
  })

  it('keeps every node inside the stage margins', () => {
    const layout = baGraphLayout(colmena(44), { width: 1920, height: 1080, margin: 90 })
    for (const n of layout.nodes) {
      const p = layout.pos[n.id]
      const r = nodeDiameter(n) / 2
      expect(p.x - r).toBeGreaterThanOrEqual(90 - 1e-6)
      expect(p.x + r).toBeLessThanOrEqual(1920 - 90 + 1e-6)
      expect(p.y - r).toBeGreaterThanOrEqual(90 - 1e-6)
      expect(p.y + r).toBeLessThanOrEqual(1080 - 90 + 1e-6)
    }
  })

  it('spreads a 40+ node colmena without overlapping plates', () => {
    const nodes = colmena(44)
    const layout = baGraphLayout(nodes, { seed: 3 })
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = layout.pos[nodes[i].id]
        const b = layout.pos[nodes[j].id]
        const minGap = (nodeDiameter(nodes[i]) + nodeDiameter(nodes[j])) / 2
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(minGap)
      }
    }
  })

  it('respects anchors exactly and lays out the rest', () => {
    const nodes: BaNodeSpec[] = [
      { id: 'hero', kind: 'proceso', anchor: { x: 960, y: 540 } },
      { id: 'a', kind: 'app' },
      { id: 'b', kind: 'bbdd' },
    ]
    const layout = baGraphLayout(nodes, { seed: 5 })
    expect(layout.pos.hero).toEqual({ x: 960, y: 540 })
    expect(layout.pos.a).toBeDefined()
    expect(layout.pos.b).toBeDefined()
  })

  it('works at the 3-node scale (Prod03) without degenerate stacking', () => {
    const layout = baGraphLayout(colmena(3), { seed: 4 })
    const [a, b, c] = layout.nodes.map((n) => layout.pos[n.id])
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(100)
    expect(Math.hypot(a.x - c.x, a.y - c.y)).toBeGreaterThan(100)
  })
})

describe('radialGrowth', () => {
  it('grows centre-out: with no jitter, farther nodes never ignite earlier', () => {
    const layout = baGraphLayout(colmena(20), { seed: 6 })
    const at = radialGrowth(layout, { startAt: 10, span: 60, jitter: 0 })
    const byDist = [...layout.nodes].sort(
      (a, b) =>
        Math.hypot(layout.pos[a.id].x - layout.centroid.x, layout.pos[a.id].y - layout.centroid.y) -
        Math.hypot(layout.pos[b.id].x - layout.centroid.x, layout.pos[b.id].y - layout.centroid.y),
    )
    for (let i = 1; i < byDist.length; i++) {
      expect(at[byDist[i].id]).toBeGreaterThanOrEqual(at[byDist[i - 1].id])
    }
  })

  it('keeps every ignite inside [startAt, startAt + span + jitter]', () => {
    const layout = baGraphLayout(colmena(25), { seed: 7 })
    const at = radialGrowth(layout, { startAt: 30, span: 50, jitter: 8 })
    for (const n of layout.nodes) {
      expect(at[n.id]).toBeGreaterThanOrEqual(30)
      expect(at[n.id]).toBeLessThanOrEqual(30 + 50 + 8)
    }
  })

  it('a single node ignites at startAt', () => {
    const layout = baGraphLayout(colmena(1), { seed: 8 })
    const at = radialGrowth(layout, { startAt: 12, jitter: 0 })
    expect(at[layout.nodes[0].id]).toBe(12)
  })
})

describe('ignitePose', () => {
  it('is absent before its frame', () => {
    const pose = ignitePose(20, 40)
    expect(pose.opacity).toBe(0)
    expect(pose.content).toBe(0)
  })

  it('emerges before the content ignites (plate first, then the light)', () => {
    const early = ignitePose(44, 40)
    expect(early.emerge).toBeGreaterThan(0)
    expect(early.emerge).toBeGreaterThan(early.content)
  })

  it('settles to rest: full presence, relaxed glow, stable elevation', () => {
    const rest = ignitePose(40 + IGNITE_SETTLED, 40)
    expect(rest.opacity).toBe(1)
    expect(rest.scale).toBe(1)
    expect(rest.content).toBe(1)
    expect(rest.distance).toBeCloseTo(11, 5)
    expect(rest.glowAlpha).toBeCloseTo(0.34, 5)
    // …and stays there (no drift after settle)
    const later = ignitePose(40 + IGNITE_SETTLED + 100, 40)
    expect(later).toEqual(rest)
  })

  it('over-swells the glow before relaxing (follow-through)', () => {
    const peak = ignitePose(40 + 22, 40)
    const rest = ignitePose(40 + IGNITE_SETTLED, 40)
    expect(peak.glowBlur).toBeGreaterThan(rest.glowBlur)
  })
})

describe('breathPose', () => {
  it('is deterministic per (frame, index) and varies across the crowd', () => {
    expect(breathPose(100, 3)).toEqual(breathPose(100, 3))
    expect(breathPose(100, 3).dy).not.toBe(breathPose(100, 4).dy)
  })

  it('amp 0 = perfectly still', () => {
    const still = breathPose(123, 5, 0)
    expect(still.dy).toBe(0)
    expect(still.scale).toBe(1)
  })

  it('stays subtle (≤ a few px of bob)', () => {
    for (let f = 0; f < 200; f += 7) {
      expect(Math.abs(breathPose(f, 2).dy)).toBeLessThan(4)
    }
  })
})

describe('edgeGeometry', () => {
  const layout = baGraphLayout(
    [
      { id: 'a', kind: 'app', anchor: { x: 400, y: 500 } },
      { id: 'b', kind: 'bbdd', anchor: { x: 1200, y: 500 } },
    ],
    {},
  )

  it('trims the path to the node rims plus an air gap', () => {
    const g = edgeGeometry(layout, 'a', 'b', { gap: 6 })
    expect(g.a.x).toBeCloseTo(400 + BA_NODE_SIZE.app / 2 + 6, 5)
    expect(g.b.x).toBeCloseTo(1200 - BA_NODE_SIZE.bbdd / 2 - 6, 5)
  })

  it('quadPoint hits both endpoints', () => {
    const g = edgeGeometry(layout, 'a', 'b')
    expect(quadPoint(g, 0)).toEqual(g.a)
    expect(quadPoint(g, 1)).toEqual(g.b)
  })

  it('a straight edge (bow 0) measures its endpoint distance', () => {
    const g = edgeGeometry(layout, 'a', 'b', { bow: 0 })
    expect(g.length).toBeCloseTo(Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y), 1)
  })

  it('a bowed edge is longer than the chord', () => {
    const g = edgeGeometry(layout, 'a', 'b', { bow: 50 })
    expect(g.length).toBeGreaterThan(Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y))
  })

  it('throws on unknown endpoints', () => {
    expect(() => edgeGeometry(layout, 'a', 'nope')).toThrow(/unknown node/)
  })

  it('hashPair is stable and direction-sensitive inputs stay in [0,1)', () => {
    expect(hashPair('x', 'y')).toBe(hashPair('x', 'y'))
    expect(hashPair('x', 'y')).toBeGreaterThanOrEqual(0)
    expect(hashPair('x', 'y')).toBeLessThan(1)
  })
})

describe('baGraphTiming', () => {
  const nodes: BaNodeSpec[] = [
    { id: 'p', kind: 'proceso', anchor: { x: 900, y: 500 }, at: 100 },
    { id: 'db', kind: 'bbdd', anchor: { x: 500, y: 300 } },
    { id: 'tpv', kind: 'app', anchor: { x: 1300, y: 700 } },
  ]
  const layout = baGraphLayout(nodes, {})
  const edges = [
    { from: 'p', to: 'db' },
    { from: 'p', to: 'tpv', at: 200 },
  ]
  const t = baGraphTiming(layout, edges, { startAt: 0, span: 30, jitter: 0, edgeLead: 6, edgeDur: 18 })

  it('authored node.at wins over the growth schedule', () => {
    expect(t.nodeAt.p).toBe(100)
  })

  it('an edge draws only after both endpoints have ignited', () => {
    expect(t.edgeAt[0].start).toBe(Math.max(t.nodeAt.p, t.nodeAt.db) + 6)
    expect(t.edgeAt[0].end).toBe(t.edgeAt[0].start + 18)
  })

  it('authored edge.at wins', () => {
    expect(t.edgeAt[1]).toEqual({ start: 200, end: 218 })
  })

  it('settledAt covers every node ignite and edge tip', () => {
    for (const n of nodes) {
      expect(t.settledAt).toBeGreaterThanOrEqual(t.nodeAt[n.id] + IGNITE_SETTLED)
    }
    for (const e of t.edgeAt) {
      expect(t.settledAt).toBeGreaterThanOrEqual(e.end + EDGE_TIP_SETTLE)
    }
  })

  it('an edgeless single-node graph still settles', () => {
    const solo = baGraphLayout([{ id: 's', kind: 'proceso' }], {})
    const st = baGraphTiming(solo, [], { startAt: 5, jitter: 0 })
    expect(st.settledAt).toBe(5 + IGNITE_SETTLED)
  })
})

describe('organicEdges', () => {
  const layout = baGraphLayout(colmena(30), { seed: 12 })
  const edges = organicEdges(layout, { extraEvery: 5 })

  it('connects the whole organism (every node reachable from the heart)', () => {
    const adj = new Map<string, string[]>()
    for (const e of edges) {
      adj.set(e.from, [...(adj.get(e.from) ?? []), e.to])
      adj.set(e.to, [...(adj.get(e.to) ?? []), e.from])
    }
    const seen = new Set<string>([layout.nodes[0].id])
    const queue = [layout.nodes[0].id]
    while (queue.length) {
      for (const next of adj.get(queue.shift()!) ?? []) {
        if (!seen.has(next)) {
          seen.add(next)
          queue.push(next)
        }
      }
    }
    expect(seen.size).toBe(layout.nodes.length)
  })

  it('adds cross-links beyond the spanning tree', () => {
    expect(edges.length).toBeGreaterThan(layout.nodes.length - 1)
  })

  it('never duplicates a pair or links a node to itself', () => {
    const keys = edges.map((e) => (e.from < e.to ? `${e.from}|${e.to}` : `${e.to}|${e.from}`))
    expect(new Set(keys).size).toBe(keys.length)
    expect(edges.every((e) => e.from !== e.to)).toBe(true)
  })

  it('is deterministic', () => {
    expect(organicEdges(layout, { extraEvery: 5 })).toEqual(edges)
  })
})

describe('validateBaGraph', () => {
  it('accepts a sound graph', () => {
    expect(
      validateBaGraph(
        [
          { id: 'a', kind: 'app' },
          { id: 'b', kind: 'bbdd' },
        ],
        [{ from: 'a', to: 'b' }],
      ),
    ).toEqual([])
  })

  it('flags duplicates, unknown refs, self-edges and bad numbers', () => {
    const errors = validateBaGraph(
      [
        { id: 'a', kind: 'app' },
        { id: 'a', kind: 'bbdd' },
        { id: 'b', kind: 'persona', at: -3, size: 0 },
      ],
      [
        { from: 'a', to: 'ghost' },
        { from: 'b', to: 'b', pulseEvery: 0 },
      ],
    )
    expect(errors.some((e) => e.includes('duplicate'))).toBe(true)
    expect(errors.some((e) => e.includes('ghost'))).toBe(true)
    expect(errors.some((e) => e.includes('self-edges'))).toBe(true)
    expect(errors.some((e) => e.includes('at -3'))).toBe(true)
    expect(errors.some((e) => e.includes('size 0'))).toBe(true)
    expect(errors.some((e) => e.includes('pulseEvery 0'))).toBe(true)
  })
})
