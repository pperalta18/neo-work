/**
 * RegistroInventarioVideo — "Llega un correo → la IA registra las tuberías".
 * ──────────────────────────────────────────────────────────────────────────
 * Three phases on the flat neumorphic grid, each a deliberate echo of an
 * existing scene so the kit reads as one language:
 *
 *   PHASE 1 · EMAIL   (StoreCreate-style)  — the flat grid holds ONE pastilla,
 *     two cells WIDER than StoreCreate's (5 cols), carrying the Gmail mark + a
 *     reply notification: «Re: Pedido #4821 · Han llegado las tuberías». The
 *     plate emerges, holds, then EXPANDS to the full frame, where it opens into
 *     the email itself (sender · subject · body). Hard cut out.
 *
 *   PHASE 2 · OBJETIVO (Objective-style)   — calcada a {@link ObjectiveVideo}:
 *     an empty goal disc presses up, the objective is written beside it
 *     («Registrar las tuberías en el inventario»), is absorbed into the node,
 *     the disc IGNITES blue, the camera pulls back to seat it in the top-right
 *     corner, and the grid draws itself in (<GridDrawIn>) with the empty start
 *     node arriving bottom-left.
 *
 *   PHASE 3 · PROCESO (StoreFlow-style)    — the pathfinding flow EMERGES along
 *     the grid: the lens glides the serpentine route start→goal and each module
 *     plate rises as it arrives — the AI completing the job by reaching for the
 *     data it needs and editing what's missing (leer el correo · extraer líneas
 *     · abrir inventario · cuadrar SKUs · crear los que faltan · rellenar campos
 *     · actualizar stock · registrar · verificar). Ends pulled back over the
 *     whole route + the lit goal (registrado).
 *
 * House rules (specs/motion-language.md + ./motion): eased `interpolate` only,
 * ease-out, NO bounce/spring; depth is neumorphic relief via `elevation()`,
 * never a coloured glow — the one allowed colour is the goal dot's self-glow
 * (and the grid pen, which dries to the neutral hairline). Every pixel is a pure
 * function of the frame. The flow math mirrors {@link storeFlowScene}'s pacing
 * (kept local because this is a different route, not the tienda flow).
 */

import { type CSSProperties } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { CELL, KIT_BLUE, PLATE_INSET, TEXT_FONT, elevation, lightTheme } from '@/lib/neumorphism'
import { footprint, reflowRoute, routeArrows, type Dir, type RouteStep } from '@/lib/pathfinding'
import { Grid } from '@/components/Grid'
import { FlowPlate } from './storeFlowScene'
import { GridDrawIn, gridDrawTimeline, type GridDrawTiming } from './GridDrawIn'
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
// PHASE 1 — the email pastilla → full-frame opened email (StoreCreate-style).
// ═════════════════════════════════════════════════════════════════════════════

// A grid that bleeds off every edge so scaling never reveals a seam.
const P1_COLS = 17
const P1_ROWS = 11
const P1_GRID_W = P1_COLS * CELL
const P1_GRID_H = P1_ROWS * CELL
const P1_GRID_LEFT = (W - P1_GRID_W) / 2
const P1_GRID_TOP = (H - P1_GRID_H) / 2

// The pastilla: 5 cells wide (StoreCreate's 3 + two more), one row tall, centred.
const PILL_COLS = 5
const P1_COL0 = (P1_COLS - PILL_COLS) / 2 // 6
const P1_ROW0 = (P1_ROWS - 1) / 2 // 5
const P1_FP = { left: P1_COL0 * CELL, top: P1_ROW0 * CELL, w: PILL_COLS * CELL, h: CELL }

const PILL = {
  left: P1_GRID_LEFT + P1_FP.left + PLATE_INSET,
  top: P1_GRID_TOP + P1_FP.top + PLATE_INSET,
  w: P1_FP.w - PLATE_INSET * 2,
  h: P1_FP.h - PLATE_INSET * 2,
  r: 26,
}
const P1_FULL = { left: 0, top: 0, w: W, h: H, r: 0 }

