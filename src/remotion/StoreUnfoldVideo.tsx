/**
 * StoreUnfoldVideo — StoreFlow, then the elevations unroll into a line.
 * ──────────────────────────────────────────────────────────────────────────
 * Phase A is the EXACT StoreFlow ({@link storeFlowScene}): the lens glides the
 * serpentine route, each module plate emerging as it arrives, ending pulled back
 * over the whole route + the blue goal.
 *
 * Phase B (the new epilogue) honours the brief literally:
 *   1. the grid (hairlines + tray frame) and the objective (goal disc) — plus the
 *      start disc and the connecting arrows, the path scaffolding — DISSOLVE,
 *   2. leaving only the elevations (the raised module plates) floating,
 *   3. which then ORDER INTO A LINE, in route order, keeping the separation they
 *      had: between every consecutive pair sat exactly one connector cell, so the
 *      line spaces them by that same one-cell gap (a uniform pitch). The camera
 *      only pulls back (centre fixed — the line is centred on the grid) to frame
 *      the whole row.
 *
 * Motion follows the house rules ({@link motion}): scaffolding leaves on the
 * accelerate `exit` curve; plates and camera move on the soft-ended `standard`
 * curve (zero velocity at both ends, so nothing snaps out of the hold). No bounce.
 */

import { type CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { CELL, KIT_BLUE, TEXT_FONT, elevation } from '@/lib/neumorphism'
import { footprint } from '@/lib/pathfinding'
import {
  ROUTE,
  ARROWS,
  CONTENT_IDX,
  START_NODE,
  GOAL_NODE,
  GRID_W,
  GRID_H,
  GRID_CENTER,
  STORE_FLOW_DURATION,
  hasContent,
  gridFitZoom,
  flowCameraPZ,
  lerp,
  clamp01,
  theme,
  FlowGrid,
  FlowPlate,
  FlowNode,
  GridLines,
  useIconPreload,
} from './storeFlowScene'
import { CURVE, ease } from './motion'
import { Stroke } from './GridDrawIn'
import { Fonts } from './fonts'

// ── epilogue timeline (30 fps), all measured from the end of the flow ──────────

const FA = STORE_FLOW_DURATION // phase A (the flow) ends here

const DISSOLVE_DUR = 20 // grid + goal + start + arrows fade out
const HOLD = 14 // a beat where only the elevations float
const UNROLL_START = FA + DISSOLVE_DUR + HOLD
const STAGGER = 4 // each plate sets off a touch after the previous → "ordering"
const UNROLL_DUR = 42 // one plate's glide into the line
const LAST_END = UNROLL_START + (CONTENT_IDX.length - 1) * STAGGER + UNROLL_DUR

// Once together, a single "pen" line travels the perimeter, drawing a rounded
// frame that groups the row into a named process; the title label lands above the
// frame's top-left corner as the line closes back there.
const FRAME_GAP = 8 // a beat after the row lands before the frame starts
const FRAME_START = LAST_END + FRAME_GAP
const FRAME_DRAW = 46 // the line travels the whole perimeter (a grand traversal)
const FRAME_SETTLE = 12 // pen accent drying to the neutral hairline
const FRAME_END = FRAME_START + FRAME_DRAW
const LABEL_START = FRAME_END - 8 // label arrives as the frame closes at top-left
const LABEL_DUR = 14
const LABEL_END = LABEL_START + LABEL_DUR

// Phase C — consolidation as a REAL morph. After a rest, the frame line and the
// corner label LEAVE, the row of elevations slides together + fades, and a single
// continuous plate (present behind the row the whole time, same footprint) is
// revealed and CONTRACTS in place — the row's own elevation becoming the pill.
// The diana icon + process name fade in as it settles. The camera pushes in.
const REST = 26 // rest on the finished, framed process
const C_START = LABEL_END + REST
const C_FRAME_OUT = 18 // the frame line fades + collapses inward
const C_LABEL_OUT = 16 // the corner label leaves
const C_MORPH = 46 // the shell contracts from the full row down to the single pill
const C_CONVERGE = 32 // the step pills squeeze with the shell + fade, revealing it
const C_TITLE_START = C_START + 22 // icon + name fade in as the shell nears final size
const C_END = C_START + C_MORPH
const FINAL_HOLD = 44 // rest on the single consolidated elevation

export const STORE_UNFOLD_DURATION = C_END + FINAL_HOLD

export const PROCESS_TITLE = 'Proceso de ventas'

// Camera push-in target for the consolidated pill (centre fixed on the grid).
const Z_CONSOLIDATE = 1.2

// The single consolidated elevation (world space, centred on the grid).
const PROC_W = 470
const PROC_H = 140
const PROC_LEFT = GRID_CENTER[0] - PROC_W / 2
const PROC_TOP = GRID_CENTER[1] - PROC_H / 2

// ── the unrolled line (grid-space target positions) ────────────────────────────
// The elevations lay left→right in route order, packed tight — a small uniform
// gap, not the full connector cell they travelled. The line is centred on the
// grid centre, so the camera need only zoom (P fixed).

const GAP = 24 // tight spacing between consecutive elevations
const CONTENT_STEPS = CONTENT_IDX.map((i) => ROUTE[i])
const PILL_W = CONTENT_STEPS.map((s) => {
  const fp = footprint(s)
  return (fp.c1 - fp.c0 + 1) * CELL
})
const PILL_H = CELL // every module plate is one row tall
const LINE_W = PILL_W.reduce((a, b) => a + b, 0) + (CONTENT_STEPS.length - 1) * GAP

/** Left edge of each elevation once lined up (cumulative widths + gaps, centred). */
const LINE_LEFTS = (() => {
  const lefts: number[] = []
  let x = GRID_CENTER[0] - LINE_W / 2
  for (let j = 0; j < CONTENT_STEPS.length; j += 1) {
    lefts.push(x)
    x += PILL_W[j] + GAP
  }
  return lefts
})()
const LINE_TOP = GRID_CENTER[1] - PILL_H / 2

// ── the grouping frame (world-space rounded rect around the row) ────────────────
const FRAME_PAD = 40 // breathing room between the row and the frame
const FRAME_RADIUS = 44
const FRAME_BOX_X = LINE_LEFTS[0] - FRAME_PAD
const FRAME_BOX_Y = LINE_TOP - FRAME_PAD
const FRAME_BOX_W = LINE_W + 2 * FRAME_PAD
const FRAME_BOX_H = PILL_H + 2 * FRAME_PAD
// Rounded-rect perimeter: straight runs + the four quarter-arcs.
const FRAME_LEN = 2 * (FRAME_BOX_W + FRAME_BOX_H) - 2 * FRAME_RADIUS * (4 - Math.PI)

const FIT_MARGIN_X = 140
const fitZoom = (W: number) => (W - 2 * FIT_MARGIN_X) / FRAME_BOX_W

// The grid tray panel, replayed so the dissolve starts pixel-identical to the
// flow's final frame (`<Grid frame>` draws this on its container).
const FRAME_SHADOW = `inset 0 0 0 1px ${theme.gridLine}, 0 18px 50px -20px ${theme.shadow}`

/**
 * The label that names the framed row — a quiet box sitting ABOVE the frame's
 * top-left corner (no dot, lighter weight). Arrives as the frame closes; leaves
 * when the process consolidates.
 */
function TitleChip({ frame }: { frame: number }) {
  const inP = ease(frame, LABEL_START, LABEL_END, CURVE.enter)
  const outP = ease(frame, C_START, C_START + C_LABEL_OUT, CURVE.exit)
  const p = inP * (1 - outP)
  if (p <= 0.001) return null
  const CHIP_H = 58
  return (
    <div
      style={{
        position: 'absolute',
        left: FRAME_BOX_X + 4,
        top: FRAME_BOX_Y - 18 - CHIP_H + (1 - inP) * 10,
        height: CHIP_H,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderRadius: 18,
        ...elevation(theme, { depth: 'raised', distance: 6, blur: 16, radius: 18 }),
        opacity: p,
      }}
    >
      <span
        style={{
          fontFamily: TEXT_FONT,
          fontSize: 29,
          lineHeight: '1',
          letterSpacing: -0.4,
          color: theme.textStrong,
          fontWeight: 400,
          whiteSpace: 'nowrap',
        }}
      >
        {PROCESS_TITLE}
      </span>
    </div>
  )
}

/**
 * The diana (target) icon — duotone, worked like the module brand icons: ink
 * rings (#1E1E20) with a brand-blue bullseye (the same KIT_BLUE as the objective
 * the flow chased). Inline SVG so the colours are exact and crisp at any scale.
 */
function ProcessIcon({ size = 52 }: { size?: number }) {
  const ink = '#1E1E20'
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" style={{ display: 'block', flexShrink: 0 }}>
      <circle cx={60} cy={60} r={45} stroke={ink} strokeWidth={9} />
      <circle cx={60} cy={60} r={27} stroke={ink} strokeWidth={9} />
      <circle cx={60} cy={60} r={12} fill={KIT_BLUE} />
    </svg>
  )
}

