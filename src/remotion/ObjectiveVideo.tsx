/**
 * ObjectiveVideo — "El objetivo se enciende, y nace el grid".
 * ──────────────────────────────────────────────────────────────────────────
 * One continuous shot of the "intelligence" concept being framed: an objective
 * is stated and lit, the camera pulls back to reveal that the lit objective is
 * the GOAL NODE in the top-right corner of a grid (the project's grid-creator
 * surface — see specs/grid-and-cells.md + pathfinding-concepts.md), the grid
 * draws itself in, and the empty START node arrives bottom-left.
 *
 * The lit disc IS the goal node: it lives at its real grid position from the
 * first frame (cell=220 → its disc is exactly cell − 2·PLATE_INSET = 176px, the
 * same geometry PathScene's <Node variant="goal"> renders). Part 1 is shot in
 * close-up on it, so its corner position only becomes legible on the pull-back.
 *
 *   BEAT 0 · EMERGE      (0–12)    the EMPTY goal disc presses up out of the
 *                                  surface (flat→raised), NO blue dot yet.
 *   BEAT 1 · OBJECTIVE   (12–34)   to its right the objective is written in,
 *                                  staggered fade-rise: «Crear una tienda online
 *                                  a partir de un inventario».
 *   BEAT 2 · READ        (34–58)   the two-up holds, camera breathing.
 *   BEAT 3 · EXIT        (58–74)   the objective accelerates away FIRST, a snappy
 *                                  line-by-line cascade — absorbed into the node.
 *   BEAT 4 · GROW+IGNITE (72–104)  camera centres on the disc (it grows); once the
 *                                  text is gone the disc turns ON — blue dot scales
 *                                  up, self-glow swelling a beat behind, a neumorphic
 *                                  "power-on" deepen + a neutral sheen sweep.
 *   BEAT 5 · REVEAL      (130–166) the camera pulls back (zoom-out): the lit
 *                                  objective settles into the top-right corner and
 *                                  the empty grid space opens below-left of it.
 *   BEAT 6 · GRID        (160–209) the grid draws itself in — fast woven cascade
 *                                  (the blue pen, drying to hairline), framed last
 *                                  — via the reusable <GridDrawIn>.
 *   BEAT 7 · START       (208–224) the empty START node emerges bottom-left.
 *   BEAT 8 · BREATHE     (224–244) the composition settles and the shot exhales.
 *
 * Cinematic camera: a content layer (unbounded content-local space; 1920×1080 is
 * only the screen crop) viewed through a virtual camera = a continuous breathing
 * drift PLUS two eased moves — push-in (READ→CLOSE) then pull-back (CLOSE→WIDE).
 *
 * House rules: eased `interpolate` only, ease-out, NO bounce/spring. Depth is
 * neumorphic relief via `elevation()`, never a coloured glow on a plate — the ONE
 * allowed coloured glow is the blue dot's own self-glow (and GridDrawIn's pen,
 * which dries to the neutral hairline). Every pixel is a pure function of the
 * frame (sine drift included — deterministic).
 */

import { type CSSProperties } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { KIT_BLUE, lightTheme, elevation, TEXT_FONT, PLATE_INSET } from '@/lib/neumorphism'
import { CURVE, ease } from './motion'
import { Fonts } from './fonts'
import { GridDrawIn, type GridDrawTiming } from './GridDrawIn'

const theme = lightTheme

// ── frame + grid geometry (content-local; the disc IS the grid's goal node) ────
const W = 1920
const H = 1080
const HALF_W = W / 2
const HALF_H = H / 2

const COLS = 6
const ROWS = 4
const GCELL = 220 // → goal/start disc = GCELL − 2·PLATE_INSET = 176 (the hero size)
const DISC = GCELL - PLATE_INSET * 2 // 176
const DOT = DISC * 0.5 // 88
const GLOW_REST = DISC * 0.25 // 44 — the dot's established self-glow blur at rest

const GRID_W = COLS * GCELL // 1320
const GRID_H = ROWS * GCELL // 880
const GRID_LEFT = (W - GRID_W) / 2 // 300 — cell area centred in the frame
const GRID_TOP = (H - GRID_H) / 2 // 100

