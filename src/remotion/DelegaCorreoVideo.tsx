/**
 * DelegaCorreoVideo — «Llega un correo → la IA delega en los módulos de acción».
 * ──────────────────────────────────────────────────────────────────────────
 * A remix of {@link RegistroInventarioVideo}: it keeps that scene from the BALL
 * onward (the email-expansion phase is dropped) and ends the moment the work is
 * delegated. Two beats on the flat neumorphic grid:
 *
 *   PHASE A · OBJETIVO  (calcada a RegistroInventario Phase 2) — the goal disc
 *     presses up, but instead of an empty node it carries a GMAIL mark with a
 *     reply notification (an email just landed). The notification clears, the
 *     objective is written beside it («Registrar las tuberías en el inventario»),
 *     is absorbed into the node, the disc IGNITES blue, the camera pulls back to
 *     seat it as the goal (top-right) and the grid draws itself in.
 *
 *   PHASE B · DELEGA  (StoreFlow-style with módulos) — the pathfinding flow
 *     EMERGES along the serpentine: this time every station is one of the five
 *     ORANGE «delega» action modules — Action Runner · Action Script · TeamWork ·
 *     Feedback Loop · Heartbeat — each a named plate (icon + wordmark). As the
 *     lens (the head) passes through a module its logo plays its Rive animation
 *     ({@link RiveClip}). After the last module (Heartbeat) fires the head reaches
 *     on and the FINAL arrow lands on the lit ball (the objective) — then cut.
 *
 * House rules (specs/motion-language.md + ./motion): eased `interpolate` only,
 * ease-out, NO bounce/spring; depth is neumorphic relief via `elevation()`, never
 * a coloured glow — the one allowed colour is the goal dot's self-glow (and the
 * orange baked into the module Rives). Every pixel is a pure function of the frame.
 * The flow math mirrors {@link RegistroInventarioVideo}'s pacing (kept local).
 */

import { type CSSProperties } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { CELL, KIT_BLUE, PLATE_INSET, TEXT_FONT, elevation, lightTheme } from '@/lib/neumorphism'
import { footprint, reflowRoute, routeArrows, type Dir, type RouteStep } from '@/lib/pathfinding'
import { isModuleName } from '@/stories/neo/modules/modules'
import { FlowPlate } from './storeFlowScene'
import { GridDrawIn, gridDrawTimeline, type GridDrawTiming } from './GridDrawIn'
import { RiveClip } from './RiveClip'
import { type RiveClipName } from './riveClips'
import { CURVE, ease } from './motion'
import { Fonts } from './fonts'

const theme = lightTheme

const W = 1920
const H = 1080

const clampE = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Quintic smootherstep — zero 1st & 2nd derivative at both ends (no jerk). */
const smoother = (x: number): number => {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}
const window01 = (u: number, [lo, hi]: [number, number]) => smoother((u - lo) / (hi - lo))

