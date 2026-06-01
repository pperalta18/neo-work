/**
 * StoreFlowVideo — "crear una tienda online", read as a 2D pathfinding flow.
 * ──────────────────────────────────────────────────────────────────────────
 * Narrates a flow over the flat neumorphic grid ([Grid & Cells](../../specs/
 * grid-and-cells.md) + [Emergence](../../specs/emergence-animation.md)) with NO
 * captions — just the animation. A virtual "camera" (a CSS pan + zoom transform
 * on the grid) sits tight on one pastilla, glides to where the next step appears,
 * and that plate **emerges** (flat → raised: shadow grows, scales up, fades in)
 * as the lens arrives. Step by step the AI builds the store, ending on a slow
 * pull-back over the whole route + the blue goal (the live store).
 *
 * Smooth by construction: a single quintic `smoother` curve eases the camera pan
 * and every emergence, with the connecting arrow and the next plate rising in an
 * overlapping window so steps flow into one another instead of snapping.
 *
 * Merged cells match the 2D grid rule: when a step spans >1 slot, the hairline
 * *between* those slots is removed (the footprint is painted as one cell with a
 * single perimeter border) — see {@link FlowPlate}. Everything is derived purely
 * from `useCurrentFrame()` (no CSS transitions, which are wall-clock).
 */

import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { CELL, PLATE_INSET, KIT_BLUE, TEXT_FONT, elevation, lightTheme } from '@/lib/neumorphism'
import {
  footprint,
  reflowRoute,
  routeArrows,
  type Coord,
  type Dir,
  type RouteStep,
} from '@/lib/pathfinding'
import { Grid } from '@/components/Grid'
import { Chevron, Label } from '@/components/content'
import { Icon, isIconName } from '@/components/icons'
import { MODULES, isModuleName, type ModuleName, type ModuleSpec } from '@/stories/neo/modules/modules'
import { CONCEPTS } from '@/content/concepts'
import { Fonts } from './fonts'

const theme = lightTheme

// ── source route + geometry (reused from the pathfinding layer) ────────────────

const STORE = CONCEPTS.find((c) => c.id === 'tienda-online')
if (!STORE) throw new Error('StoreFlowVideo: concept "tienda-online" not found')
const SPEC = STORE.spec

const ROUTE = reflowRoute(SPEC.route)
const COLUMNS = Math.max(SPEC.columns, ...ROUTE.map((s) => footprint(s).c1))
const ROWS = Math.max(SPEC.rows, ...ROUTE.map((s) => footprint(s).r1))
const GRID_W = COLUMNS * CELL
const GRID_H = ROWS * CELL
const START_NODE: Coord = SPEC.startNode ?? [0, ROUTE[0]?.at[1] ?? 1]
const GOAL_NODE: Coord = [COLUMNS + 1, 1]
const ARROWS = routeArrows(ROUTE, GOAL_NODE)

const hasContent = (s: RouteStep) => Boolean(s.text || s.image || s.icon || s.module)

/** Pixel centre of a (reflowed) step's footprint, in grid space. */
function stepCenterPx(step: RouteStep): [number, number] {
  const fp = footprint(step)
  return [((fp.c0 + fp.c1 - 1) / 2) * CELL, ((fp.r0 + fp.r1 - 1) / 2) * CELL]
}

const CENTERS = ROUTE.map(stepCenterPx)
const CONTENT_IDX = ROUTE.map((s, i) => (hasContent(s) ? i : -1)).filter((i) => i >= 0)
const CONTENT_CENTERS = CONTENT_IDX.map((i) => CENTERS[i])
const TOTAL_STEPS = ROUTE.length
const M = CONTENT_IDX.length // number of meaningful steps (the "pasos")

const MODULES_USED = Array.from(
  new Set(ROUTE.map((s) => s.module).filter((m): m is ModuleName => isModuleName(m))),
)

// ── timeline (30 fps) ─────────────────────────────────────────────────────────

const INTRO = 22 // brief push-in on the start of the route
const BEAT = 52 // one step (calm, so motion never snaps)
const OUTRO = 84 // slow pull-back to the whole route + goal
const OUTRO_RAMP = 60

const BEATS_END = INTRO + M * BEAT
/** Total composition length in frames. */
export const STORE_FLOW_DURATION = BEATS_END + OUTRO

