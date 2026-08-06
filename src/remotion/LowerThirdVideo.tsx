/**
 * LowerThirdVideo — speaker nameplate ("letrero de ponente").
 * ──────────────────────────────────────────────────────────────────────────
 * Apple/Google motion-design voice: type IS the design. No card, no grid. A
 * hairline blue kicker wipes in, then the name + role RISE into view from behind
 * an invisible baseline (masked), staggered, quint-out. Light type + a soft
 * shadow carry legibility over the speaker's footage.
 *
 * Transparent on purpose — render ProRes 4444 (alpha) and the editor drops it
 * over the speaker's video:  npm run render:lowerthird
 * Re-skin per speaker via `name` / `role` (defaultProps / Studio props / --props).
 *
 * All easing/timing lives in `lowerThirdScript` — this is a thin renderer.
 */

import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { KIT_BLUE, DISPLAY_FONT, TEXT_FONT } from '@/lib/neumorphism'
import { Fonts } from './fonts'
import {
  MARGIN_X,
  MARGIN_BOTTOM,
  clamp01,
  kickReveal,
  nameRise,
  nameFade,
  roleRise,
  roleFade,
  globalOut,
  outProg,
  DURATION,
} from './lowerThirdScript'

export type LowerThirdProps = {
  name: string
  role: string
}

export const LOWER_THIRD_DEFAULTS: LowerThirdProps = {
  name: 'Miguel Martín',
  role: 'CEO de AiKit',
}

export const LOWER_THIRD_DURATION = DURATION

const NAME_COLOR = '#f7f8fb'
const ROLE_COLOR = 'rgba(247, 248, 251, 0.72)'
// Soft shadow lifts light type off any footage without a visible box.
const NAME_SHADOW = '0 2px 30px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.45)'
const ROLE_SHADOW = '0 1px 18px rgba(0, 0, 0, 0.5)'

export function LowerThirdVideo({ name, role }: LowerThirdProps) {
  const frame = useCurrentFrame()
  const kick = kickReveal(frame)
  const nR = nameRise(frame)
  const nF = nameFade(frame)
  const rR = roleRise(frame)
  const rF = roleFade(frame)
  const out = globalOut(frame)
  const drift = outProg(frame) * 12

  return (
    <AbsoluteFill>
      <Fonts />
      <div
        style={{
          position: 'absolute',
          left: MARGIN_X,
          bottom: MARGIN_BOTTOM,
          opacity: out,
          transform: `translateY(${drift}px)`,
        }}
      >
        {/* Blue kicker rule — the single brand accent. */}
        <div
          style={{
            width: 46,
            height: 2,
            background: KIT_BLUE,
            borderRadius: 2,
            transformOrigin: 'left center',
            transform: `scaleX(${kick})`,
            opacity: clamp01(kick * 1.5),
            boxShadow: `0 0 14px ${KIT_BLUE}55`,
            marginBottom: 20,
          }}
        />

        {/* Name — masked rise. */}
        <div style={{ overflow: 'hidden', paddingTop: 4, marginTop: -4 }}>
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 500,
              fontSize: 58,
              lineHeight: '66px',
              letterSpacing: -1,
              color: NAME_COLOR,
              whiteSpace: 'nowrap',
              textShadow: NAME_SHADOW,
              transform: `translateY(${(1 - nR) * 104}%)`,
              opacity: nF,
            }}
          >
            {name}
          </div>
        </div>

        {/* Role — masked rise, a beat later. */}
        <div style={{ overflow: 'hidden', marginTop: 6 }}>
          <div
            style={{
              fontFamily: TEXT_FONT,
              fontWeight: 500,
              fontSize: 23,
              lineHeight: '32px',
              letterSpacing: 0.2,
              color: ROLE_COLOR,
              whiteSpace: 'nowrap',
              textShadow: ROLE_SHADOW,
              transform: `translateY(${(1 - rR) * 110}%)`,
              opacity: rF,
            }}
          >
            {role}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