/** Centre of a (1-indexed) grid cell, in content-local coords. */
const cellCentre = (col: number, row: number): [number, number] => [
  GRID_LEFT + (col - 0.5) * GCELL,
  GRID_TOP + (row - 0.5) * GCELL,
]
const [GOAL_CX, GOAL_CY] = cellCentre(COLS + 1, 1) // (1730, 210) — top-right, outside
const [START_CX, START_CY] = cellCentre(0, ROWS) // (190, 870) — bottom-left, outside

// Objective text block, to the right of the goal node (overruns the screen crop —
// fine: the camera frames it in close-up; the content space is unbounded).
const TEXT_X = GOAL_CX + DISC / 2 + 70 // 1888

// ── timeline (30 fps) ─────────────────────────────────────────────────────────
const EMERGE: [number, number] = [0, 12]
const LABEL_IN: [number, number] = [12, 22]
const LINE1_IN: [number, number] = [17, 29]
const LINE2_IN: [number, number] = [22, 34]
const TEXT_OUT: [number, number] = [58, 68] // objective leaves FIRST (staggered per child → gone ~74)
const PUSH: [number, number] = [72, 100] // camera push-in READ→CLOSE (the disc grows / centres)
const IGNITE: [number, number] = [82, 102] // the dot appears + lights blue, after the text is gone
const GLOW: [number, number] = [85, 106] // self-glow swells a beat behind the dot (follow-through)
const DEEPEN: [number, number] = [82, 100] // plate neumorphic power-on deepen
const SHEEN: [number, number] = [84, 104]
const SETTLE: [number, number] = [102, 120]
const ZOOMOUT: [number, number] = [130, 166] // camera pulls back CLOSE→WIDE (objetivo → top-right)
const GRID_START = 160 // the grid begins drawing as the pull-back settles
const START_IN: [number, number] = [208, 224] // the empty start node emerges bottom-left
export const OBJECTIVE_DURATION = 244 // ~8.1 s @30fps

// fast woven grid draw-in — "se genera rápidamente", refined cascade
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

// virtual-camera framings (content-local focus + zoom)
const READ_CAM = { zoom: 1.07, fx: GOAL_CX + 310, fy: GOAL_CY } // the disc + objective two-up
const CLOSE_CAM = { zoom: 1.66, fx: GOAL_CX, fy: GOAL_CY } // close-up on the disc (ignite)
const WIDE_CAM = { zoom: 0.97, fx: HALF_W, fy: HALF_H } // the whole grid, centred

