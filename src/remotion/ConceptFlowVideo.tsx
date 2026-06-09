/**
 * ConceptFlowVideo — a concept's reasoning chain, read as a 2D pathfinding flow.
 * ──────────────────────────────────────────────────────────────────────────────
 * Generalised from the original StoreFlow. Give it a concept id from
 * `src/content/concepts.ts` and it narrates that route over the flat neumorphic
 * grid ([Grid & Cells] + [Emergence]) with NO captions — just the animation.
 *
 * A virtual "camera" (a CSS pan + zoom transform on the grid) sits tight on one
 * pastilla, glides to where the next step appears, and that plate **emerges**
 * (flat → raised: shadow grows, scales up, fades in) as the lens arrives. Step by
 * step the AI builds the result, ending on a slow pull-back over the whole route
 * + the blue goal.
 *
 * Smooth by construction: a single quintic `smoother` eases the camera pan and
 * every emergence, with the connecting arrow and the next plate rising in an
 * overlapping window so steps flow into one another instead of snapping. Merged
 * cells match the 2D grid rule (one cell + single perimeter border). Everything
 * is derived purely from `useCurrentFrame()` (no CSS transitions, wall-clock).
 *
 * Build a thin wrapper per concept (see StoreFlowVideo / AccountingFlowVideo):
 * compute its duration with `flowDuration(id)` and render `<ConceptFlowVideo>`.
 */

