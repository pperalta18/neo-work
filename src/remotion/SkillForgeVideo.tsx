/**
 * SkillForgeVideo — «Skill Forge».
 * ──────────────────────────────────────────────────────────────────────────
 * Four recipe-step CARDS sit on the row from the start (icon + short label, they do
 * NOT emerge); the elevated head crosses them in a STRAIGHT line and an arrow cell
 * rises between each pair as it passes. One elevation is the **Skill Hub** module
 * (its Rive clip loops as the head reaches it) and the next is a 3-cell pill with
 * three "working" dots. The head rests on the pill, which OPENS like StoreCreate
 * (pill → full frame): the dots magnify with it and clear, and the same four steps
 * **stack into a numbered column** (number + icon + short instruction — not code).
 * The same morph runs in REVERSE, packing the panel back into the pill — now an icon
 * + "Comparador de alquileres". Then the camera ZOOMS OUT and the whole field wakes
 * up: many processes, each turning three dots into a software pill (label typing
 * itself in) — the hub forging skills at scale.
 *
 * Two layers: the flow (storeFlowScene's `FlowPlate` + `GridLines`, under the
 * camera) and a screen-space morph panel pinned to the flow pill's on-screen rect
 * (see {@link skillForgeScript}). Every pixel is a pure function of frame.
 */
import { Fragment, type CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { CELL, PLATE_INSET, TEXT_FONT, elevation } from '@/lib/neumorphism'
import { FlowPlate, GridLines, theme } from './storeFlowScene'
import { Icon, type IconName } from '@/components/icons'
import { RiveClip } from './RiveClip'
import { Fonts } from './fonts'
import {
  CHEVRON_COLS,
  CLOSE_START,
  FORGE_CONVERT_DUR,
  FORGE_PILLS,
  FORGE_STEPS,
  GRID_H,
  GRID_IN,
  GRID_W,
  PILL_COL0,
  PILL_COLSPAN,
  ROW,
  SKILLHUB_COL,
  SKILLHUB_PLAY,
  SKILL_FORGE_DURATION,
  STEP_COL0S,
  STEP_COLSPAN,
  Z_FLOW,
  cameraPZ,
  cellGrow,
  chevronFade,
  clamp01,
  codeOpacity,
  codeProgress,
  contentScale,
  expandAt,
  flowDotsVisible,
  flowLayerOpacity,
  flowLayerScale,
  labelOpacity,
  morphRect,
  morphRelief,
  panelActive,
  panelDotsOpacity,
  pillGrow,
  window01,
} from './skillForgeScript'

export const SKILL_FORGE_DURATION_FRAMES = SKILL_FORGE_DURATION

// Content base sizes (grid-space). On the flow pill the camera scales these by
// Z_FLOW; in the panel they're pre-multiplied by Z_FLOW × contentScale — so the
// dots/label are pixel-identical at the moment the panel hands off to the plate.
const DOT_BASE = 14
const DOTS_GAP = 14
const ICON_BASE = 40
const FONT_BASE = 20
const LABEL_GAP = 12

function Caret({ on, h = 24 }: { on: boolean; h?: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: h * 0.42,
        height: h,
        marginLeft: 2,
        transform: 'translateY(15%)',
        background: theme.textStrong,
        opacity: on ? 0.85 : 0,
        borderRadius: 2,
      }}
    />
  )
}

// ── the three "working" dots (a typing/thinking indicator) ──────────────────────
function WorkingDots({
  dotSize,
  gap,
  color,
  opacity = 1,
}: {
  dotSize: number
  gap: number
  color: string
  opacity?: number
}) {
  const frame = useCurrentFrame()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap, opacity }}>
      {[0, 1, 2].map((i) => {
        const ph = 0.5 + 0.5 * Math.sin(frame / 6 - i * 0.95)
        return (
          <div
            key={i}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              background: color,
              opacity: 0.3 + 0.7 * ph,
              transform: `translateY(${-0.18 * dotSize * ph}px)`,
            }}
          />
        )
      })}
    </div>
  )
}

// ── the hero forged skill: icon + "Comparador de alquileres" ─────────────────────
function ResultLabel({ mult = 1, opacity = 1 }: { mult?: number; opacity?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: LABEL_GAP * mult, opacity, whiteSpace: 'nowrap' }}>
      <Icon name="location" size={ICON_BASE * mult} color={theme.textStrong} />
      <span
        style={{
          fontFamily: TEXT_FONT,
          fontSize: FONT_BASE * mult,
          lineHeight: 1,
          letterSpacing: -0.4,
          color: theme.textStrong,
        }}
      >
        Comparador de alquileres
      </span>
    </div>
  )
}