// Within a beat (fractions of BEAT): the connecting arrow rises early as the
// camera sets off, the plate rises overlapping it, and the camera settles a hair
// before the plate finishes — so each step eases into the next, never snaps.
const ARROW_IN: [number, number] = [0.04, 0.46]
const PLATE_IN: [number, number] = [0.38, 0.82]
const CAM_ARRIVE = 0.72

// Camera zoom (grid px → screen px). Constant across the flow (zoom only on the
// intro/outro) so panning never jumps; just pans plate-to-plate.
const Z_BASE = 2.25
const Z_INTRO = 1.72

const GRID_CENTER: [number, number] = [GRID_W / 2, GRID_H / 2]
// Whole-scene framing also fits the start (col 0) and goal (col COLUMNS+1) discs.
const FRAME_W = GRID_W + 2 * CELL
const FRAME_H = GRID_H + CELL

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Quintic smootherstep — zero 1st & 2nd derivative at both ends (no jerk). */
function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** Map a value through a [lo, hi] window into an eased 0→1. */
const window01 = (u: number, [lo, hi]: [number, number]) => smoother((u - lo) / (hi - lo))

type Zone = 'intro' | 'beat' | 'outro'
function zoneAt(frame: number): { zone: Zone; k: number; u: number } {
  if (frame < INTRO) return { zone: 'intro', k: 0, u: frame / INTRO }
  if (frame >= BEATS_END) return { zone: 'outro', k: M - 1, u: (frame - BEATS_END) / OUTRO_RAMP }
  const f = frame - INTRO
  const k = Math.min(M - 1, Math.floor(f / BEAT))
  return { zone: 'beat', k, u: (f - k * BEAT) / BEAT }
}

/**
 * Continuous `revealedCount` for the whole route. Per beat it grows the single
 * connecting arrow (baseline → cur) and then the step's own plate (cur → cur+1)
 * in two overlapping eased windows — so emergence is pinned to what the lens
 * looks at and flows smoothly. A step's `grow` is `clamp(reveal − index, 0, 1)`.
 */
function flowReveal(frame: number): number {
  if (frame < INTRO) return 0
  if (frame >= BEATS_END) return TOTAL_STEPS
  const { k, u } = zoneAt(frame)
  const cur = CONTENT_IDX[k]
  const baseline = k === 0 ? 0 : CONTENT_IDX[k - 1] + 1
  return baseline + (cur - baseline) * window01(u, ARROW_IN) + window01(u, PLATE_IN)
}

/** The grid-space point the lens centres on — eases between content centres. */
function flowFocus(frame: number): [number, number] {
  if (frame < INTRO) return CONTENT_CENTERS[0]
  if (frame >= BEATS_END) return CONTENT_CENTERS[M - 1]
  const { k, u } = zoneAt(frame)
  const cur = CONTENT_CENTERS[k]
  const prev = k === 0 ? cur : CONTENT_CENTERS[k - 1]
  const t = smoother(u / CAM_ARRIVE)
  return [lerp(prev[0], cur[0], t), lerp(prev[1], cur[1], t)]
}

/** Zoom: ease in on the intro, hold tight across the flow (no per-beat jump). */
function flowZoom(frame: number): number {
  if (frame < INTRO) return lerp(Z_INTRO, Z_BASE, smoother(frame / INTRO))
  return Z_BASE
}

// ── grid (flat neumorphic plates, frame-driven emergence) ──────────────────────