/**
 * The MORPH shell — ONE continuous raised plate. It lives behind the tight row
 * the whole time at the row's exact footprint (so at morph 0 it's invisible,
 * hidden under the pills); as the row slides together and fades it is revealed
 * and CONTRACTS in place — centre fixed — down to the single pill. No new pill is
 * ever spawned: the row's own elevation literally becomes the pill's.
 */
function MorphShell({ morph }: { morph: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: lerp(LINE_LEFTS[0], PROC_LEFT, morph),
        top: lerp(LINE_TOP, PROC_TOP, morph),
        width: lerp(LINE_W, PROC_W, morph),
        height: lerp(PILL_H, PROC_H, morph),
        ...elevation(theme, {
          depth: 'raised',
          distance: lerp(8, 11, morph),
          blur: lerp(16, 24, morph),
          radius: lerp(24, 30, morph),
        }),
      }}
    />
  )
}

/** The consolidated content — diana icon + process name — fading in on the shell
 *  as it settles into the single pill. */
function ProcessContent({ frame }: { frame: number }) {
  const e = ease(frame, C_TITLE_START, C_END, CURVE.enter)
  if (e <= 0.001) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: PROC_LEFT,
        top: PROC_TOP,
        width: PROC_W,
        height: PROC_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        color: theme.textStrong,
        fontFamily: TEXT_FONT,
        transform: `scale(${0.96 + 0.04 * e})`,
        opacity: clamp01(e * 1.4),
      }}
    >
      <ProcessIcon size={52} />
      <span style={{ fontSize: 38, lineHeight: '1', letterSpacing: -0.6, fontWeight: 500, whiteSpace: 'nowrap' }}>
        {PROCESS_TITLE}
      </span>
    </div>
  )
}

