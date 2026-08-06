/**
 * LowerThirdCellsVideo — speaker nameplate built from ELEVATION CELLS.
 * ──────────────────────────────────────────────────────────────────────────
 * SkillForge / StoreFlow pill language in DARK mode, no background grid: small,
 * elegant cells that rise on transparent (alpha), lower-left —
 *   [ icon · Pablo Yusta ]   ›   [ icon · Founder of AiKit ]
 *
 * Motion craft: spring overshoot + focus-in blur on each plate, content fills a
 * beat later, the chevron nudges in the flow direction, out = blur + scale + fade.
 *
 * One component, many speakers: each is a <Composition> in Root.tsx with its own
 * defaultProps. Render ProRes 4444 (alpha). See the render:lt-* scripts.
 *
 * All easing/timing lives in `lowerThirdCellsScript` — this is a thin renderer.
 */

import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { TEXT_FONT, elevation, darkTheme } from '@/lib/neumorphism'
import { Icon, type IconName } from '@/components/icons'
import { Fonts } from './fonts'
import {
  MARGIN_X,
  MARGIN_BOTTOM,
  PILL_H,
  GAP,
  STARTS,
  clamp01,
  lerp,
  cellRise,
  cellSettle,
  cellBlur,
  contentIn,
  arrowNudge,
  globalOut,
  outProg,
  DURATION,
} from './lowerThirdCellsScript'

export type LowerThirdCellsProps = {
  name: string
  role: string
  nameIcon: IconName
  roleIcon: IconName
}

export const LOWER_THIRD_CELLS_DEFAULTS: LowerThirdCellsProps = {
  name: 'Miguel Martín',
  role: 'CEO of AiKit',
  nameIcon: 'user',
  roleIcon: 'star',
}

export const LOWER_THIRD_CELLS_DURATION = DURATION

const th = darkTheme
const BLUR_IN = 7 // px of focus-in blur on each plate

/** A right chevron, dependency-free (outside a <Grid> context). */
function RightChevron({ size = 22, color }: { size?: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: 'rotate(-90deg)' }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** One elevation cell. The plate springs up + un-blurs; `contentReveal` slides
 *  its content in a beat later (the pill fills). `contentDX` nudges the content. */
function Cell({
  frame,
  start,
  children,
  square = false,
  padX = 28,
  contentDX = 0,
}: {
  frame: number
  start: number
  children: ReactNode
  square?: boolean
  padX?: number
  contentDX?: number
}) {
  const rise = cellRise(frame, start)
  const settle = cellSettle(frame, start)
  const blur = cellBlur(frame, start) * BLUR_IN
  const cReveal = contentIn(frame, start)

  const plate = elevation(th, { depth: 'raised', distance: 6 * settle, blur: 14 * settle, radius: 18 })
  const style: CSSProperties = {
    height: PILL_H,
    minWidth: square ? PILL_H : undefined,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
    padding: square ? 0 : `0 ${padX}px`,
    opacity: clamp01(settle * 1.3),
    transform: `translateY(${(1 - rise) * 14}px) scale(${lerp(0.92, 1, rise)})`,
    transformOrigin: 'center bottom',
    filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
    ...plate,
    boxShadow: `${plate.boxShadow}, 0 16px 34px -14px rgba(0,0,0,${0.5 * settle})`,
  }
  return (
    <div style={style}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          opacity: cReveal,
          transform: `translateX(${(1 - cReveal) * -6 + contentDX}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function LowerThirdCellsVideo({ name, role, nameIcon, roleIcon }: LowerThirdCellsProps) {
  const frame = useCurrentFrame()
  const out = globalOut(frame)
  const op = outProg(frame)

  return (
    <AbsoluteFill>
      <Fonts />
      <div
        style={{
          position: 'absolute',
          left: MARGIN_X,
          bottom: MARGIN_BOTTOM,
          display: 'flex',
          alignItems: 'center',
          gap: GAP,
          opacity: out,
          transform: `translateY(${op * 10}px) scale(${1 - op * 0.02})`,
          transformOrigin: 'left bottom',
          filter: op > 0.01 ? `blur(${op * 5}px)` : undefined,
        }}
      >
        {/* Name cell — the big one. */}
        <Cell frame={frame} start={STARTS[0]} padX={30}>
          <Icon name={nameIcon} size={25} color={th.textStrong} strokeWidth={1.8} />
          <span
            style={{
              fontFamily: TEXT_FONT,
              fontWeight: 400,
              fontSize: 26,
              letterSpacing: -0.3,
              color: th.textStrong,
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
        </Cell>

        {/* Arrow cell — chevron nudges in the flow direction. */}
        <Cell frame={frame} start={STARTS[1]} square contentDX={arrowNudge(frame)}>
          <RightChevron size={22} color={th.textMuted} />
        </Cell>

        {/* Title (role) cell. */}
        <Cell frame={frame} start={STARTS[2]} padX={26}>
          <Icon name={roleIcon} size={22} color={th.textStrong} strokeWidth={1.8} />
          <span
            style={{
              fontFamily: TEXT_FONT,
              fontWeight: 400,
              fontSize: 20,
              letterSpacing: -0.1,
              color: th.textStrong,
              whiteSpace: 'nowrap',
            }}
          >
            {role}
          </span>
        </Cell>
      </div>
    </AbsoluteFill>
  )
}
