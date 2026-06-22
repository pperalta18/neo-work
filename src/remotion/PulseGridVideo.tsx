/**
 * PulseGridVideo — «Pulse Grid».
 * ──────────────────────────────────────────────────────────────────────────
 * A serene raised disc sits at the centre of a full-bleed field grid. In a slow
 * rotating sweep it emits radial comets of pathfinding chevrons (raised
 * `FlowPlate`, reused verbatim): each streaks out along its own Manhattan
 * staircase, leaves the frame, and its long tail dissolves softly behind the
 * head. No glows, no shockwave, no throb — just the monochrome relief and the
 * quiet motion. The lens stays pinned on the centre and pulls back a hair across
 * the whole take. A thin shell over {@link pulseGridScript}.
 */
import { type CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { PLATE_INSET, elevation } from '@/lib/neumorphism'
import { FlowPlate, GridLines, theme } from './storeFlowScene'
import { Fonts } from './fonts'
import {
  BURSTS,
  CIRCLE_LEFT,
  CIRCLE_SIZE,
  CIRCLE_TOP,
  DURATION,
  GRID_H,
  GRID_W,
  cameraPZ,
  cometGrow,
  headProx,
  routeAlive,
  routeHead,
} from './pulseGridScript'

export const PULSE_GRID_DURATION = DURATION

// ── the comets — chevron trails streaking out, long tails dissolving ────────────

function Comets({ frame }: { frame: number }) {
  return (
    <>
      {BURSTS.map((burst) =>
        burst.routes.map((route, ri) => {
          if (!routeAlive(frame, burst, route)) return null
          const head = routeHead(frame, burst, route)
          return route.cells.map((cell, k) => {
            const grow = cometGrow(head, k)
            if (grow <= 0.001) return null
            // a whisper of extra scale right at the crest keeps the head reading
            const scaleMul = 1 + 0.08 * headProx(head, k)
            return (
              <FlowPlate
                key={`${burst.index}-${ri}-${k}`}
                step={{ at: cell }}
                dir={route.dirs[k]}
                grow={grow}
                scaleMul={scaleMul}
              />
            )
          })
        }),
      )}
    </>
  )
}

// ── the centre — a calm neumorphic lens (raised → groove → raised dome) ──────────

function CenterDisc() {
  const disc = elevation(theme, { depth: 'raised', distance: 16, blur: 36, radius: 999 })
  const groove = elevation(theme, { depth: 'recessed', distance: 5, blur: 13, radius: 999 })
  const dome = elevation(theme, { depth: 'raised', distance: 8, blur: 18, radius: 999 })
  return (
    <div
      style={{
        position: 'absolute',
        left: CIRCLE_LEFT,
        top: CIRCLE_TOP,
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
      }}
    >
      <div style={{ position: 'absolute', inset: PLATE_INSET, borderRadius: 999, ...disc }}>
        {/* a fine engraved concentric groove — a quiet aperture */}
        <div style={{ position: 'absolute', inset: '22%', borderRadius: 999, ...groove }} />
        {/* a gentle raised dome at the very centre */}
        <div style={{ position: 'absolute', inset: '38%', borderRadius: 999, ...dome }} />
      </div>
    </div>
  )
}

// ── composition ─────────────────────────────────────────────────────────────────

export function PulseGridVideo() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()

  const { P, Z } = cameraPZ(frame, W, H)
  const camera: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${W / 2 - P[0] * Z}px, ${H / 2 - P[1] * Z}px) scale(${Z})`,
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div style={camera}>
          <div style={{ position: 'relative', width: GRID_W, height: GRID_H }}>
            {/* the field — static hairlines, bleeding off every edge */}
            <GridLines />

            {/* the comets — chevron trails sweeping out, dissolving behind the head */}
            <Comets frame={frame} />

            {/* the calm centre, on top so the comets read as born under it */}
            <CenterDisc />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
