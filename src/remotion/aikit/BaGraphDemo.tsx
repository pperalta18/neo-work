import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { lightTheme } from '@/lib/neumorphism'
import { CURVE } from '../motion'
import { Fonts, BODY_FONT } from '../fonts'
import { BaGraph } from './BaGraph'
import {
  type BaEdgeSpec,
  type BaNodeSpec,
  baGraphLayout,
  baGraphTiming,
  organicEdges,
  validateBaGraph,
} from './graphScript'
import { CAST } from './cast'

/** TEMP — visual smoke check for BaGraph; not part of the event deck.
 * One continuous beat: the Prod03 landing (an anchored proceso igniting and
 * comet-linking to the BBDD and the TPV) grows into the Prod04 colmena —
 * 40+ seeded nodes blooming centre-out on organic edges with live pulses —
 * while the stage pulls back. Exercises anchors, ignite, comet draw, growth,
 * breathing, pulses and the 3 → 40+ scale claim. */

const theme = lightTheme

// ── the Prod03 trio, pinned where the scene wants them ──────────────────────
const HERO: BaNodeSpec[] = [
  { id: 'proceso', kind: 'proceso', label: 'Chequeo de inventario', anchor: { x: 960, y: 540 }, at: 8 },
  { id: 'bbdd', kind: 'bbdd', module: 'hotpot', label: 'BBDD Inventario', anchor: { x: 580, y: 380 }, at: 22 },
  { id: 'tpv', kind: 'app', module: 'actionRunner', label: 'TPV', anchor: { x: 1340, y: 660 }, at: 22 },
]

// ── the colmena that grows around it from frame 80 ──────────────────────────
const PEOPLE = [CAST.manolo, CAST.laura, CAST.pedro, CAST.ana, CAST.carlos]
const CROWD: BaNodeSpec[] = Array.from({ length: 40 }, (_, i) => {
  const kind = (['persona', 'proceso', 'persona', 'app', 'persona', 'bbdd'] as const)[i % 6]
  return {
    id: `c${i}`,
    kind,
    label: kind === 'persona' ? PEOPLE[i % PEOPLE.length] : undefined,
  }
})

const NODES = [...HERO, ...CROWD]
const LAYOUT = baGraphLayout(NODES, { seed: 21, margin: 120 })

const HERO_EDGES: BaEdgeSpec[] = [
  { from: 'proceso', to: 'bbdd', pulseEvery: 90 },
  { from: 'proceso', to: 'tpv', pulseEvery: 90 },
]
const EDGES: BaEdgeSpec[] = [...HERO_EDGES, ...organicEdges(LAYOUT, { extraEvery: 5, pulseEvery: 120 })]

const TIMING = baGraphTiming(LAYOUT, EDGES, {
  startAt: 80, // the crowd blooms after the trio's beat has landed
  span: 70,
  jitter: 8,
  seed: 21,
})

for (const err of validateBaGraph(NODES, EDGES)) {
  throw new Error(`BaGraphDemo: ${err}`)
}

export const BA_GRAPH_DEMO_DURATION = TIMING.settledAt + 90

export function BaGraphDemo() {
  const frame = useCurrentFrame()
  // The pull-back: close on the trio, easing wide as the organism takes over.
  const zoom = interpolate(frame, [70, 170], [1.45, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: CURVE.standard,
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.surface,
        fontFamily: BODY_FONT,
        color: theme.textStrong,
        overflow: 'hidden',
      }}
    >
      <Fonts />
      <div style={{ transform: `scale(${zoom})`, transformOrigin: '50% 50%' }}>
        <BaGraph layout={LAYOUT} edges={EDGES} timing={TIMING} theme={theme} />
      </div>
    </AbsoluteFill>
  )
}
