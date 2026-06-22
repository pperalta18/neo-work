/**
 * DelegaModulosVideo — «Delega · módulos», the orange action modules as a stack.
 * ──────────────────────────────────────────────────────────────────────────
 * The five "delega" modules — the ACTION group, the orange icons (#FF8120):
 * Action Runner · Action Script · TeamWork · Feedback Loop · Heartbeat — sit on
 * neumorphic grid elevations, clustered dead-centre (3 over 2). NO arrows, no
 * route: the plates settle in, then each module's logo plays its Rive animation
 * ONE BY ONE (staggered). Everything is a pure function of the frame.
 *
 * Reuses storeFlowScene's `FlowPlate` (the raised plate) + `RiveClip` (the
 * deterministic logo playback), like the rest of the module scenes.
 */
import { type CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { CELL } from '@/lib/neumorphism'
import { type Coord } from '@/lib/pathfinding'
import { type ModuleName } from '@/stories/neo/modules/modules'
import { type RiveClipName } from './riveClips'
import { RiveClip } from './RiveClip'
import { FlowPlate, theme } from './storeFlowScene'
import { Fonts } from './fonts'

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

// the field the cluster lives on (big enough to bleed off-edge at our zoom)
const COLUMNS = 24
const ROWS = 16
const GRID_W = COLUMNS * CELL
const GRID_H = ROWS * CELL

/** The 5 orange ACTION modules, clustered centre (3 over 2 — symmetric). */
const LAYOUT: ReadonlyArray<{ name: ModuleName; at: Coord }> = [
  { name: 'actionRunner', at: [11, 7] },
  { name: 'actionScript', at: [12, 7] },
  { name: 'teamwork', at: [13, 7] },
  { name: 'feedbackLoop', at: [11, 8] },
  { name: 'heartbeat', at: [13, 8] },
]

// ── timeline (30 fps) ──────────────────────────────────────────────────────────
const EMERGE_START = 4
const EMERGE_STAGGER = 4 // plates settle in quickly, left→right
const EMERGE_DRAW = 14
const FIRE_START = 30 // first logo plays here
const FIRE_GAP = 34 // one logo at a time — each Rive (≤31f) finishes before the next
const TAIL = 44

export const DELEGA_MODULOS_DURATION = FIRE_START + LAYOUT.length * FIRE_GAP + TAIL

// centre of the cluster (cols 11–13, rows 7–8 → col 12, row 7.5) in grid px
const CENTER: [number, number] = [(12 - 0.5) * CELL, (7.5 - 0.5) * CELL]
const VISIBLE_COLS = 6.5 // frames the 3-wide cluster with air around it

export function DelegaModulosVideo() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()

  // a whisper of push-in for life; the framing stays centred on the cluster
  const Z = (W / (VISIBLE_COLS * CELL)) * lerp(0.985, 1, smoother(clamp01(frame / DELEGA_MODULOS_DURATION)))
  const camera: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${W / 2 - CENTER[0] * Z}px, ${H / 2 - CENTER[1] * Z}px) scale(${Z})`,
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div style={camera}>
          <div style={{ position: 'relative', width: GRID_W, height: GRID_H }}>
            {/* infinite hairline grid — drawn 3× the field, aligned to CELL, so it
                always bleeds whatever the framing. */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: -GRID_W,
                top: -GRID_H,
                width: 3 * GRID_W,
                height: 3 * GRID_H,
                pointerEvents: 'none',
                backgroundImage: `linear-gradient(to right, ${theme.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${theme.gridLine} 1px, transparent 1px)`,
                backgroundSize: `${CELL}px ${CELL}px`,
              }}
            />

            {/* the 5 orange modules — each plate settles in, then its logo plays its
                Rive clip one by one (staggered FIRE cue). No arrows. */}
            {LAYOUT.map((m, k) => {
              const grow = smoother(clamp01((frame - (EMERGE_START + k * EMERGE_STAGGER)) / EMERGE_DRAW))
              if (grow <= 0.001) return null
              return (
                <FlowPlate
                  key={m.name}
                  step={{ at: m.at, module: m.name }}
                  dir="right"
                  grow={grow}
                  iconNode={
                    <RiveClip module={m.name as RiveClipName} size={40} startAt={FIRE_START + k * FIRE_GAP} />
                  }
                />
              )
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