const P1_GRID_IN: [number, number] = [0, 12]
const P1_PLATE_EMERGE: [number, number] = [4, 22]
const P1_CONTENT_IN: [number, number] = [12, 30]
const P1_EXPAND_START = 54
const P1_EXPAND_END = 112
const P1_GRID_FADE: [number, number] = [P1_EXPAND_START + 22, P1_EXPAND_END - 4]
const P1_NOTIF_OUT: [number, number] = [P1_EXPAND_END - 26, P1_EXPAND_END - 6] // the inline notification clears
const P1_EMAIL_IN: [number, number] = [P1_EXPAND_END - 18, P1_EXPAND_END + 16] // the opened email rises in
const P1_HOLD = 54 // read the email before the cut
export const P1_DURATION = P1_EXPAND_END + P1_HOLD // 166

const P1_GRID_SCALE_END = 2.7

function EmailPhase({ frame }: { frame: number }) {
  const expand = ease(frame, P1_EXPAND_START, P1_EXPAND_END, CURVE.standard)
  const rect = {
    left: lerp(PILL.left, P1_FULL.left, expand),
    top: lerp(PILL.top, P1_FULL.top, expand),
    w: lerp(PILL.w, P1_FULL.w, expand),
    h: lerp(PILL.h, P1_FULL.h, expand),
    r: lerp(PILL.r, P1_FULL.r, expand),
  }

  const emerge = ease(frame, P1_PLATE_EMERGE[0], P1_PLATE_EMERGE[1], CURVE.enter)
  const emergeScale = lerp(0.92, 1, emerge)
  const plateOpacity = clamp01(emerge * 1.6)
  const distance = lerp(lerp(4, 9, emerge), 46, expand)
  const blur = lerp(lerp(10, 22, emerge), 130, expand)
  const plate = elevation(theme, { depth: 'raised', distance, blur, radius: rect.r })

  const gridScale = lerp(1, P1_GRID_SCALE_END, expand)
  const gridIn = clamp01(ease(frame, P1_GRID_IN[0], P1_GRID_IN[1], CURVE.enter))
  const gridOut = ease(frame, P1_GRID_FADE[0], P1_GRID_FADE[1], CURVE.standard)
  const gridOpacity = gridIn * (1 - gridOut)

  // the inline notification (Gmail mark + subject) lives in the pill and crossfades
  // out as the surface opens into the full email
  const notifIn = clamp01(ease(frame, P1_CONTENT_IN[0], P1_CONTENT_IN[1], CURVE.enter) * 1.4)
  const notifOut = ease(frame, P1_NOTIF_OUT[0], P1_NOTIF_OUT[1], CURVE.standard)
  const notifOpacity = notifIn * (1 - notifOut)
  const notifScale = lerp(1, 2.1, expand) // grows with the surface before it fades

  // the opened email fades + rises in once the surface is (almost) full-frame
  const emailIn = ease(frame, P1_EMAIL_IN[0], P1_EMAIL_IN[1], CURVE.enter)

  // arrival sheen as the surface locks to full frame
  const sheenX = interpolate(frame, [P1_EXPAND_END - 12, P1_EXPAND_END + 30], [-1.3, 1.3], { ...clampE, easing: CURVE.standard })
  const sheenOpacity = clamp01((expand - 0.7) / 0.3) * (1 - emailIn)

  const gridWrap: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: `translate(-50%, -50%) scale(${gridScale})`,
    transformOrigin: '50% 50%',
    opacity: gridOpacity,
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, overflow: 'hidden' }}>
      <Fonts />

      <div style={gridWrap}>
        <Grid columns={P1_COLS} rows={P1_ROWS} cell={CELL} theme={theme} gridlines>
          {/* merged-cell fill so the 5-cell footprint reads as one pill */}
          <div
            style={{
              position: 'absolute',
              left: P1_FP.left,
              top: P1_FP.top,
              width: P1_FP.w,
              height: P1_FP.h,
              background: theme.surface,
              boxShadow: `inset 0 0 0 1px ${theme.gridLine}`,
            }}
          />
        </Grid>
      </div>

      {/* the pastilla → full-frame surface */}
      <div
        style={{
          position: 'absolute',
          left: rect.left,
          top: rect.top,
          width: rect.w,
          height: rect.h,
          transform: `scale(${emergeScale})`,
          transformOrigin: '50% 50%',
          opacity: plateOpacity,
        }}
      >
        <div
          style={{
            ...plate,
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* inline notification — Gmail mark + reply subject */}
          {notifOpacity > 0.001 ? (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: notifOpacity,
                transform: `scale(${notifScale})`,
                transformOrigin: '50% 50%',
                whiteSpace: 'nowrap',
                fontFamily: TEXT_FONT,
                fontSize: 20,
                lineHeight: '28px',
                letterSpacing: -0.4,
              }}
            >
              <GmailMark height={26} />
              <span>
                <span style={{ color: theme.textMuted }}>Re: Pedido #4821 · </span>
                <span style={{ color: theme.textStrong }}>Han llegado las tuberías</span>
              </span>
            </div>
          ) : null}

          {/* the opened email */}
          {emailIn > 0.001 ? <OpenedEmail progress={emailIn} /> : null}

          {/* arrival sheen — neutral highlight, never a coloured glow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: sheenOpacity,
              background: 'linear-gradient(108deg, transparent 42%, rgba(255,255,255,0.42) 50%, transparent 58%)',
              transform: `translateX(${sheenX * 100}%)`,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  )
}

function OpenedEmail({ progress }: { progress: number }) {
  const rise = (1 - progress) * 22
  return (
    <div
      style={{
        position: 'absolute',
        width: 980,
        maxWidth: '78%',
        opacity: clamp01(progress * 1.3),
        transform: `translateY(${rise}px)`,
        fontFamily: TEXT_FONT,
        color: theme.textStrong,
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      {/* sender row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <GmailMark height={34} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3 }}>Hidromat Suministros</span>
          <span style={{ fontSize: 15, color: theme.textMuted, letterSpacing: -0.1 }}>para mí · hoy 9:14</span>
        </div>
      </div>

      {/* subject */}
      <div style={{ fontSize: 54, lineHeight: '62px', letterSpacing: -1, fontWeight: 600 }}>Han llegado las tuberías</div>

      {/* body */}
      <div style={{ fontSize: 23, lineHeight: '36px', letterSpacing: -0.2, color: theme.textMuted, maxWidth: 820 }}>
        Te confirmo que el pedido <span style={{ color: theme.textStrong }}>#4821</span> ha llegado esta mañana al almacén.
        Adjunto el albarán con el detalle. Ya puedes registrarlas en el inventario.
        <div style={{ marginTop: 22, color: theme.textStrong }}>— Hidromat Suministros</div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 2 + 3 — the objective ignites and the registration flow emerges, both