import { useState, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
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

// ── timeline constants (30 fps) ─────────────────────────────────────────────────
const INTRO = 22 // brief push-in on the start of the route
const BEAT = 52 // one step (calm, so motion never snaps)
const OUTRO = 84 // slow pull-back to the whole route + goal
const OUTRO_RAMP = 60
// Teaser mode (one step → whole grid) is more conceptual, so its pull-back is
// snappier — it frees time for the surrounding acts. The pull-back ANIMATION is
// `TEASER_OUTRO_RAMP` frames; the remainder (`TEASER_OUTRO − ramp`) is a static
// HOLD on the whole-grid photo so the global shape is legible before the cut.
// Hold widened 6 → 28 f (~0.93 s): the bare 6 f read too short on the landing.
// Shared by all five teaser flows (Email/Ecommerce/Accounting/Support/Scheduling).
const TEASER_OUTRO = 74
const TEASER_OUTRO_RAMP = 46

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

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Quintic smootherstep — zero 1st & 2nd derivative at both ends (no jerk). */
function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** Map a value through a [lo, hi] window into an eased 0→1. */
const window01 = (u: number, [lo, hi]: [number, number]) => smoother((u - lo) / (hi - lo))

const hasContent = (s: RouteStep) => Boolean(s.text || s.image || s.icon || s.module)

// ── per-concept geometry + timeline ────────────────────────────────────────────

type Flow = {
  route: RouteStep[]
  columns: number
  rows: number
  gridW: number
  gridH: number
  startNode: Coord
  goalNode: Coord
  arrows: Dir[]
  centers: Array<[number, number]>
  contentIdx: number[]
  contentCenters: Array<[number, number]>
  totalSteps: number
  /** number of meaningful steps (the "pasos") */
  m: number
  /** how many of those steps the camera actually beats through (teaser ≤ m) */
  beats: number
  /** outro length + ease ramp (shorter in teaser mode) */
  outro: number
  outroRamp: number
  modulesUsed: ModuleName[]
  beatsEnd: number
  durationInFrames: number
  gridCenter: [number, number]
  frameW: number
  frameH: number
}

/** Pixel centre of a (reflowed) step's footprint, in grid space. */
function stepCenterPx(step: RouteStep): [number, number] {
  const fp = footprint(step)
  return [((fp.c0 + fp.c1 - 1) / 2) * CELL, ((fp.r0 + fp.r1 - 1) / 2) * CELL]
}

/**
 * Compute everything a concept's flow needs (geometry + timeline), purely.
 * `teaserBeats` caps how many steps the camera walks before pulling back to the
 * whole grid (the rest of the route then emerges during the outro). Omit it to
 * walk every step.
 */
export function buildFlow(conceptId: string, teaserBeats?: number): Flow {
  const concept = CONCEPTS.find((c) => c.id === conceptId)
  if (!concept) throw new Error(`ConceptFlowVideo: concept "${conceptId}" not found`)
  const spec = concept.spec

  const route = reflowRoute(spec.route)
  const columns = Math.max(spec.columns, ...route.map((s) => footprint(s).c1))
  const rows = Math.max(spec.rows, ...route.map((s) => footprint(s).r1))
  const gridW = columns * CELL
  const gridH = rows * CELL
  const startNode: Coord = spec.startNode ?? [0, route[0]?.at[1] ?? 1]
  const goalNode: Coord = [columns + 1, 1]
  const arrows = routeArrows(route, goalNode)

  const centers = route.map(stepCenterPx)
  const contentIdx = route.map((s, i) => (hasContent(s) ? i : -1)).filter((i) => i >= 0)
  const contentCenters = contentIdx.map((i) => centers[i])
  const totalSteps = route.length
  const m = contentIdx.length
  const beats = teaserBeats != null ? Math.max(1, Math.min(teaserBeats, m)) : m
  const isTeaser = beats < m
  const outro = isTeaser ? TEASER_OUTRO : OUTRO
  const outroRamp = isTeaser ? TEASER_OUTRO_RAMP : OUTRO_RAMP

  const modulesUsed = Array.from(
    new Set(route.map((s) => s.module).filter((mod): mod is ModuleName => isModuleName(mod))),
  )

  const beatsEnd = INTRO + beats * BEAT
  const durationInFrames = beatsEnd + outro

  return {
    route,
    columns,
    rows,
    gridW,
    gridH,
    startNode,
    goalNode,
    arrows,
    centers,
    contentIdx,
    contentCenters,
    totalSteps,
    m,
    beats,
    outro,
    outroRamp,
    modulesUsed,
    beatsEnd,
    durationInFrames,
    gridCenter: [gridW / 2, gridH / 2],
    // Whole-scene framing also fits the start (col 0) and goal (col cols+1) discs.
    frameW: gridW + 2 * CELL,
    frameH: gridH + CELL,
  }
}

/** Composition duration (frames) for a concept's flow (optionally a teaser). */
export const flowDuration = (conceptId: string, teaserBeats?: number) =>
  buildFlow(conceptId, teaserBeats).durationInFrames

// ── camera / reveal (all derived from frame + flow) ─────────────────────────────

type Zone = 'intro' | 'beat' | 'outro'
function zoneAt(flow: Flow, frame: number): { zone: Zone; k: number; u: number } {
  if (frame < INTRO) return { zone: 'intro', k: 0, u: frame / INTRO }
  if (frame >= flow.beatsEnd) return { zone: 'outro', k: flow.beats - 1, u: (frame - flow.beatsEnd) / flow.outroRamp }
  const f = frame - INTRO
  const k = Math.min(flow.beats - 1, Math.floor(f / BEAT))
  return { zone: 'beat', k, u: (f - k * BEAT) / BEAT }
}

/**
 * Continuous `revealedCount` for the whole route. Per beat it grows the single
 * connecting arrow (baseline → cur) and then the step's own plate (cur → cur+1)
 * in two overlapping eased windows — so emergence is pinned to what the lens
 * looks at and flows smoothly.
 */
function flowReveal(flow: Flow, frame: number): number {
  if (frame < INTRO) return 0
  if (frame >= flow.beatsEnd) {
    // On the pull-back, ramp from whatever the teaser showed up to the whole
    // route — so the rest of the path "fills in" as the global photo appears.
    // For a full walk (beats === m) the start already ≈ totalSteps → a no-op.
    const t = smoother(clamp01((frame - flow.beatsEnd) / flow.outroRamp))
    const start = flow.contentIdx[flow.beats - 1] + 1
    return lerp(start, flow.totalSteps, t)
  }
  const { k, u } = zoneAt(flow, frame)
  const cur = flow.contentIdx[k]
  const baseline = k === 0 ? 0 : flow.contentIdx[k - 1] + 1
  return baseline + (cur - baseline) * window01(u, ARROW_IN) + window01(u, PLATE_IN)
}

/** The grid-space point the lens centres on — eases between content centres. */
function flowFocus(flow: Flow, frame: number): [number, number] {
  if (frame < INTRO) return flow.contentCenters[0]
  if (frame >= flow.beatsEnd) return flow.contentCenters[flow.beats - 1]
  const { k, u } = zoneAt(flow, frame)
  const cur = flow.contentCenters[k]
  const prev = k === 0 ? cur : flow.contentCenters[k - 1]
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

  // Icon entrance: a quick "pop" (scale-up with a touch of overshoot + a small
  // spin-in + fade), driven by the plate's own emergence `g`. Because plates
  // emerge in route order, the icons pop in order — never all at once.
  const ig = smoother(clamp01((g - 0.2) / 0.8))
  const iconPop = 0.45 + 0.55 * ig + Math.sin(clamp01(ig) * Math.PI) * 0.14
  const iconOpacity = clamp01(ig * 1.5)
  const baseRot = moduleSpec?.rotate ?? 0
  const iconSpin = (1 - ig) * -8

  const iconEl: ReactNode = moduleSpec ? (
    <img
      src={moduleSpec.icon}
      alt={moduleSpec.name}
      width={40}
      height={40}
      style={{
        display: 'block',
        flexShrink: 0,
        transform: `rotate(${baseRot + iconSpin}deg) scale(${iconPop})`,
        opacity: iconOpacity,
      }}
    />
  ) : isIconName(step.icon) ? (
    <span style={{ display: 'inline-flex', transform: `rotate(${iconSpin}deg) scale(${iconPop})`, opacity: iconOpacity }}>
      <Icon name={step.icon} size={36} color={KIT_BLUE} strokeWidth={2} />
    </span>
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

function FlowGrid({ flow, frame }: { flow: Flow; frame: number }) {
  const reveal = flowReveal(flow, frame)
  return (
    <Grid columns={flow.columns} rows={flow.rows} cell={CELL} theme={theme} frame gridlines>
      {flow.route.map((step, i) => (
        <FlowPlate key={i} step={step} dir={flow.arrows[i]} grow={clamp01(reveal - i)} />
      ))}
      <FlowNode coord={flow.startNode} variant="start" />
      <FlowNode coord={flow.goalNode} variant="goal" />
    </Grid>
  )
}

/** Warm the browser cache for the module icons so plates have them on frame 0. */
function useIconPreload(modulesUsed: ModuleName[]) {
  const [handle] = useState(() => delayRender('Preload module icons', { timeoutInMilliseconds: 12000 }))
  useEffect(() => {
    const urls = Array.from(new Set(modulesUsed.map((m) => MODULES[m].icon)))
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

export function ConceptFlowVideo({
  conceptId,
  teaserBeats,
}: {
  conceptId: string
  /** Walk only this many steps, then pull back to the whole grid. */
  teaserBeats?: number
}) {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  const flow = useMemo(() => buildFlow(conceptId, teaserBeats), [conceptId, teaserBeats])
  useIconPreload(flow.modulesUsed)

  // Camera: place focus point P at the viewport centre, scaled by Z. On the outro
  // it eases to the whole-scene framing (the full route + goal).
  let P = flowFocus(flow, frame)
  let Z = flowZoom(frame)
  if (frame >= flow.beatsEnd) {
    const t = smoother((frame - flow.beatsEnd) / flow.outroRamp)
    const zFit = Math.min((W - 200) / flow.frameW, (H - 200) / flow.frameH)
    P = [lerp(P[0], flow.gridCenter[0], t), lerp(P[1], flow.gridCenter[1], t)]
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
          <FlowGrid flow={flow} frame={frame} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