const clampE = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// ─────────────────────────────────────────────────────────────────────────────
export const ObjectiveVideo: React.FC = () => {
  const frame = useCurrentFrame()

  // CAMERA — two decisive eased moves (push-in, then pull-back), plus a continuous
  // breathing drift so held frames are alive. Drift eases off through the big moves.
  const push = ease(frame, PUSH[0], PUSH[1], CURVE.standard)
  const zoomOut = ease(frame, ZOOMOUT[0], ZOOMOUT[1], CURVE.standard)
  let z = lerp(READ_CAM.zoom, CLOSE_CAM.zoom, push)
  z = lerp(z, WIDE_CAM.zoom, zoomOut)
  let cx = lerp(READ_CAM.fx, CLOSE_CAM.fx, push)
  cx = lerp(cx, WIDE_CAM.fx, zoomOut)
  let cy = lerp(READ_CAM.fy, CLOSE_CAM.fy, push)
  cy = lerp(cy, WIDE_CAM.fy, zoomOut)
  const moving = Math.max(4 * push * (1 - push), 4 * zoomOut * (1 - zoomOut)) // 0 at holds, 1 mid-move
  const driftAmp = 0.5 + 0.5 * (1 - moving)
  const zoom = z + Math.sin(frame / 72) * 0.004
  const fx = cx + Math.sin(frame / 46) * 6 * driftAmp
  const fy = cy + Math.sin(frame / 60) * 3.2 * driftAmp
  const camStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    transformOrigin: '50% 50%',
    transform: `translate(${zoom * (HALF_W - fx)}px, ${zoom * (HALF_H - fy)}px) scale(${zoom})`,
  }

  // part-1 grid whisper behind the disc — grounds it as a goal node, dissolves in
  // the push-in (well before the real grid draws). Anchored at the goal node.
  const gridIn = ease(frame, EMERGE[0], 14, CURVE.enter)
  const gridOut = ease(frame, PUSH[0] - 4, PUSH[0] + 22, CURVE.standard)
  const whisperOpacity = gridIn * (1 - gridOut) * 0.5

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, overflow: 'hidden', fontFamily: TEXT_FONT }}>
      <Fonts />

      {/* the content layer, shot through the virtual camera */}
      <div style={camStyle}>
        {/* part-1 grid whisper — feathered texture around the goal node */}
        <div
          style={{
            position: 'absolute',
            left: GOAL_CX - 560,
            top: GOAL_CY - 360,
            width: 1120,
            height: 720,
            opacity: whisperOpacity,
            backgroundImage: `linear-gradient(${theme.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${theme.gridLine} 1px, transparent 1px)`,
            backgroundSize: '128px 128px',
            WebkitMaskImage: 'radial-gradient(58% 56% at 50% 50%, #000 0%, transparent 74%)',
            maskImage: 'radial-gradient(58% 56% at 50% 50%, #000 0%, transparent 74%)',
            pointerEvents: 'none',
          }}
        />

        {/* a soft neutral light pool that seats the goal disc (never coloured) */}
        <div
          style={{
            position: 'absolute',
            left: GOAL_CX,
            top: GOAL_CY,
            width: 640,
            height: 640,
            transform: 'translate(-50%, -50%)',
            opacity: clamp01(ease(frame, EMERGE[0], EMERGE[1], CURVE.enter) * 0.9) * (1 - zoomOut * 0.6),
            background: 'radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 66%)',
            pointerEvents: 'none',
          }}
        />

        {/* the grid draws itself in (the reusable process-grid entrance) */}
        {frame >= GRID_START && (
          <div style={{ position: 'absolute', left: GRID_LEFT, top: GRID_TOP }}>
            <GridDrawIn
              columns={COLS}
              rows={ROWS}
              cell={GCELL}
              frame={frame - GRID_START}
              theme={theme}
              lineStyle="pen"
              timing={GRID_TIMING}
              frameRadius={34}
            />
          </div>
        )}

        <StartNode frame={frame} />
        <GoalDisc frame={frame} />
        <Objective frame={frame} />
      </div>

      {/* a whisper vignette to keep the eye centred — neutral, world space */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 58%, rgba(40,50,70,0.05) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  )
}