function FlowPlate({ step, dir, grow }: { step: RouteStep; dir: Dir; grow: number }) {
  if (grow <= 0.001) return null // not emerged yet → bare grid where it will appear
  const fp = footprint(step)
  const isSpan = (step.colSpan ?? 1) > 1 || (step.rowSpan ?? 1) > 1
  const g = grow
  const scale = 0.9 + 0.1 * g
  const opacity = clamp01(g * 1.5)
  const plate = elevation(theme, { depth: 'raised', distance: 8 * g, blur: 16 * g, radius: 24 })

  const moduleSpec: ModuleSpec | null = isModuleName(step.module) ? MODULES[step.module] : null
  const iconEl: ReactNode = moduleSpec ? (
    <img
      src={moduleSpec.icon}
      alt={moduleSpec.name}
      width={40}
      height={40}
      style={{ display: 'block', flexShrink: 0, transform: moduleSpec.rotate ? `rotate(${moduleSpec.rotate}deg)` : undefined }}
    />
  ) : isIconName(step.icon) ? (
    <Icon name={step.icon} />
  ) : null

  let content: ReactNode
  if (step.text) content = (<>{iconEl}<Label muted={step.text.muted}>{step.text.main}</Label></>)
  else if (iconEl) content = iconEl
  else content = <Chevron dir={dir} />

  return (
    <div
      style={{
        position: 'absolute',
        left: (fp.c0 - 1) * CELL,
        top: (fp.r0 - 1) * CELL,
        width: (fp.c1 - fp.c0 + 1) * CELL,
        height: (fp.r1 - fp.r0 + 1) * CELL,
      }}
    >
      {/* Merged-cell fill: a spanning step is ONE cell, so paint its whole
          footprint opaque to erase the internal hairline(s) and redraw just the
          outer perimeter — fading in with the plate as the cell forms. */}
      {isSpan ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme.surface,
            boxShadow: `inset 0 0 0 1px ${theme.gridLine}`,
            opacity: clamp01(g * 1.8),
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset: PLATE_INSET,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '0 24px',
          color: theme.textStrong,
          fontFamily: TEXT_FONT,
          fontSize: 20,
          lineHeight: '28px',
          letterSpacing: -0.4,
          whiteSpace: 'nowrap',
          ...plate,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {content}
      </div>
    </div>
  )
}

function FlowNode({ coord, variant }: { coord: Coord; variant: 'start' | 'goal' }) {
  const cx = (coord[0] - 0.5) * CELL
  const cy = (coord[1] - 0.5) * CELL
  const discSize = CELL - PLATE_INSET * 2
  return (
    <div style={{ position: 'absolute', left: cx - CELL / 2, top: cy - CELL / 2, width: CELL, height: CELL }}>
      <div
        style={{
          position: 'absolute',
          inset: PLATE_INSET,
          display: 'grid',
          placeItems: 'center',
          ...elevation(theme, { depth: 'raised', radius: 999 }),
        }}
      >
        {variant === 'goal' ? (
          <div
            style={{
              width: discSize * 0.5,
              height: discSize * 0.5,
              borderRadius: 999,
              background: KIT_BLUE,
              boxShadow: `0 0 ${discSize * 0.25}px ${KIT_BLUE}66`,
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

function FlowGrid({ frame }: { frame: number }) {
  const reveal = flowReveal(frame)
  return (
    <Grid columns={COLUMNS} rows={ROWS} cell={CELL} theme={theme} frame gridlines>
      {ROUTE.map((step, i) => (
        <FlowPlate key={i} step={step} dir={ARROWS[i]} grow={clamp01(reveal - i)} />
      ))}
      <FlowNode coord={START_NODE} variant="start" />
      <FlowNode coord={GOAL_NODE} variant="goal" />
    </Grid>
  )
}

/** Warm the browser cache for the module icons so plates have them on frame 0. */
function useIconPreload() {
  const [handle] = useState(() => delayRender('Preload module icons', { timeoutInMilliseconds: 12000 }))
  useEffect(() => {
    const urls = Array.from(new Set(MODULES_USED.map((m) => MODULES[m].icon)))
    if (urls.length === 0) {
      continueRender(handle)
      return
    }
    let done = 0
    const tick = () => {
      done += 1
      if (done >= urls.length) continueRender(handle)
    }
    for (const url of urls) {
      const img = new Image()
      img.onload = tick
      img.onerror = tick
      img.src = url
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// ── composition ────────────────────────────────────────────────────────────────

export function StoreFlowVideo() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  useIconPreload()

  // Camera: place focus point P at the viewport centre, scaled by Z. On the outro
  // it eases to the whole-scene framing (the full route + goal).
  let P = flowFocus(frame)
  let Z = flowZoom(frame)
  if (frame >= BEATS_END) {
    const t = smoother((frame - BEATS_END) / OUTRO_RAMP)
    const zFit = Math.min((W - 200) / FRAME_W, (H - 200) / FRAME_H)
    P = [lerp(P[0], GRID_CENTER[0], t), lerp(P[1], GRID_CENTER[1], t)]
    Z = lerp(Z_BASE, zFit, t)
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
        <div style={camera}>
          <FlowGrid frame={frame} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