// on ONE grid (so they read as one continuous shot after the cut).
// ═════════════════════════════════════════════════════════════════════════════

// ── the route: the AI completing «registrar las tuberías» — a serpentine that
// gathers the email, connects to the inventory it needs, edits what's missing,
// and writes the stock. Geometry mirrors the proven tienda serpentine (8×5).
const PROC_ROUTE_SRC: RouteStep[] = [
  // ── bottom row, travelling right: read the incoming order ──
  { at: [1, 5], colSpan: 2, text: { main: 'Leer el correo' } },
  { at: [3, 5] },
  { at: [4, 5], colSpan: 2, text: { main: 'Extraer las líneas' } },
  { at: [6, 5] },
  { at: [7, 5], colSpan: 2, text: { main: 'Abrir inventario' } },
  { at: [7, 4] }, // ↑ decision
  // ── middle row, travelling left: reconcile against what exists ──
  { at: [7, 3], colSpan: 2, text: { main: 'Cuadrar SKUs' } },
  { at: [6, 3] },
  { at: [4, 3], colSpan: 2, text: { main: 'Crear los que faltan' } },
  { at: [3, 3] },
  { at: [1, 3], colSpan: 2, text: { main: 'Rellenar campos' } },
  { at: [1, 2] }, // ↑ decision
  // ── top row, travelling right to the goal: write + confirm ──
  { at: [1, 1], colSpan: 2, text: { main: 'Actualizar stock' } },
  { at: [3, 1] },
  { at: [4, 1], colSpan: 2, text: { main: 'Registrar' } },
  { at: [6, 1] },
  { at: [7, 1], colSpan: 2, text: { main: 'Verificar' } },
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
const M = CONTENT_IDX.length

// node disc geometry (one cell, matching the flow's start/goal nodes)
const GX = (GOAL_NODE[0] - 0.5) * CELL
const GY = (GOAL_NODE[1] - 0.5) * CELL
const SX = (START_NODE[0] - 0.5) * CELL
const SY = (START_NODE[1] - 0.5) * CELL
const DISC_NODE = CELL - PLATE_INSET * 2 // 84
const DISC_HERO = 176 // the objective close-up size

// ── PHASE 2 timeline (procFrame from the cut) — calcada a ObjectiveVideo ──
const EMERGE: [number, number] = [0, 12]
const LABEL_IN: [number, number] = [12, 22]
const LINE1_IN: [number, number] = [17, 29]
const LINE2_IN: [number, number] = [22, 34]
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

// ── PHASE 3 flow timeline (sub-frame from FLOW_START) — mirrors storeFlowScene ──
const INTRO = 22
const BEAT = 46
const OUTRO = 84
const OUTRO_RAMP = 60
const BEATS_END = INTRO + M * BEAT
const FLOW_DURATION = BEATS_END + OUTRO

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

export const PROC_DURATION = FLOW_START + FLOW_DURATION
export const REGISTRO_INVENTARIO_DURATION = P1_DURATION + PROC_DURATION

// ── flow math (pure, local to this route) ──────────────────────────────────────
function zoneAt(sub: number): { k: number; u: number } {
  if (sub < INTRO) return { k: 0, u: sub / INTRO }
  if (sub >= BEATS_END) return { k: M - 1, u: (sub - BEATS_END) / OUTRO_RAMP }
  const f = sub - INTRO
  const k = Math.min(M - 1, Math.floor(f / BEAT))
  return { k, u: (f - k * BEAT) / BEAT }
}
function flowReveal(sub: number): number {
  if (sub < INTRO) return 0
  if (sub >= BEATS_END) return TOTAL_STEPS
  const { k, u } = zoneAt(sub)
  const cur = CONTENT_IDX[k]
  const baseline = k === 0 ? 0 : CONTENT_IDX[k - 1] + 1
  return baseline + (cur - baseline) * window01(u, ARROW_IN) + window01(u, PLATE_IN)
}
function flowFocus(sub: number): [number, number] {
  if (sub < INTRO) return CONTENT_CENTERS[0]
  if (sub >= BEATS_END) return CONTENT_CENTERS[M - 1]
  const { k, u } = zoneAt(sub)
  const cur = CONTENT_CENTERS[k]
  const prev = k === 0 ? cur : CONTENT_CENTERS[k - 1]
  const t = smoother(u / CAM_ARRIVE)
  return [lerp(prev[0], cur[0], t), lerp(prev[1], cur[1], t)]
}

/** Camera focus P (grid space) + zoom Z for the whole phase-2 + phase-3 shot. */
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
    } else if (sub >= BEATS_END) {
      const t = smoother((sub - BEATS_END) / OUTRO_RAMP)
      const f = flowFocus(sub)
      P = [lerp(f[0], GRID_CENTER[0], t), lerp(f[1], GRID_CENTER[1], t)]
      Z = lerp(Z_BASE, Z_FIT, t)
    } else {
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

// ── the goal disc: emerges empty, ignites blue, shrinks to a node on pull-back ──
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

  // part-2 whisper grid behind the disc — grounds it as a goal node, dissolves
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
          {/* whisper grid around the goal node (part 2 only) */}
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

          {/* the flow plates emerge along the route (part 3) */}
          {reveal > 0
            ? ROUTE.map((step, i) => <FlowPlate key={i} step={step} dir={ARROWS[i]} grow={clamp01(reveal - i)} />)
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

export function RegistroInventarioVideo() {
  const frame = useCurrentFrame()
  if (frame < P1_DURATION) return <EmailPhase frame={frame} />
  return <ProcessPhase procFrame={frame - P1_DURATION} />
}
