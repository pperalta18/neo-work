import type { CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { elevation, KIT_BLUE, TEXT_FONT, lightTheme, type NeoTheme } from '@/lib/neumorphism'
import { CURVE, DUR, ease } from '../motion'
import {
  type ProgramSchedule,
  type ProgramStep,
  PROGRAM_PANEL_RELIEF,
  currentStepNumber,
  doneCount,
  focusIndex,
  progressFill,
} from './programScript'

export type { ProgramStep, ProgramSchedule }

export type ProgramRunnerProps = {
  /** The program, in order. */
  steps: readonly ProgramStep[]
  /** Run schedule from programSchedule() — precomputed so scenes can
   * choreograph against the same activeAt/doneAt frames. */
  schedule: ProgramSchedule
  /** Header label — what the program is. */
  title?: string
  width?: number
  /** Fixed panel height. When the rows overflow it, the list becomes a
   * clipped viewport that scroll-follows the running step (the 50-step
   * stepper). Omit to auto-size to the content. */
  height?: number
  /** Uniform row pitch. Default 64 with details, 44 without. */
  rowHeight?: number
  theme?: NeoTheme
  /** Panel + rows entrance start. Default 0. */
  enterAt?: number
  /** "PASO X/N" header meta. Default true. */
  showCounter?: boolean
  /** Recessed progress track at the foot. Default true. */
  showProgress?: boolean
  /** Draw the raised panel plate. Turn off when a host box draws the relief
   * (e.g. inside Prod03's TileMorph, whose box IS the panel). Default true. */
  plate?: boolean
  /** Local frame override; defaults to useCurrentFrame() (wrap in <Sequence> to offset). */
  frame?: number
  style?: CSSProperties
}

// ── panel chrome geometry (named so the scroll maths stays honest) ──────────
const PAD = 26
const HEADER_H = 30
const HEADER_GAP = 16 + 1 + 16 // paddingBottom + divider + marginBottom
const FOOTER_H = 12
const FOOTER_GAP = 18
const NODE = 30
const RAIL_W = 3

/**
 * ProgramRunner — the "programa" tasklist/stepper, frame-driven end to end.
 * ─────────────────────────────────────────────────────────────────────────
 * Generalises TaskCardVideo (run-through plan, tick draw-in, progress track)
 * and TimelineWidget (numbered nodes on a lit rail) into one kit piece at a
 * parametric tempo: node states pendiente/activo/hecho derive from the
 * schedule, the rail lights up behind the run, and on long programs the list
 * scroll-follows the active step. Themed by prop, deterministic per frame
 * (the active halo pulse and tick draws are functions of the frame — no CSS
 * animation).
 */
export function ProgramRunner({
  steps,
  schedule,
  title = 'Programa',
  width = 560,
  height,
  rowHeight,
  theme = lightTheme,
  enterAt = 0,
  showCounter = true,
  showProgress = true,
  plate = true,
  frame: frameProp,
  style,
}: ProgramRunnerProps) {
  const globalFrame = useCurrentFrame()
  const frame = frameProp ?? globalFrame

  const rowH = rowHeight ?? (steps.some((s) => s.detail) ? 64 : 44)
  const contentH = steps.length * rowH
  const chromeH = PAD * 2 + HEADER_H + HEADER_GAP + (showProgress ? FOOTER_GAP + FOOTER_H : 0)
  const listH = height != null ? height - chromeH : contentH
  const panelH = height ?? contentH + chromeH

  // Scroll-follow: keep the focused step anchored ~35% down the viewport.
  const maxScroll = Math.max(0, contentH - listH)
  const focusY = (focusIndex(schedule, frame) + 0.5) * rowH - listH * 0.35
  const scrollY = Math.min(maxScroll, Math.max(0, focusY))

  const panelIn = ease(frame, enterAt, enterAt + DUR.reveal)
  const card = plate ? elevation(theme, { depth: 'raised', ...PROGRAM_PANEL_RELIEF }) : {}

  const step = currentStepNumber(schedule, frame)

  return (
    <div
      style={{
        width,
        height: panelH,
        boxSizing: 'border-box',
        padding: PAD,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TEXT_FONT,
        color: theme.textStrong,
        ...card,
        opacity: panelIn,
        transform: `translateY(${(1 - panelIn) * 22}px)`,
        ...style,
      }}
    >
      {/* Header: blue mark + title, quiet "PASO X/N" meta on the right. */}
      <div
        style={{
          height: HEADER_H,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          paddingBottom: 16,
          marginBottom: 16,
          borderBottom: `1px solid ${theme.gridLine}`,
          boxSizing: 'content-box',
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: 3, background: KIT_BLUE }} />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.3 }}>{title}</span>
        {showCounter && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 0.6,
              fontVariantNumeric: 'tabular-nums',
              color: theme.textMuted,
            }}
          >
            {`PASO ${Math.max(1, Math.min(step, steps.length))}/${steps.length}`}
          </span>
        )}
      </div>

      {/* The stepper — clipped viewport, scroll-following the run. Rows fade
          at the edges they scroll past, so the crop reads as a window. */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
          ...(maxScroll > 0 && {
            WebkitMaskImage: `linear-gradient(180deg, transparent 0, #000 ${Math.min(1, scrollY / 24) * 22}px, #000 calc(100% - ${Math.min(1, (maxScroll - scrollY) / 24) * 22}px), transparent 100%)`,
            maskImage: `linear-gradient(180deg, transparent 0, #000 ${Math.min(1, scrollY / 24) * 22}px, #000 calc(100% - ${Math.min(1, (maxScroll - scrollY) / 24) * 22}px), transparent 100%)`,
          }),
        }}
      >
        <div style={{ transform: `translateY(${-scrollY}px)` }}>
          {steps.map((s, i) => (
            <Row
              key={i}
              frame={frame}
              theme={theme}
              step={s}
              i={i}
              rowH={rowH}
              last={i === steps.length - 1}
              activeAt={schedule.activeAt[i]}
              doneAt={schedule.doneAt[i]}
              enterAt={enterAt}
            />
          ))}
        </div>
      </div>

      {showProgress && (
        <Progress frame={frame} theme={theme} schedule={schedule} enterAt={enterAt} />
      )}
    </div>
  )
}

