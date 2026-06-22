/**
 * storeFlowScene — shared geometry, frame-driven flow math, and plate/grid
 * renderers for the "tienda online" pathfinding flow.
 * ──────────────────────────────────────────────────────────────────────────
 * Extracted verbatim from StoreFlowVideo so multiple compositions can replay
 * the EXACT same flow (camera pan + plate emergence) and then branch into their
 * own epilogues. `StoreFlowVideo` is the plain flow; `StoreUnfoldVideo` runs the
 * flow and then unrolls the elevated plates into a line. Keep this the single
 * source of truth — do not fork the math.
 */

import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import { continueRender, delayRender } from 'remotion'
import { CELL, PLATE_INSET, KIT_BLUE, TEXT_FONT, elevation, lightTheme, type NeoTheme } from '@/lib/neumorphism'
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

export const theme = lightTheme

// ── source route + geometry (reused from the pathfinding layer) ────────────────

const STORE = CONCEPTS.find((c) => c.id === 'tienda-online')
if (!STORE) throw new Error('storeFlowScene: concept "tienda-online" not found')
const SPEC = STORE.spec

export const ROUTE = reflowRoute(SPEC.route)
export const COLUMNS = Math.max(SPEC.columns, ...ROUTE.map((s) => footprint(s).c1))
export const ROWS = Math.max(SPEC.rows, ...ROUTE.map((s) => footprint(s).r1))
export const GRID_W = COLUMNS * CELL
export const GRID_H = ROWS * CELL
export const START_NODE: Coord = SPEC.startNode ?? [0, ROUTE[0]?.at[1] ?? 1]
export const GOAL_NODE: Coord = [COLUMNS + 1, 1]
export const ARROWS = routeArrows(ROUTE, GOAL_NODE)

export const hasContent = (s: RouteStep) => Boolean(s.text || s.image || s.icon || s.module)

/** Pixel centre of a (reflowed) step's footprint, in grid space. */
function stepCenterPx(step: RouteStep): [number, number] {
  const fp = footprint(step)
  return [((fp.c0 + fp.c1 - 1) / 2) * CELL, ((fp.r0 + fp.r1 - 1) / 2) * CELL]
}

export const CENTERS = ROUTE.map(stepCenterPx)
export const CONTENT_IDX = ROUTE.map((s, i) => (hasContent(s) ? i : -1)).filter((i) => i >= 0)
export const CONTENT_CENTERS = CONTENT_IDX.map((i) => CENTERS[i])
export const TOTAL_STEPS = ROUTE.length
export const M = CONTENT_IDX.length // number of meaningful steps (the "pasos")

export const MODULES_USED = Array.from(
  new Set(ROUTE.map((s) => s.module).filter((m): m is ModuleName => isModuleName(m))),
)

// ── timeline (30 fps) ─────────────────────────────────────────────────────────

export const INTRO = 22 // brief push-in on the start of the route
export const BEAT = 52 // one step (calm, so motion never snaps)
export const OUTRO = 84 // slow pull-back to the whole route + goal
export const OUTRO_RAMP = 60

export const BEATS_END = INTRO + M * BEAT
/** Total composition length in frames for the plain flow. */
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

