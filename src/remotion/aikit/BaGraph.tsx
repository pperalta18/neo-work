import type { CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { elevation, KIT_BLUE, TEXT_FONT, lightTheme, type NeoTheme } from '@/lib/neumorphism'
import { MODULES, isModuleName, type ModuleSpec } from '@/stories/neo/modules/modules'
import { CURVE } from '../motion'
import { avatarInitials } from './cast'
import { inkReveal, tipDashes } from './trace'
import {
  type BaEdgeSpec,
  type BaGraphTiming,
  type BaLayout,
  type BaNodeSpec,
  EDGE_TIP_SETTLE,
  breathPose,
  edgeGeometry,
  ignitePose,
  nodeDiameter,
  phase01,
} from './graphScript'

export type { BaNodeSpec, BaEdgeSpec, BaLayout, BaGraphTiming }

export type BaGraphProps = {
  /** Layout from baGraphLayout() — precomputed so scenes share the coords. */
  layout: BaLayout
  edges?: readonly BaEdgeSpec[]
  /** Timing from baGraphTiming() — precomputed so scenes choreograph against
   * the same nodeAt/edgeAt/settledAt frames. */
  timing: BaGraphTiming
  theme?: NeoTheme
  /** Comet / glow colour. Defaults to KIT_BLUE. */
  accent?: string
  /** Idle bob on settled nodes (the organism breathing). Default 1; 0 = still. */
  breathe?: number
  /** Quiet captions under labelled nodes. Default true. */
  showLabels?: boolean
  /** Local frame override; defaults to useCurrentFrame() (wrap in <Sequence> to offset). */
  frame?: number
  style?: CSSProperties
}

// Comet tail unit (px) — anchors the tip size to the stage, not the path.
const EDGE_UNIT = 56
const EDGE_W = 1.6
// A settled edge's re-run pulse: a faint comet sweep of this many frames.
const PULSE_DUR = 26

/**
 * BaGraph — the /ba/ graph, frame-driven end to end.
 * ──────────────────────────────────────────────────
 * Typed nodes (proceso / app / BBDD / persona) on a seeded organic layout,
 * joined by curved comet edges (trace.ts). Each node powers on with the
 * GoalDisc beat (graphScript.ignitePose); settled nodes breathe; settled
 * edges can re-run faint comet pulses so the organism reads alive. Themed by
 * prop, deterministic per frame. Scales from Prod03's 3-node landing to
 * Prod04's 40+ node colmena off the same engine.
 */
export function BaGraph({
  layout,
  edges = [],
  timing,
  theme = lightTheme,
  accent = KIT_BLUE,
  breathe = 1,
  showLabels = true,
  frame: frameProp,
  style,
}: BaGraphProps) {
  const globalFrame = useCurrentFrame()
  const frame = frameProp ?? globalFrame

  return (
    <div
      style={{
        position: 'relative',
        width: layout.width,
        height: layout.height,
        fontFamily: TEXT_FONT,
        ...style,
      }}
    >
      <svg
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
      >
        {edges.map((e, i) => (
          <Edge
            key={`${e.from}→${e.to}`}
            frame={frame}
            layout={layout}
            edge={e}
            start={timing.edgeAt[i].start}
            end={timing.edgeAt[i].end}
            theme={theme}
            accent={accent}
          />
        ))}
      </svg>

      {layout.nodes.map((n, i) => (
        <Node
          key={n.id}
          frame={frame}
          node={n}
          index={i}
          pos={layout.pos[n.id]}
          at={timing.nodeAt[n.id]}
          theme={theme}
          accent={accent}
          breathe={breathe}
          showLabel={showLabels}
        />
      ))}
    </div>
  )
}

/** One comet edge: neutral ink revealed by the draw, an accent tip riding the
 * front, then (optionally) faint periodic re-runs along the settled line. */
function Edge({
  frame,
  layout,
  edge,
  start,
  end,
  theme,
  accent,
}: {
  frame: number
  layout: BaLayout
  edge: BaEdgeSpec
  start: number
  end: number
  theme: NeoTheme
  accent: string
}) {
  const geo = edgeGeometry(layout, edge.from, edge.to, { bow: edge.bow })
  const drawP = CURVE.standard(phase01(frame, start, end))
  if (drawP <= 0) return null
  const tipFade = 1 - phase01(frame, end, end + EDGE_TIP_SETTLE)

  // The settled edge re-runs a faint comet every pulseEvery frames.
  const sincePulseBase = frame - (end + EDGE_TIP_SETTLE)
  const pulseP =
    edge.pulseEvery != null && sincePulseBase >= 0
      ? (sincePulseBase % edge.pulseEvery) / PULSE_DUR
      : 2
  const pulses = pulseP <= 1 ? tipDashes(pulseP, geo.length, EDGE_UNIT, 'comet', 0.45) : []

  return (
    <g>
      <path
        d={geo.d}
        fill="none"
        stroke={theme.gridLine}
        strokeWidth={EDGE_W}
        strokeLinecap="round"
        {...inkReveal(drawP)}
      />
      {[...tipDashes(drawP, geo.length, EDGE_UNIT, 'comet', tipFade), ...pulses].map((tip, k) => (
        <path
          key={k}
          d={geo.d}
          fill="none"
          stroke={accent}
          strokeWidth={EDGE_W + tip.widthDelta}
          strokeLinecap="round"
          opacity={tip.opacity}
          strokeDasharray={tip.strokeDasharray}
          strokeDashoffset={tip.strokeDashoffset}
        />
      ))}
    </g>
  )
}

/** One node: a raised plate that powers on (ignitePose), content by kind —
 * module icon, persona initials, or the blue process dot — plus a quiet
 * caption. Settled nodes idle on breathPose. */
function Node({
  frame,
  node,
  index,
  pos,
  at,
  theme,
  accent,
  breathe,
  showLabel,
}: {
  frame: number
  node: BaNodeSpec
  index: number
  pos: { x: number; y: number }
  at: number
  theme: NeoTheme
  accent: string
  breathe: number
  showLabel: boolean
}) {
  const pose = ignitePose(frame, at)
  if (pose.opacity <= 0.002) return null

  const d = nodeDiameter(node)
  const k = d / 96 // elevation params are tuned at the 96px reference
  const breath = breathPose(frame, index, breathe * pose.content)
  const plate = elevation(theme, {
    depth: 'raised',
    distance: Math.max(2, pose.distance * k),
    blur: Math.max(4, pose.blur * k),
    radius: node.kind === 'proceso' ? d * 0.3 : 999,
  })

  const glowAlphaHex = Math.round(pose.glowAlpha * 255)
    .toString(16)
    .padStart(2, '0')
  const glow =
    pose.glowAlpha > 0.01
      ? `0 0 ${Math.max(0, pose.glowBlur * k)}px ${accent}${glowAlphaHex}`
      : undefined

  const spec: ModuleSpec | null =
    node.module != null && isModuleName(node.module) ? MODULES[node.module] : null

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x - d / 2,
        top: pos.y - d / 2 + breath.dy,
        width: d,
        height: d,
        opacity: pose.opacity,
        transform: `scale(${pose.scale * breath.scale})`,
        transformOrigin: '50% 50%',
      }}
    >
      <div
        style={{
          ...plate,
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            opacity: pose.content,
            transform: `scale(${pose.content})`,
            transformOrigin: '50% 50%',
            borderRadius: 999,
            boxShadow: glow,
          }}
        >
          {spec ? (
            <img
              src={spec.icon}
              alt=""
              width={d * 0.52}
              height={d * 0.52}
              style={{
                display: 'block',
                transform: spec.rotate ? `rotate(${spec.rotate}deg)` : undefined,
              }}
            />
          ) : node.kind === 'persona' ? (
            <span
              style={{
                fontSize: d * 0.32,
                fontWeight: 600,
                letterSpacing: 0.3,
                color: theme.textMuted,
              }}
            >
              {node.label ? avatarInitials(node.label) : '·'}
            </span>
          ) : (
            <span
              style={{
                width: d * 0.24,
                height: d * 0.24,
                borderRadius: 999,
                background: accent,
                display: 'block',
              }}
            />
          )}
        </div>
      </div>

      {showLabel && node.label && node.kind !== 'persona' && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 9,
            maxWidth: 150,
            fontSize: 12.5,
            lineHeight: '16px',
            textAlign: 'center',
            letterSpacing: -0.1,
            color: theme.textMuted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: pose.content,
          }}
        >
          {node.label}
        </div>
      )}
    </div>
  )
}
