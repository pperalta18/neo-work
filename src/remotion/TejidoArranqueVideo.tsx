/**
 * TejidoArranqueVideo — «Tejido (arranque)», the ignition of the living tissue.
 * ──────────────────────────────────────────────────────────────────────────
 * A thin visual shell over {@link tejidoArranqueScript}. Everything is a pure
 * function of the frame; the shell only places renderers that already exist:
 *   · beat 1 is a CLOSED little square — six bounded segments (box + cross), no
 *     lines beyond it — traced with GridDrawIn's `Stroke` (KIT_BLUE pen);
 *   · beat 2 OPENS it: each interior line is two half-`Stroke`s growing OUTWARD
 *     from the centre, so the square extends into a huge field that bleeds off
 *     every edge — no frame, no tray, the grid is not an elevated panel;
 *   · every arrow / icon is storeFlowScene's `FlowPlate`, reused verbatim — the
 *     circling relay, the resting arrow, the woven trail and the module icons are
 *     all the same raised plate driven by `grow`. The whole arrow run is ONE chain.
 */
import { type CSSProperties, type ReactElement } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { CELL as NEO_CELL, KIT_BLUE } from '@/lib/neumorphism'
import { type RiveClipName } from './riveClips'
import { RiveClip } from './RiveClip'
import { Stroke } from './GridDrawIn'
import { FlowPlate, theme } from './storeFlowScene'
import { Fonts } from './fonts'
import {
  CENTER_HLINE,
  CENTER_VLINE,
  CHAIN,
  CHAIN_DIRS,
  COLUMNS,
  DURATION,
  GRID_H,
  GRID_W,
  LINE_DRAW,
  MODULE_LAYOUT,
  MODULE_TRIGGER,
  ORIGIN_X,
  ORIGIN_Y,
  P2_START,
  ROWS,
  STROKE_SETTLE,
  cameraPZ,
  cellGrow,
  clamp01,
  hLineStart,
  iconGrow,
  isModuleCell,
  smoother,
  vLineStart,
} from './tejidoArranqueScript'

export const TEJIDO_ARRANQUE_DURATION = DURATION

export function TejidoArranqueVideo() {
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

  const ink = theme.gridLine
  const pen = (props: {
    key: string
    start: number
    draw: number
    width: number
    length: number
    geometry: (v: Record<string, unknown>) => ReactElement
  }) => (
    <Stroke
      key={props.key}
      frame={frame}
      start={props.start}
      draw={props.draw}
      settle={STROKE_SETTLE}
      lineStyle="pen"
      accent={KIT_BLUE}
      ink={ink}
      width={props.width}
      length={props.length}
      unit={NEO_CELL}
      geometry={props.geometry as never}
    />
  )

  // beat 1 · the closed 2×2 square: bounding box + cross, BOUNDED (nothing beyond).
  // It is ALREADY there from frame 0 (no draw-in); it just fades out as the
  // half-strokes take over its position when the field opens.
  const boxX0 = (CENTER_VLINE - 1) * NEO_CELL
  const boxX1 = (CENTER_VLINE + 1) * NEO_CELL
  const boxY0 = (CENTER_HLINE - 1) * NEO_CELL
  const boxY1 = (CENTER_HLINE + 1) * NEO_CELL
  const boxOpacity = 1 - smoother(clamp01((frame - P2_START) / LINE_DRAW))

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div style={camera}>
          <div style={{ position: 'relative', width: GRID_W, height: GRID_H }}>
            <svg
              width={GRID_W}
              height={GRID_H}
              viewBox={`0 0 ${GRID_W} ${GRID_H}`}
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
            >
              {/* the closed square — already present from frame 0 (static, no draw-in) */}
              <g opacity={boxOpacity}>
                {[CENTER_VLINE - 1, CENTER_VLINE, CENTER_VLINE + 1].map((j) => {
                  const x = j * NEO_CELL
                  return (
                    <line
                      key={`bv${j}`}
                      x1={x}
                      y1={boxY0}
                      x2={x}
                      y2={boxY1}
                      stroke={ink}
                      strokeWidth={1}
                      strokeLinecap="round"
                    />
                  )
                })}
                {[CENTER_HLINE - 1, CENTER_HLINE, CENTER_HLINE + 1].map((i) => {
                  const y = i * NEO_CELL
                  return (
                    <line
                      key={`bh${i}`}
                      x1={boxX0}
                      y1={y}
                      x2={boxX1}
                      y2={y}
                      stroke={ink}
                      strokeWidth={1}
                      strokeLinecap="round"
                    />
                  )
                })}
              </g>

              {/* beat 2 · each interior line grows OUTWARD from the centre (two halves) */}
              {Array.from({ length: COLUMNS - 1 }, (_, idx) => {
                const j = idx + 1
                const x = j * NEO_CELL
                const start = vLineStart(j)
                return (
                  <g key={`v${j}`}>
                    {pen({
                      key: `vu${j}`,
                      start,
                      draw: LINE_DRAW,
                      width: 1,
                      length: ORIGIN_Y,
                      geometry: (v) => <line x1={x} y1={ORIGIN_Y} x2={x} y2={0} {...v} />,
                    })}
                    {pen({
                      key: `vd${j}`,
                      start,
                      draw: LINE_DRAW,
                      width: 1,
                      length: GRID_H - ORIGIN_Y,
                      geometry: (v) => <line x1={x} y1={ORIGIN_Y} x2={x} y2={GRID_H} {...v} />,
                    })}
                  </g>
                )
              })}
              {Array.from({ length: ROWS - 1 }, (_, idx) => {
                const i = idx + 1
                const y = i * NEO_CELL
                const start = hLineStart(i)
                return (
                  <g key={`h${i}`}>
                    {pen({
                      key: `hl${i}`,
                      start,
                      draw: LINE_DRAW,
                      width: 1,
                      length: ORIGIN_X,
                      geometry: (v) => <line x1={ORIGIN_X} y1={y} x2={0} y2={y} {...v} />,
                    })}
                    {pen({
                      key: `hr${i}`,
                      start,
                      draw: LINE_DRAW,
                      width: 1,
                      length: GRID_W - ORIGIN_X,
                      geometry: (v) => <line x1={ORIGIN_X} y1={y} x2={GRID_W} y2={y} {...v} />,
                    })}
                  </g>
                )
              })}
            </svg>

            {/* the whole arrow run — one chain: circling laps (sink) → woven route (stay) */}
            {CHAIN.map((c, i) => {
              if (i >= CHAIN_DIRS.length || isModuleCell(c)) return null
              const grow = cellGrow(frame, i)
              if (grow <= 0.001) return null
              return <FlowPlate key={`c${i}`} step={{ at: c }} dir={CHAIN_DIRS[i]} grow={grow} />
            })}

            {/* beat 3 · the 16 module icons, scattered (on top — they're the stations).
                Each icon is the module's animated Rive clip, fired as the arrow head
                passes through its cell (MODULE_TRIGGER); it rests until then. */}
            {MODULE_LAYOUT.map((m, i) => {
              const grow = iconGrow(frame, i)
              if (grow <= 0.001) return null
              return (
                <FlowPlate
                  key={`m${m.name}`}
                  step={{ at: m.at, module: m.name }}
                  dir="right"
                  grow={grow}
                  iconNode={
                    <RiveClip module={m.name as RiveClipName} size={40} startAt={MODULE_TRIGGER[i]} />
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