/** One step: node + rail segment on the left, title/detail on the right. */
function Row({
  frame,
  theme,
  step,
  i,
  rowH,
  last,
  activeAt,
  doneAt,
  enterAt,
}: {
  frame: number
  theme: NeoTheme
  step: ProgramStep
  i: number
  rowH: number
  last: boolean
  activeAt: number
  doneAt: number
  enterAt: number
}) {
  // Rows cascade in with the panel; far rows are simply already there.
  const riseAt = enterAt + 4 + Math.min(i, 8) * 3
  const rise = ease(frame, riseAt, riseAt + DUR.base)

  const toActive = ease(frame, activeAt, activeAt + 5)
  const toDone = ease(frame, doneAt, doneAt + 6)
  const activeNow = toActive * (1 - toDone)
  // The rail behind a settled step lights up as the run moves on.
  const litRail = ease(frame, doneAt, doneAt + 8, CURVE.standard)

  const compact = rowH < 52

  return (
    <div
      style={{
        height: rowH,
        display: 'flex',
        gap: 16,
        opacity: rise,
        transform: `translateY(${(1 - rise) * 12}px)`,
      }}
    >
      {/* Rail column: node + the segment reaching the next node. */}
      <div style={{ position: 'relative', width: NODE, flexShrink: 0 }}>
        {!last && (
          <>
            <span
              style={{
                position: 'absolute',
                left: (NODE - RAIL_W) / 2,
                top: NODE + 2,
                bottom: 2,
                width: RAIL_W,
                borderRadius: 2,
                background: theme.gridLine,
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: (NODE - RAIL_W) / 2,
                top: NODE + 2,
                height: `calc(${litRail} * (100% - ${NODE + 4}px))`,
                width: RAIL_W,
                borderRadius: 2,
                background: KIT_BLUE,
              }}
            />
          </>
        )}
        <Node frame={frame} theme={theme} i={i} toActive={toActive} toDone={toDone} doneAt={doneAt} />
      </div>

      {/* Title + optional detail; the active step reads strongest. */}
      <div style={{ minWidth: 0, paddingTop: compact ? 4 : 2 }}>
        <div
          style={{
            fontSize: compact ? 15 : 16.5,
            lineHeight: '22px',
            letterSpacing: -0.2,
            fontWeight: 500 + Math.round(activeNow) * 100,
            color: frame >= activeAt ? theme.textStrong : theme.textMuted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {step.title}
        </div>
        {step.detail && !compact && (
          <div
            style={{
              marginTop: 2,
              fontSize: 13,
              lineHeight: '18px',
              color: theme.textMuted,
              opacity: 0.55 + 0.45 * activeNow,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {step.detail}
          </div>
        )}
      </div>
    </div>
  )
}

/** The node: hollow numbered dot → blue ring with pulsing halo → filled
 * blue circle with a tick drawing in. All three crossfaded by the frame. */
function Node({
  frame,
  theme,
  i,
  toActive,
  toDone,
  doneAt,
}: {
  frame: number
  theme: NeoTheme
  i: number
  toActive: number
  toDone: number
  doneAt: number
}) {
  const well = elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: NODE })
  const tickDraw = ease(frame, doneAt + 1, doneAt + 9)
  // Frame-driven halo breath (the deterministic port of the CSS glow pulse).
  const halo = 0.45 + 0.3 * Math.sin((frame / 30) * Math.PI * 2 * 0.45)
  const num = (
    <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
  )

  return (
    <div style={{ position: 'relative', width: NODE, height: NODE }}>
      {/* pendiente — hollow muted dot, number inside */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          boxSizing: 'border-box',
          border: `2px solid ${theme.gridLine}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.textMuted,
          opacity: 1 - toActive,
          ...well,
        }}
      >
        {num}
      </div>
      {/* activo — blue ring, soft breathing halo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          boxSizing: 'border-box',
          border: `2.5px solid ${KIT_BLUE}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: KIT_BLUE,
          opacity: toActive * (1 - toDone),
          boxShadow: `0 0 0 ${4 * toActive}px ${KIT_BLUE}${Math.round(halo * 40).toString(16).padStart(2, '0')}`,
          ...well,
        }}
      >
        {num}
      </div>
      {/* hecho — filled blue circle, tick drawing in */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: KIT_BLUE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: toDone,
          transform: `scale(${0.8 + 0.2 * toDone})`,
          boxShadow: `0 2px 7px ${theme.shadow}`,
        }}
      >
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12.5 10 17.5 19 7"
            stroke="#fff"
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - tickDraw}
          />
        </svg>
      </div>
    </div>
  )
}

/** Recessed track filling step by settled step, with a tabular counter. */
function Progress({
  frame,
  theme,
  schedule,
  enterAt,
}: {
  frame: number
  theme: NeoTheme
  schedule: ProgramSchedule
  enterAt: number
}) {
  const fill = progressFill(schedule, frame)
  const track = elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: 5 })
  const rise = ease(frame, enterAt + 10, enterAt + 10 + DUR.base)

  return (
    <div
      style={{
        marginTop: FOOTER_GAP,
        height: FOOTER_H,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        opacity: rise,
      }}
    >
      <div style={{ flex: 1, height: 9, ...track }}>
        <div
          style={{
            width: `${fill * 100}%`,
            height: '100%',
            borderRadius: 5,
            background: `linear-gradient(90deg, ${KIT_BLUE}cc, ${KIT_BLUE})`,
            boxShadow: fill > 0 ? `0 1px 6px ${KIT_BLUE}40` : 'none',
          }}
        />
      </div>
      <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: theme.textMuted }}>
        {doneCount(schedule, frame)}/{schedule.count}
      </span>
    </div>
  )
}