// ── the four recipe steps, STACKED as ELEVATIONS (raised plates, like grid cards) ─
// Each row is a RAISED neumorphic plate holding number + icon + short label — the
// step lifted off the surface exactly as it sat on the grid. Rows rise into place
// top-to-bottom in fixed slots, so the column stacks without reflow.
const STACK_ROW_H = 120
function StepStack({ progress, opacity }: { progress: number; opacity: number }) {
  // relief tuned to the grid card's on-screen feel (FlowPlate ×Z_FLOW)
  const stepPlate = elevation(theme, { depth: 'raised', distance: 8 * Z_FLOW, blur: 16 * Z_FLOW, radius: 24 * Z_FLOW })
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {FORGE_STEPS.map((s, i) => {
          const local = clamp01(progress * FORGE_STEPS.length - i)
          const appear = clamp01(local / 0.5)
          return (
            <div
              key={i}
              style={{
                width: 600,
                height: STACK_ROW_H,
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: '0 44px',
                opacity: appear,
                transform: `translateY(${(1 - appear) * 20}px)`,
                ...stepPlate,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  fontFamily: TEXT_FONT,
                  fontSize: 34,
                  color: theme.textMuted,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {i + 1}
              </span>
              <Icon name={s.icon} size={44} color={theme.textStrong} />
              <span style={{ fontFamily: TEXT_FONT, fontSize: 36, letterSpacing: -0.4, color: theme.textStrong, whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── a finale pill: working dots that CONVERT into a software label (typed in) ────
function ForgeContent({ convert, label, icon }: { convert: number; label: string; icon: IconName }) {
  const frame = useCurrentFrame()
  const dotsOp = 1 - clamp01(convert / 0.4)
  const typed = clamp01((convert - 0.3) / 0.7)
  const nChars = Math.round(typed * label.length)
  const iconOp = clamp01((convert - 0.3) / 0.25)
  const caretOn = Math.floor(frame / 7) % 2 === 0
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {dotsOp > 0.01 ? (
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', opacity: dotsOp }}>
          <WorkingDots dotSize={12} gap={12} color={theme.textStrong} />
        </div>
      ) : null}
      {convert > 0.28 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <span style={{ opacity: iconOp, display: 'flex' }}>
            <Icon name={icon} size={34} color={theme.textStrong} />
          </span>
          <span style={{ fontFamily: TEXT_FONT, fontSize: 20, letterSpacing: -0.3, color: theme.textStrong }}>
            {label.slice(0, nChars)}
          </span>
          {typed > 0 && typed < 1 ? <Caret on={caretOn} h={22} /> : null}
        </div>
      ) : null}
    </div>
  )
}

export function SkillForgeVideo() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()

  const expand = expandAt(frame)
  const { P, Z: camZ } = cameraPZ(frame)
  const flowZ = camZ * flowLayerScale(expand)
  const camera: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${W / 2 - P[0] * flowZ}px, ${H / 2 - P[1] * flowZ}px) scale(${flowZ})`,
  }
  const gridIn = window01(frame, GRID_IN[0], GRID_IN[1])
  const flowOpacity = clamp01(flowLayerOpacity(expand) * gridIn)
  const chevFade = chevronFade(frame)

  // Panel (screen space)
  const rect = morphRect(expand, W, H)
  const { distance, blur } = morphRelief(expand)
  const panelPlate = elevation(theme, { depth: 'raised', distance, blur, radius: rect.r })
  const cs = contentScale(expand)

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, overflow: 'hidden' }}>
      <Fonts />

      {/* ── the flow + the finale field, under the camera ─────────────────────── */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div style={camera}>
          <div style={{ position: 'relative', width: GRID_W, height: GRID_H, opacity: flowOpacity }}>
            <GridLines />

            {/* the arrows BETWEEN the cards — rise as the head passes, then dissolve
                on zoom-out (the flow drawing itself through the pre-laid recipe) */}
            {CHEVRON_COLS.map((col) => {
              const grow = cellGrow(frame, col)
              if (grow <= 0.001 || chevFade <= 0.001) return null
              return (
                <FlowPlate key={`c${col}`} step={{ at: [col, ROW] }} dir="right" grow={grow} opacityMul={chevFade} />
              )
            })}

            {/* the four recipe-step CARDS — laid out from the start (they do NOT
                emerge), each an icon + short label; dissolve on zoom-out like the arrows */}
            {chevFade > 0.001
              ? STEP_COL0S.map((col0, i) => (
                  <Fragment key={`s${i}`}>
                    {/* merged-cell fill so the 3 cells read as one card */}
                    <div
                      style={{
                        position: 'absolute',
                        left: (col0 - 1) * CELL,
                        top: (ROW - 1) * CELL,
                        width: STEP_COLSPAN * CELL,
                        height: CELL,
                        background: theme.surface,
                        boxShadow: `inset 0 0 0 1px ${theme.gridLine}`,
                        opacity: chevFade,
                      }}
                    />
                    <FlowPlate
                      step={{
                        at: [col0, ROW],
                        colSpan: STEP_COLSPAN,
                        icon: FORGE_STEPS[i].icon,
                        text: { main: FORGE_STEPS[i].label },
                      }}
                      dir="right"
                      grow={1}
                      noSpanFill
                      opacityMul={chevFade}
                    />
                  </Fragment>
                ))
              : null}

            {/* the Skill Hub module — its Rive clip loops once the head reaches it */}
            {cellGrow(frame, SKILLHUB_COL) > 0.001 ? (
              <FlowPlate
                step={{ at: [SKILLHUB_COL, ROW] }}
                dir="right"
                grow={cellGrow(frame, SKILLHUB_COL)}
                iconNode={<RiveClip module="skillHub" size={52} startAt={SKILLHUB_PLAY} loop />}
              />
            ) : null}

            {/* the hero pill's merged-cell fill — always flat under the plate so the
                footprint reads as ONE cell even at the panel hand-off edges */}
            <div
              style={{
                position: 'absolute',
                left: (PILL_COL0 - 1) * CELL,
                top: (ROW - 1) * CELL,
                width: PILL_COLSPAN * CELL,
                height: CELL,
                background: theme.surface,
                boxShadow: `inset 0 0 0 1px ${theme.gridLine}`,
                opacity: clamp01(pillGrow(frame) * 1.8),
              }}
            />

            {/* the hero pill: three working dots before the open… */}
            {flowDotsVisible(frame) ? (
              <FlowPlate
                step={{ at: [PILL_COL0, ROW], colSpan: PILL_COLSPAN }}
                dir="right"
                grow={pillGrow(frame)}
                noSpanFill
                iconNode={<WorkingDots dotSize={DOT_BASE} gap={DOTS_GAP} color={theme.textStrong} />}
              />
            ) : null}

            {/* …and the forged skill once the panel packs back down */}
            {frame >= CLOSE_START ? (
              <FlowPlate
                step={{ at: [PILL_COL0, ROW], colSpan: PILL_COLSPAN }}
                dir="right"
                grow={1}
                noSpanFill
                iconNode={<ResultLabel mult={1} />}
              />
            ) : null}

            {/* the finale field — many processes turning dots into software pills */}
            {FORGE_PILLS.map((p, i) => {
              const born = window01(frame, p.born, p.born + 14)
              if (born <= 0.001) return null
              const convert = clamp01((frame - p.convert) / FORGE_CONVERT_DUR)
              return (
                <FlowPlate
                  key={`f${i}`}
                  step={{ at: p.at, colSpan: PILL_COLSPAN }}
                  dir="right"
                  grow={born}
                  iconNode={<ForgeContent convert={convert} label={p.label} icon={p.icon} />}
                />
              )
            })}
          </div>
        </div>
      </AbsoluteFill>

      {/* ── the morph panel (screen space) — StoreCreate open ↔ close ──────────── */}
      {panelActive(frame) ? (
        <div
          style={{
            position: 'absolute',
            left: rect.left,
            top: rect.top,
            width: rect.w,
            height: rect.h,
            ...panelPlate,
            overflow: 'hidden',
          }}
        >
          {/* the four steps stacking into a numbered column (no dots while it shows) */}
          <StepStack progress={codeProgress(frame)} opacity={codeOpacity(frame)} />

          {/* the magnifying dots (open) → the forged label (close) */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) scale(${cs})`,
              transformOrigin: '50% 50%',
            }}
          >
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              <WorkingDots
                dotSize={DOT_BASE * Z_FLOW}
                gap={DOTS_GAP * Z_FLOW}
                color={theme.textStrong}
                opacity={panelDotsOpacity(frame)}
              />
            </div>
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              <ResultLabel mult={Z_FLOW} opacity={labelOpacity(frame)} />
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  )
}