// ─────────────────────────────────────────────────────────────────────────────
// The Gmail mark — the official 2020 logo (Wikimedia "Gmail icon (2020).svg"),
// inline so it stays crisp and exact at any scale. viewBox 52 42 88 66.
// ─────────────────────────────────────────────────────────────────────────────
function GmailMark({ height }: { height: number }) {
  const width = (height * 88) / 66
  return (
    <svg width={width} height={height} viewBox="52 42 88 66" style={{ display: 'block', flexShrink: 0 }}>
      <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
      <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
      <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
      <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
      <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
    </svg>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// The route: the AI delegating «registrar las tuberías» — a serpentine whose
// FIVE stations are the orange ACTION modules. Geometry matches the proven
// RegistroInventario serpentine (8×5), so the objective intro lands identically.
// ═════════════════════════════════════════════════════════════════════════════
const PROC_ROUTE_SRC: RouteStep[] = [
  // ── fila inferior → derecha (2 módulos) ──
  { at: [1, 5], colSpan: 3, module: 'actionRunner', text: { main: 'Action Runner' } },
  { at: [4, 5] },
  { at: [5, 5], colSpan: 3, module: 'actionScript', text: { main: 'Action Script' } },
  { at: [8, 5] }, // conector de cola (el giro queda en celda vacía, no sobre un módulo)
  { at: [8, 4] }, // ↑
  { at: [8, 3] }, // ↑  (llega a la fila media)
  // ── fila media ← izquierda (1 módulo, centrado) ──
  { at: [7, 3] },
  { at: [4, 3], colSpan: 3, module: 'teamwork', text: { main: 'TeamWork' } },
  { at: [3, 3] }, // conectores que llevan al giro de la izquierda (sin módulo debajo)
  { at: [2, 3] },
  { at: [1, 3] },
  { at: [1, 2] }, // ↑
  { at: [1, 1] }, // ↑  (llega a la fila superior)
  // ── fila superior → derecha (2 módulos) → hacia el objetivo ──
  { at: [2, 1] },
  { at: [3, 1], colSpan: 3, module: 'feedbackLoop', text: { main: 'Feedback Loop' } },
  { at: [6, 1] },
  { at: [7, 1], colSpan: 3, module: 'heartbeat', text: { main: 'Heartbeat' } },
  { at: [10, 1] }, // la flecha sigue y aterriza en la bola (objetivo) en [COLUMNS+1, 1]
]

const ROUTE = reflowRoute(PROC_ROUTE_SRC)
const COLUMNS = Math.max(8, ...ROUTE.map((s) => footprint(s).c1))
const ROWS = Math.max(5, ...ROUTE.map((s) => footprint(s).r1))
const GRID_W = COLUMNS * CELL
const GRID_H = ROWS * CELL
const GRID_CENTER: [number, number] = [GRID_W / 2, GRID_H / 2]
const START_NODE: [number, number] = [0, 5]
const GOAL_NODE: [number, number] = [COLUMNS + 1, 1]
const ARROWS: Dir[] = routeArrows(ROUTE, GOAL_NODE)

const hasContent = (s: RouteStep) => Boolean(s.text || s.icon || s.module)
const stepCenterPx = (s: RouteStep): [number, number] => {
  const fp = footprint(s)
  return [((fp.c0 + fp.c1 - 1) / 2) * CELL, ((fp.r0 + fp.r1 - 1) / 2) * CELL]
}
const CENTERS = ROUTE.map(stepCenterPx)
const CONTENT_IDX = ROUTE.map((s, i) => (hasContent(s) ? i : -1)).filter((i) => i >= 0)
const CONTENT_CENTERS = CONTENT_IDX.map((i) => CENTERS[i])
const TOTAL_STEPS = ROUTE.length
const M = CONTENT_IDX.length // number of módulos (the stations)

// node disc geometry (one cell, matching the flow's start/goal nodes)
const GX = (GOAL_NODE[0] - 0.5) * CELL
const GY = (GOAL_NODE[1] - 0.5) * CELL
const SX = (START_NODE[0] - 0.5) * CELL
const SY = (START_NODE[1] - 0.5) * CELL
const DISC_NODE = CELL - PLATE_INSET * 2 // 84
const DISC_HERO = 176 // the objective close-up size

// ── PHASE A timeline (procFrame from frame 0) — calcada a RegistroInventario ──
const EMERGE: [number, number] = [0, 12]
const LABEL_IN: [number, number] = [12, 22]
const LINE1_IN: [number, number] = [17, 29]
const LINE2_IN: [number, number] = [22, 34]
const GMAIL_OUT: [number, number] = [58, 78] // the email notification clears before the ignite
const TEXT_OUT: [number, number] = [56, 66]
const PUSH: [number, number] = [70, 98]
const IGNITE: [number, number] = [80, 100]
const GLOW: [number, number] = [83, 104]
const DEEPEN: [number, number] = [80, 98]
const SHEEN: [number, number] = [82, 102]
const SETTLE: [number, number] = [100, 118]
const ZOOMOUT: [number, number] = [126, 166]
const GRID_START = 156 // the grid draws as the pull-back settles

const GRID_TIMING: Partial<GridDrawTiming> = {
  startH: 2,
  lineDraw: 9,
  stagger: 2.5,
  weaveOverlap: 4,
  frameGap: 2,
  frameDraw: 16,
  settle: 8,
  lift: 12,
  breathe: 10,
}
const GRID_TOTAL = gridDrawTimeline(COLUMNS, ROWS, GRID_TIMING).total
const START_IN: [number, number] = [GRID_START + GRID_TOTAL - 14, GRID_START + GRID_TOTAL + 2]
const FLOW_START = START_IN[1] + 10 // the flow begins once the start node has settled

// ── PHASE B flow timeline (sub-frame from FLOW_START) — mirrors the registro flow ──
const INTRO = 22
// Each beat is the glide+reveal of one módulo (ACTIVE) followed by a 2 s DWELL: the
// camera reaches the plate, then rests on it before easing off to the next.
const ACTIVE = 46 // travel + reveal of one módulo (the old BEAT)
const DWELL = 60 // 2 s @ 30 fps — the camera holds on each módulo
const BEAT = ACTIVE + DWELL
const BEATS_END = INTRO + M * BEAT

// Each módulo plays its Rive the instant the head passes through it — fired late in
// the ACTIVE glide (≈ 0.8 of it) so the logo plays through the dwell that follows.
const MODULE_FIRE_OFFSET = 37
// after the last módulo fires the head reaches on toward the goal and the final
// arrow lands on the lit ball (the objective); then a short hold and the cut.
const REACH = 46
const HOLD = 16
const FLOW_DURATION = BEATS_END + REACH + HOLD

const ARROW_IN: [number, number] = [0.04, 0.46]
const PLATE_IN: [number, number] = [0.38, 0.82]
const CAM_ARRIVE = 0.72
const Z_BASE = 2.0

// camera zoom that fits the whole grid + the start/goal discs just outside it
const FRAME_W = GRID_W + 2 * CELL
const FRAME_H = GRID_H + CELL
const Z_FIT = Math.min((W - 200) / FRAME_W, (H - 200) / FRAME_H)

// objective two-up + ignite framings
const READ_FX = GX + 300
const READ_FY = GY
const READ_Z = 1.5
const CLOSE_Z = 1.9

export const DELEGA_CORREO_DURATION = FLOW_START + FLOW_DURATION

/** Frame the intro ends and the flow begins — the first keynote step-through hold. */
export const DELEGA_FLOW_START = FLOW_START
/** Mid-dwell frame of each módulo (the camera holds here ~2 s) — the per-módulo
 *  pause points for the live-Player step-through in the keynote. */
export const DELEGA_MODULE_DWELL_FRAMES: number[] = Array.from({ length: M }, (_, k) =>
  Math.round(FLOW_START + INTRO + k * BEAT + ACTIVE + DWELL / 2),
)

/** Composition frame at which módulo #k (its content index) plays its Rive. */
const moduleFireFrame = (k: number) => FLOW_START + INTRO + k * BEAT + MODULE_FIRE_OFFSET
/** Content index (0..M-1) of the módulo step at ROUTE index `i`, or -1. */
const contentIndexOf = (i: number) => CONTENT_IDX.indexOf(i)

// ── flow math (pure, local to this route) ──────────────────────────────────────
function zoneAt(sub: number): { k: number; u: number } {
  if (sub < INTRO) return { k: 0, u: sub / INTRO }
  if (sub >= BEATS_END) return { k: M - 1, u: 1 }
  const f = sub - INTRO
  const k = Math.min(M - 1, Math.floor(f / BEAT))
  // progress through the ACTIVE glide; clamps at 1 through the dwell hold so the
  // reveal stays complete and the camera rests on the módulo before moving on
  return { k, u: clamp01((f - k * BEAT) / ACTIVE) }
}
function flowReveal(sub: number): number {
  if (sub < INTRO) return 0
  // reach phase: grow the trailing connectors so the arrow runs out to the goal
  if (sub >= BEATS_END) {
    const p = smoother(clamp01((sub - BEATS_END) / REACH))
    return lerp(CONTENT_IDX[M - 1] + 1, TOTAL_STEPS, p)
  }
  const { k, u } = zoneAt(sub)
  const cur = CONTENT_IDX[k]
  const baseline = k === 0 ? 0 : CONTENT_IDX[k - 1] + 1
  return baseline + (cur - baseline) * window01(u, ARROW_IN) + window01(u, PLATE_IN)
}
function flowFocus(sub: number): [number, number] {
  if (sub < INTRO) return CONTENT_CENTERS[0]
  // reach phase: pan from the last módulo out to the goal (the lit ball)
  if (sub >= BEATS_END) {
    const p = smoother(clamp01((sub - BEATS_END) / REACH))
    return [lerp(CONTENT_CENTERS[M - 1][0], GX, p), lerp(CONTENT_CENTERS[M - 1][1], GY, p)]
  }
  const { k, u } = zoneAt(sub)
  const cur = CONTENT_CENTERS[k]
  const prev = k === 0 ? cur : CONTENT_CENTERS[k - 1]
  const t = smoother(u / CAM_ARRIVE)
  return [lerp(prev[0], cur[0], t), lerp(prev[1], cur[1], t)]
}

/** Camera focus P (grid space) + zoom Z for the whole shot (intro → held cut). */
function processCamera(procFrame: number): { P: [number, number]; Z: number } {
  let P: [number, number]
  let Z: number
  if (procFrame < FLOW_START) {
    const push = ease(procFrame, PUSH[0], PUSH[1], CURVE.standard)
    const zo = ease(procFrame, ZOOMOUT[0], ZOOMOUT[1], CURVE.standard)
    Z = lerp(lerp(READ_Z, CLOSE_Z, push), Z_FIT, zo)
    const px = lerp(lerp(READ_FX, GX, push), GRID_CENTER[0], zo)
    const py = lerp(lerp(READ_FY, GY, push), GRID_CENTER[1], zo)
    P = [px, py]
  } else {
    const sub = procFrame - FLOW_START
    if (sub < INTRO) {
      const t = smoother(sub / INTRO)
      P = [lerp(GRID_CENTER[0], CONTENT_CENTERS[0][0], t), lerp(GRID_CENTER[1], CONTENT_CENTERS[0][1], t)]
      Z = lerp(Z_FIT, Z_BASE, t)
    } else {
      // follow the head plate-to-plate; after the beats end flowFocus pans on out
      // to the goal so the final arrow lands on the lit ball, then the shot cuts.
      P = flowFocus(sub)
      Z = Z_BASE
    }
  }
  // a continuous breathing drift so held frames stay alive (deterministic)
  const fx = P[0] + Math.sin(procFrame / 52) * 5
  const fy = P[1] + Math.sin(procFrame / 67) * 3
  const z = Z + Math.sin(procFrame / 80) * 0.004
  return { P: [fx, fy], Z: z }
}

// ── the goal disc: emerges with a Gmail notification, clears it, ignites blue ──
function GoalDisc({ procFrame }: { procFrame: number }) {
  const emerge = ease(procFrame, EMERGE[0], EMERGE[1], CURVE.enter)
  const opacity = clamp01(emerge * 1.4)
  const enterScale = lerp(0.92, 1, emerge)

  // hero size during the objective beat → node size after the pull-back
  const shrink = ease(procFrame, ZOOMOUT[0], ZOOMOUT[1], CURVE.standard)
  const size = lerp(DISC_HERO, DISC_NODE, shrink)

  const deepen = ease(procFrame, DEEPEN[0], DEEPEN[1], CURVE.standard)
  const settle = ease(procFrame, SETTLE[0], SETTLE[1], CURVE.standard)
  let distance = lerp(4, 9, emerge)
  distance = lerp(distance, 13, deepen)
  distance = lerp(distance, 11, settle)
  let blur = lerp(11, 22, emerge)
  blur = lerp(blur, 30, deepen)
  blur = lerp(blur, 27, settle)
  const plate = elevation(theme, { depth: 'raised', distance, blur, radius: 999 })

  // the Gmail notification lives inside the disc, then clears before the ignite
  const gmailOut = ease(procFrame, GMAIL_OUT[0], GMAIL_OUT[1], CURVE.exit)
  const gmailOpacity = opacity * (1 - gmailOut)
  const gmailScale = lerp(1, 0.86, gmailOut)

  const igniteIn = ease(procFrame, IGNITE[0], IGNITE[1], CURVE.enter)
  const glowSwell = ease(procFrame, GLOW[0], GLOW[1], CURVE.enter)
  const glowRelax = ease(procFrame, SETTLE[0], SETTLE[1], CURVE.standard)
  const dotOpacity = clamp01(ease(procFrame, IGNITE[0], IGNITE[0] + 14, CURVE.enter) * 1.3)
  const glowBlur = lerp(lerp(0, 48, glowSwell), size * 0.25, glowRelax)
  const glowAlpha = lerp(lerp(0, 0.45, glowSwell), 0.4, glowRelax)

  const sheenX = interpolate(procFrame, SHEEN, [-1.2, 1.2], { ...clampE, easing: CURVE.standard })
  const sheenOpacity = clamp01(interpolate(procFrame, [SHEEN[0], (SHEEN[0] + SHEEN[1]) / 2, SHEEN[1]], [0, 1, 0], clampE))

  return (
    <div
      style={{
        position: 'absolute',
        left: GX - size / 2,
        top: GY - size / 2,
        width: size,
        height: size,
        opacity,
        transform: `scale(${enterScale})`,
        transformOrigin: '50% 50%',
      }}
    >
      <div
        style={{
          ...plate,
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 999,
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: sheenOpacity,
            background: 'linear-gradient(108deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)',
            transform: `translateX(${sheenX * 100}%)`,
            pointerEvents: 'none',
          }}
        />

        {/* the email that just landed — Gmail mark + a reply notification badge */}
        {gmailOpacity > 0.001 ? (
          <div
            style={{
              position: 'absolute',
              opacity: gmailOpacity,
              transform: `scale(${gmailScale})`,
              transformOrigin: '50% 50%',
            }}
          >
            <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
              <GmailMark height={size * 0.34} />
              <div
                style={{
                  position: 'absolute',
                  top: -size * 0.12,
                  right: -size * 0.16,
                  minWidth: size * 0.2,
                  height: size * 0.2,
                  padding: `0 ${size * 0.05}px`,
                  boxSizing: 'border-box',
                  borderRadius: 999,
                  background: '#ea4335',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: TEXT_FONT,
                  fontSize: size * 0.13,
                  fontWeight: 700,
                  lineHeight: 1,
                  boxShadow: `0 ${size * 0.012}px ${size * 0.05}px rgba(0,0,0,0.18)`,
                }}
              >
                1
              </div>
            </div>
          </div>
        ) : null}

        {/* the objective, committed — the disc ignites blue (same as the original) */}
        <div
          style={{
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: 999,
            background: KIT_BLUE,
            opacity: dotOpacity,
            transform: `scale(${igniteIn})`,
            transformOrigin: '50% 50%',
            boxShadow: `0 0 ${glowBlur}px rgba(0,112,249,${glowAlpha})`,
          }}
        />
      </div>
    </div>
  )
}

// ── the empty start node, bottom-left, emerging once the grid is drawn ──────────
function StartNode({ procFrame }: { procFrame: number }) {
  const inP = ease(procFrame, START_IN[0], START_IN[1], CURVE.enter)
  if (inP <= 0) return null
  const opacity = clamp01(inP * 1.4)
  const scale = lerp(0.9, 1, inP)
  const plate = elevation(theme, { depth: 'raised', distance: lerp(4, 9, inP), blur: lerp(11, 20, inP), radius: 999 })
  return (
    <div
      style={{
        position: 'absolute',
        left: SX - DISC_NODE / 2,
        top: SY - DISC_NODE / 2,
        width: DISC_NODE,
        height: DISC_NODE,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: '50% 50%',
      }}
    >
      <div style={{ ...plate, width: '100%', height: '100%', borderRadius: 999 }} />
    </div>
  )
}

// ── the objective, written beside the disc, then absorbed into the node ─────────
function Objective({ procFrame }: { procFrame: number }) {
  const childStyle = (inRange: [number, number], outOffset: number): CSSProperties => {
    const inProg = ease(procFrame, inRange[0], inRange[1], CURVE.enter)
    const out = ease(procFrame, TEXT_OUT[0] + outOffset, TEXT_OUT[1] + outOffset, CURVE.exit)
    return {
      opacity: clamp01(inProg * 1.4) * (1 - out),
      transform: `translate(${-40 * out}px, ${(1 - inProg) * 14 - 6 * out}px)`,
    }
  }
  const allGone = ease(procFrame, TEXT_OUT[1] + 6, TEXT_OUT[1] + 12, CURVE.exit)
  if (allGone >= 1) return null

  return (
    <div
      style={{
        position: 'absolute',
        left: GX + DISC_HERO / 2 + 64,
        top: GY,
        width: 560,
        transform: 'translateY(-50%)',
        fontFamily: TEXT_FONT,
      }}
    >
      <div
        style={{
          ...childStyle(LABEL_IN, 0),
          fontSize: 15,
          letterSpacing: 2.6,
          textTransform: 'uppercase',
          fontWeight: 600,
          color: theme.textMuted,
          marginBottom: 14,
        }}
      >
        Objetivo
      </div>
      <div style={{ fontSize: 40, lineHeight: '50px', letterSpacing: -0.6 }}>
        <div style={childStyle(LINE1_IN, 3)}>
          <span style={{ color: theme.textMuted, fontWeight: 400 }}>Registrar las </span>
          <span style={{ color: theme.textStrong, fontWeight: 700 }}>tuberías</span>
        </div>
        <div style={childStyle(LINE2_IN, 6)}>
          <span style={{ color: theme.textMuted, fontWeight: 400 }}>en el </span>
          <span style={{ color: theme.textStrong, fontWeight: 700 }}>inventario</span>
        </div>
      </div>
    </div>
  )
}

function ProcessPhase({ procFrame }: { procFrame: number }) {
  const { P, Z } = processCamera(procFrame)
  const tx = W / 2 - P[0] * Z
  const ty = H / 2 - P[1] * Z
  const camera: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${tx}px, ${ty}px) scale(${Z})`,
  }

  // phase-A whisper grid behind the disc — grounds it as a goal node, dissolves
  // before the real grid draws
  const whisperIn = ease(procFrame, EMERGE[0], 14, CURVE.enter)
  const whisperOut = ease(procFrame, PUSH[0] - 4, PUSH[0] + 22, CURVE.standard)
  const whisperOpacity = whisperIn * (1 - whisperOut) * 0.5

  const sub = procFrame - FLOW_START
  const reveal = procFrame >= FLOW_START ? flowReveal(sub) : 0

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, overflow: 'hidden', fontFamily: TEXT_FONT }}>
      <Fonts />
      <div style={camera}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: GRID_W, height: GRID_H }}>
          {/* whisper grid around the goal node (phase A only) */}
          {whisperOpacity > 0.001 ? (
            <div
              style={{
                position: 'absolute',
                left: GX - 560,
                top: GY - 360,
                width: 1120,
                height: 720,
                opacity: whisperOpacity,
                backgroundImage: `linear-gradient(${theme.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${theme.gridLine} 1px, transparent 1px)`,
                backgroundSize: `${CELL}px ${CELL}px`,
                WebkitMaskImage: 'radial-gradient(58% 56% at 50% 50%, #000 0%, transparent 74%)',
                maskImage: 'radial-gradient(58% 56% at 50% 50%, #000 0%, transparent 74%)',
                pointerEvents: 'none',
              }}
            />
          ) : null}

          {/* the grid draws itself in and then stays as the flow's surface */}
          {procFrame >= GRID_START ? (
            <div style={{ position: 'absolute', left: 0, top: 0 }}>
              <GridDrawIn
                columns={COLUMNS}
                rows={ROWS}
                cell={CELL}
                frame={procFrame - GRID_START}
                theme={theme}
                lineStyle="pen"
                timing={GRID_TIMING}
                frameRadius={28}
              />
            </div>
          ) : null}

          {/* the flow plates emerge along the route (phase B) — every station a
              módulo whose logo plays its Rive as the head passes through it */}
          {reveal > 0
            ? ROUTE.map((step, i) => {
                const isMod = isModuleName(step.module)
                const k = isMod ? contentIndexOf(i) : -1
                return (
                  <FlowPlate
                    key={i}
                    step={step}
                    dir={ARROWS[i]}
                    grow={clamp01(reveal - i)}
                    iconNode={
                      isMod && k >= 0 ? (
                        <RiveClip module={step.module as RiveClipName} size={40} startAt={moduleFireFrame(k)} />
                      ) : undefined
                    }
                  />
                )
              })
            : null}

          <StartNode procFrame={procFrame} />
          <GoalDisc procFrame={procFrame} />
          <Objective procFrame={procFrame} />
        </div>
      </div>

      {/* a whisper vignette to keep the eye centred — neutral, screen space */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 58%, rgba(40,50,70,0.05) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  )
}

export function DelegaCorreoVideo() {
  const frame = useCurrentFrame()
  return <ProcessPhase procFrame={frame} />
}