// ── the goal node disc — emerges empty, then ignites the blue dot ───────────────
function GoalDisc({ frame }: { frame: number }) {
  // emerge: press up out of the surface, relief growing (flat-ish → raised)
  const emerge = ease(frame, EMERGE[0], EMERGE[1], CURVE.enter)
  const opacity = clamp01(emerge * 1.4)
  const scale = lerp(0.92, 1, emerge)

  // relief: emerge (4→9) → ignite power-on deepen (9→13) → settle (13→11)
  const deepen = ease(frame, DEEPEN[0], DEEPEN[1], CURVE.standard)
  const settle = ease(frame, SETTLE[0], SETTLE[1], CURVE.standard)
  let distance = lerp(4, 9, emerge)
  distance = lerp(distance, 13, deepen)
  distance = lerp(distance, 11, settle)
  let blur = lerp(11, 22, emerge)
  blur = lerp(blur, 30, deepen)
  blur = lerp(blur, 27, settle)
  const plate = elevation(theme, { depth: 'raised', distance, blur, radius: 999 })

  // ignite: the blue dot scales up from zero; its self-glow swells a beat behind it
  const igniteIn = ease(frame, IGNITE[0], IGNITE[1], CURVE.enter)
  const glowSwell = ease(frame, GLOW[0], GLOW[1], CURVE.enter)
  const glowRelax = ease(frame, SETTLE[0], SETTLE[1], CURVE.standard)
  const dotScale = igniteIn
  const dotOpacity = clamp01(ease(frame, IGNITE[0], IGNITE[0] + 14, CURVE.enter) * 1.3)
  const glowBlur = lerp(lerp(0, 48, glowSwell), GLOW_REST, glowRelax) // slight over-swell → rest
  const glowAlpha = lerp(lerp(0, 0.45, glowSwell), 0.4, glowRelax) // 0 → ~0x66

  // a single neutral sheen sweeps the disc as it powers on (highlight, not glow)
  const sheenX = interpolate(frame, SHEEN, [-1.2, 1.2], { ...clampE, easing: CURVE.standard })
  const sheenOpacity = clamp01(interpolate(frame, [SHEEN[0], (SHEEN[0] + SHEEN[1]) / 2, SHEEN[1]], [0, 1, 0], clampE))

  return (
    <div
      style={{
        position: 'absolute',
        left: GOAL_CX - DISC / 2,
        top: GOAL_CY - DISC / 2,
        width: DISC,
        height: DISC,
        opacity,
        transform: `scale(${scale})`,
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
        {/* the sheen, clipped to the circle */}
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

        {/* the blue goal dot — lights up from within (its own allowed self-glow) */}
        <div
          style={{
            width: DOT,
            height: DOT,
            borderRadius: 999,
            background: KIT_BLUE,
            opacity: dotOpacity,
            transform: `scale(${dotScale})`,
            transformOrigin: '50% 50%',
            boxShadow: `0 0 ${glowBlur}px rgba(0,112,249,${glowAlpha})`,
          }}
        />
      </div>
    </div>
  )
}

// ── the empty start node — emerges bottom-left once the grid is drawn ───────────
function StartNode({ frame }: { frame: number }) {
  const inP = ease(frame, START_IN[0], START_IN[1], CURVE.enter)
  if (inP <= 0) return null
  const opacity = clamp01(inP * 1.4)
  const scale = lerp(0.9, 1, inP)
  const plate = elevation(theme, { depth: 'raised', distance: lerp(4, 9, inP), blur: lerp(11, 20, inP), radius: 999 })
  return (
    <div
      style={{
        position: 'absolute',
        left: START_CX - DISC / 2,
        top: START_CY - DISC / 2,
        width: DISC,
        height: DISC,
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
function Objective({ frame }: { frame: number }) {
  // each child rises in (ENTER) and, later, accelerates out (EXIT) drifting left
  // toward the disc, staggered per child so the block leaves in a cascade.
  const childStyle = (inRange: [number, number], outOffset: number): CSSProperties => {
    const inProg = ease(frame, inRange[0], inRange[1], CURVE.enter)
    const out = ease(frame, TEXT_OUT[0] + outOffset, TEXT_OUT[1] + outOffset, CURVE.exit)
    return {
      opacity: clamp01(inProg * 1.4) * (1 - out),
      transform: `translate(${-44 * out}px, ${(1 - inProg) * 16 - 7 * out}px)`,
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: TEXT_X,
        top: GOAL_CY,
        width: 720,
        transform: 'translateY(-50%)',
        fontFamily: TEXT_FONT,
      }}
    >
      <div
        style={{
          ...childStyle(LABEL_IN, 0),
          fontSize: 17,
          letterSpacing: 2.6,
          textTransform: 'uppercase',
          fontWeight: 600,
          color: theme.textMuted,
          marginBottom: 16,
        }}
      >
        Objetivo
      </div>

      <div style={{ fontSize: 44, lineHeight: '56px', letterSpacing: -0.6 }}>
        <div style={childStyle(LINE1_IN, 3)}>
          <span style={{ color: theme.textMuted, fontWeight: 400 }}>Crear una </span>
          <span style={{ color: theme.textStrong, fontWeight: 700 }}>tienda online</span>
        </div>
        <div style={childStyle(LINE2_IN, 6)}>
          <span style={{ color: theme.textMuted, fontWeight: 400 }}>a partir de un </span>
          <span style={{ color: theme.textStrong, fontWeight: 700 }}>inventario</span>
        </div>
      </div>
    </div>
  )
}