/** Phase B → C: the elevations order into a line, are framed + named, then
 *  the frame leaves and the row implodes into a single named elevation. */
function Unroll({ frame }: { frame: number }) {
  const scaffoldOpacity = 1 - ease(frame, FA, FA + DISSOLVE_DUR, CURVE.exit)

  // Phase C — consolidation progresses. `morph` contracts the continuous shell
  // (row → pill); `converge` slides the step pills to the centre and fades them,
  // revealing the shell so the row's own elevation visibly becomes the pill.
  const morph = ease(frame, C_START, C_END, CURVE.standard)
  const converge = ease(frame, C_START, C_START + C_CONVERGE, CURVE.standard)
  const frameLeave = ease(frame, C_START, C_START + C_FRAME_OUT, CURVE.exit)

  return (
    <div style={{ position: 'relative', width: GRID_W, height: GRID_H }}>
      {/* Path scaffolding — grid hairlines + tray frame, connecting arrows, the
          start disc and the goal (objective). All of it dissolves together. */}
      <div style={{ position: 'absolute', inset: 0, opacity: scaffoldOpacity, borderRadius: 28, boxShadow: FRAME_SHADOW }}>
        <GridLines style={{ borderRadius: 28 }} />
        {ROUTE.map((step, i) =>
          hasContent(step) ? null : <FlowPlate key={i} step={step} dir={ARROWS[i]} grow={1} />,
        )}
        <FlowNode coord={START_NODE} variant="start" />
        <FlowNode coord={GOAL_NODE} variant="goal" />
      </div>

      {/* The continuous morph shell, behind the row (hidden under it until the row
          slides away, then revealed as it contracts into the pill). */}
      {frame >= C_START ? <MorphShell morph={morph} /> : null}

      {/* The elevations: glide into the line (phase B), then slide together + fade
          to reveal the shell contracting beneath them (phase C). */}
      {CONTENT_IDX.map((i, j) => {
        const fp = footprint(ROUTE[i])
        const srcLeft = (fp.c0 - 1) * CELL
        const srcTop = (fp.r0 - 1) * CELL
        const p = ease(frame, UNROLL_START + j * STAGGER, UNROLL_START + j * STAGGER + UNROLL_DUR, CURVE.standard)
        const lineLeft = lerp(srcLeft, LINE_LEFTS[j], p)
        const lineTop = lerp(srcTop, LINE_TOP, p)
        // In phase C the pill tracks the shell's contraction: the same horizontal
        // squeeze `s` about the centre, so the labelled row visibly compresses INTO
        // the shrinking shell (rather than piling up at a point) before fading.
        const s = lerp(1, PROC_W / LINE_W, morph)
        const cx = GRID_CENTER[0] + (lineLeft + PILL_W[j] / 2 - GRID_CENTER[0]) * s
        return (
          <FlowPlate
            key={i}
            step={ROUTE[i]}
            dir={ARROWS[i]}
            grow={1}
            noSpanFill
            left={cx - PILL_W[j] / 2}
            top={lineTop}
            scaleMul={s}
            opacityMul={1 - converge}
          />
        )
      })}

      {/* The line that travels, drawing a rounded frame around the process — then
          collapses inward and fades as the row consolidates. */}
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${FRAME_BOX_W} ${FRAME_BOX_H}`}
        style={{
          position: 'absolute',
          left: FRAME_BOX_X,
          top: FRAME_BOX_Y,
          width: FRAME_BOX_W,
          height: FRAME_BOX_H,
          overflow: 'visible',
          transformOrigin: '50% 50%',
          transform: `scale(${1 - 0.5 * frameLeave})`,
          opacity: 1 - frameLeave,
        }}
      >
        <Stroke
          frame={frame}
          start={FRAME_START}
          draw={FRAME_DRAW}
          settle={FRAME_SETTLE}
          lineStyle="pen"
          accent={KIT_BLUE}
          ink={theme.gridLine}
          width={2.5}
          length={FRAME_LEN}
          unit={CELL}
          geometry={(v) => (
            <rect x={1.25} y={1.25} width={FRAME_BOX_W - 2.5} height={FRAME_BOX_H - 2.5} rx={FRAME_RADIUS} ry={FRAME_RADIUS} {...v} />
          )}
        />
      </svg>

      {/* The label above the frame — and the content of the elevation it becomes. */}
      <TitleChip frame={frame} />
      <ProcessContent frame={frame} />
    </div>
  )
}

export function StoreUnfoldVideo() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  useIconPreload()

  const inFlow = frame < FA

  // Camera. Phase A: the flow's own pan/zoom. Phase B: hold the flow's final
  // whole-scene framing, then zoom out (centre fixed) to fit the unrolled line.
  // Phase C: push back in to land on the single consolidated elevation.
  let P: [number, number]
  let Z: number
  if (inFlow) {
    ;({ P, Z } = flowCameraPZ(frame, W, H))
  } else {
    const zt = ease(frame, UNROLL_START, LAST_END, CURVE.standard)
    const zLine = lerp(gridFitZoom(W, H), fitZoom(W), zt)
    const ct = ease(frame, C_START, C_END, CURVE.standard)
    Z = lerp(zLine, Z_CONSOLIDATE, ct)
    P = GRID_CENTER
  }
  const tx = W / 2 - P[0] * Z
  const ty = H / 2 - P[1] * Z

  const camera: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${tx}px, ${ty}px) scale(${Z})`,
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div style={camera}>{inFlow ? <FlowGrid frame={frame} /> : <Unroll frame={frame} />}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