export const GRID_CENTER: [number, number] = [GRID_W / 2, GRID_H / 2]
// Whole-scene framing also fits the start (col 0) and goal (col COLUMNS+1) discs.
export const FRAME_W = GRID_W + 2 * CELL
export const FRAME_H = GRID_H + CELL

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Quintic smootherstep — zero 1st & 2nd derivative at both ends (no jerk). */
export function smoother(x: number): number {
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
export function flowReveal(frame: number): number {
  if (frame < INTRO) return 0
  if (frame >= BEATS_END) return TOTAL_STEPS
  const { k, u } = zoneAt(frame)
  const cur = CONTENT_IDX[k]
  const baseline = k === 0 ? 0 : CONTENT_IDX[k - 1] + 1
  return baseline + (cur - baseline) * window01(u, ARROW_IN) + window01(u, PLATE_IN)
}

/** The grid-space point the lens centres on — eases between content centres. */
export function flowFocus(frame: number): [number, number] {
  if (frame < INTRO) return CONTENT_CENTERS[0]
  if (frame >= BEATS_END) return CONTENT_CENTERS[M - 1]
  const { k, u } = zoneAt(frame)
  const cur = CONTENT_CENTERS[k]
  const prev = k === 0 ? cur : CONTENT_CENTERS[k - 1]
  const t = smoother(u / CAM_ARRIVE)
  return [lerp(prev[0], cur[0], t), lerp(prev[1], cur[1], t)]
}

/** Zoom: ease in on the intro, hold tight across the flow (no per-beat jump). */
export function flowZoom(frame: number): number {
  if (frame < INTRO) return lerp(Z_INTRO, Z_BASE, smoother(frame / INTRO))
  return Z_BASE
}

/** The whole-scene "fit" zoom the outro settles on (grid + start + goal discs). */
export function gridFitZoom(W: number, H: number): number {
  return Math.min((W - 200) / FRAME_W, (H - 200) / FRAME_H)
}

/** Camera centre P and zoom Z for the plain flow at `frame` (intro → outro fit). */
export function flowCameraPZ(frame: number, W: number, H: number): { P: [number, number]; Z: number } {
  let P = flowFocus(frame)
  let Z = flowZoom(frame)
  if (frame >= BEATS_END) {
    const t = smoother((frame - BEATS_END) / OUTRO_RAMP)
    const zFit = gridFitZoom(W, H)
    P = [lerp(P[0], GRID_CENTER[0], t), lerp(P[1], GRID_CENTER[1], t)]
    Z = lerp(Z_BASE, zFit, t)
  }
  return { P, Z }
}

// ── grid (flat neumorphic plates, frame-driven emergence) ──────────────────────

/**
 * A single route plate. By default it positions itself on its grid footprint;
 * pass `left`/`top` to float it elsewhere in grid space (used by the unroll
 * epilogue, where the elevated plates leave the grid and line up). `noSpanFill`
 * drops the merged-cell hairline eraser — pointless once the gridlines are gone.
 */
export function FlowPlate({
  step,
  dir,
  grow,
  left,
  top,
  noSpanFill = false,
  scaleMul = 1,
  opacityMul = 1,
  iconNode,
  surfaceTheme,
}: {
  step: RouteStep
  dir: Dir
  grow: number
  left?: number
  top?: number
  noSpanFill?: boolean
  /** Extra scale on the plate (1 = none) — lets an epilogue shrink it on top of emergence. */
  scaleMul?: number
  /** Extra opacity on the plate (1 = none) — lets an epilogue fade it out. */
  opacityMul?: number
  /** Override the icon content (e.g. a frame-driven RiveClip instead of the static SVG). */
  iconNode?: ReactNode
  /** Override the plate's theme (surface / relief / text). Defaults to the module theme. */
  surfaceTheme?: NeoTheme
}) {
  if (grow <= 0.001) return null // not emerged yet → bare grid where it will appear
  const th = surfaceTheme ?? theme
  const fp = footprint(step)
  const isSpan = (step.colSpan ?? 1) > 1 || (step.rowSpan ?? 1) > 1
  const g = grow
  const scale = (0.9 + 0.1 * g) * scaleMul
  const opacity = clamp01(g * 1.5) * opacityMul
  const plate = elevation(th, { depth: 'raised', distance: 8 * g, blur: 16 * g, radius: 24 })

  const moduleSpec: ModuleSpec | null = isModuleName(step.module) ? MODULES[step.module] : null
  const iconEl: ReactNode = iconNode ?? (moduleSpec ? (
    <img
      src={moduleSpec.icon}
      alt={moduleSpec.name}
      width={40}
      height={40}
      style={{ display: 'block', flexShrink: 0, transform: moduleSpec.rotate ? `rotate(${moduleSpec.rotate}deg)` : undefined }}
    />
  ) : isIconName(step.icon) ? (
    <Icon name={step.icon} />
  ) : null)

  let content: ReactNode
  if (step.text) content = (<>{iconEl}<Label muted={step.text.muted}>{step.text.main}</Label></>)
  else if (iconEl) content = iconEl
  else content = <Chevron dir={dir} />

  return (
    <div
      style={{
        position: 'absolute',
        left: left ?? (fp.c0 - 1) * CELL,
        top: top ?? (fp.r0 - 1) * CELL,
        width: (fp.c1 - fp.c0 + 1) * CELL,
        height: (fp.r1 - fp.r0 + 1) * CELL,
      }}
    >
      {/* Merged-cell fill: a spanning step is ONE cell, so paint its whole
          footprint opaque to erase the internal hairline(s) and redraw just the
          outer perimeter — fading in with the plate as the cell forms. */}
      {isSpan && !noSpanFill ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: th.surface,
            boxShadow: `inset 0 0 0 1px ${th.gridLine}`,
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
          color: th.textStrong,
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

export function FlowNode({
  coord,
  variant,
  grow = 1,
}: {
  coord: Coord
  variant: 'start' | 'goal'
  /** Emergence 0→1 (presses up out of the surface). 1 = fully formed (the default). */
  grow?: number
}) {
  if (grow <= 0.001) return null
  const g = grow
  const cx = (coord[0] - 0.5) * CELL
  const cy = (coord[1] - 0.5) * CELL
  const discSize = CELL - PLATE_INSET * 2
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - CELL / 2,
        top: cy - CELL / 2,
        width: CELL,
        height: CELL,
        opacity: clamp01(g * 1.5),
        transform: `scale(${0.9 + 0.1 * g})`,
        transformOrigin: '50% 50%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: PLATE_INSET,
          display: 'grid',
          placeItems: 'center',
          ...elevation(theme, { depth: 'raised', distance: 8 * g, blur: 16 * g, radius: 999 }),
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

/** The faint hairline grid, sized to the route's grid — matches `<Grid gridlines>`. */
export function GridLines({ style }: { style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: `linear-gradient(to right, ${theme.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${theme.gridLine} 1px, transparent 1px)`,
        backgroundSize: `${CELL}px ${CELL}px`,
        ...style,
      }}
    />
  )
}

export function FlowGrid({ frame }: { frame: number }) {
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
export function useIconPreload() {
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
