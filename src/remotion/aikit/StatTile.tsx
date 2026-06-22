import type { CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { BRAND, TEXT_FONT, elevation, lightTheme, type BrandColor, type NeoTheme } from '@/lib/neumorphism'
import { DUR, ease } from '../motion'

export type StatTileProps = {
  /** UPPERCASE muted label above the number. */
  label: string
  /** Metric mode: the headline value (the big number). */
  value?: string
  /** Signed percentage change (e.g. -98 or 12.4). Sign picks ▼/▲ + colour. */
  delta?: number
  /** Small caption next to the delta (e.g. "vs. el proceso a mano"). */
  deltaCaption?: string
  /** Comparison "antes" value — both set turn the tile into before → after mode. */
  before?: string
  /** Comparison "después" value. */
  after?: string
  /** Accent colour for the comparison arrow + chip. Default blue. */
  accent?: BrandColor
  /** Frame the payoff lands (the after / the value). Default enterAt + 10. */
  revealAt?: number
  width?: number
  theme?: NeoTheme
  /** Draw the raised card plate. Turn off inside an AppWindow viewport. */
  plate?: boolean
  /** Tile entrance start. Default 0. */
  enterAt?: number
  /** Local frame override; defaults to useCurrentFrame() (wrap in <Sequence> to offset). */
  frame?: number
  style?: CSSProperties
}

/**
 * StatTile — StatWidget ported inline, frame-driven (no sparkline — unused).
 * ──────────────────────────────────────────────────────────────────────────
 * The modes the pieces use: comparison "antes → después" (Prod02's 23 min →
 * 40 s, Yusta03's economics — the arrow draws, the after lands, the delta
 * chip rises) and the plain metric (Yusta02's barato/caro labels). Picks
 * comparison automatically when `before` + `after` are both set. Themed by
 * prop, deterministic per frame.
 */
export function StatTile({
  label,
  value = '',
  delta = 0,
  deltaCaption,
  before,
  after,
  accent = 'blue',
  revealAt,
  width = 240,
  theme = lightTheme,
  plate = true,
  enterAt = 0,
  frame: frameProp,
  style,
}: StatTileProps) {
  const globalFrame = useCurrentFrame()
  const frame = frameProp ?? globalFrame

  const accentColor = BRAND[accent]
  const isComparison = before != null && after != null
  const landAt = revealAt ?? enterAt + 10

  const enter = ease(frame, enterAt, enterAt + DUR.reveal)
  const card = plate
    ? elevation(theme, { depth: 'raised', distance: 10, blur: 22, radius: 26 })
    : {}

  return (
    <div
      style={{
        width,
        boxSizing: 'border-box',
        padding: plate ? 26 : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: TEXT_FONT,
        ...card,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 16}px)`,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.6,
          color: theme.textMuted,
          textTransform: 'uppercase',
          lineHeight: 1.35,
        }}
      >
        {label}
      </span>

      {isComparison ? (
        <Comparison
          before={before!}
          after={after!}
          delta={delta}
          accent={accentColor}
          theme={theme}
          frame={frame}
          landAt={landAt}
        />
      ) : (
        <Metric
          value={value}
          delta={delta}
          deltaCaption={deltaCaption}
          theme={theme}
          frame={frame}
          landAt={landAt}
        />
      )}
    </div>
  )
}

/* ── metric mode ─────────────────────────────────────────────────────── */

function Metric({
  value,
  delta,
  deltaCaption,
  theme,
  frame,
  landAt,
}: {
  value: string
  delta: number
  deltaCaption?: string
  theme: NeoTheme
  frame: number
  landAt: number
}) {
  const land = ease(frame, landAt, landAt + DUR.base)
  const deltaIn = ease(frame, landAt + 6, landAt + 6 + DUR.base)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span
        style={{
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: -0.8,
          color: theme.textStrong,
          lineHeight: 1,
          opacity: land,
          display: 'inline-block',
          transform: `translateY(${(1 - land) * 10}px)`,
        }}
      >
        {value}
      </span>
      <div style={{ opacity: deltaIn, transform: `translateY(${(1 - deltaIn) * 6}px)` }}>
        <DeltaRow delta={delta} caption={deltaCaption} theme={theme} />
      </div>
    </div>
  )
}

function DeltaRow({ delta, caption, theme }: { delta: number; caption?: string; theme: NeoTheme }) {
  const up = delta >= 0
  const color = up ? BRAND.green : BRAND.red

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color, fontSize: 13, fontWeight: 700 }}>
        <Caret up={up} />
        {up ? '+' : '−'}
        {Math.abs(delta)}%
      </span>
      {caption && <span style={{ fontSize: 12, color: theme.textMuted, letterSpacing: -0.2 }}>{caption}</span>}
    </div>
  )
}

function Caret({ up }: { up: boolean }) {
  // Tiny solid triangle, rotated by mode. color = currentColor.
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" style={{ transform: up ? 'none' : 'rotate(180deg)' }}>
      <path d="M12 4 L21 19 L3 19 Z" fill="currentColor" />
    </svg>
  )
}

/* ── comparison mode ─────────────────────────────────────────────────── */

function Comparison({
  before,
  after,
  delta,
  accent,
  theme,
  frame,
  landAt,
}: {
  before: string
  after: string
  delta: number
  accent: string
  theme: NeoTheme
  frame: number
  landAt: number
}) {
  const sign = delta >= 0 ? '+' : '−'
  // The beat: arrow draws toward the after → the after lands → the chip rises.
  const arrowDraw = ease(frame, landAt, landAt + DUR.quick)
  const afterIn = ease(frame, landAt + 4, landAt + 4 + DUR.base)
  const chipIn = ease(frame, landAt + 10, landAt + 10 + DUR.base)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 17, fontWeight: 600, color: theme.textMuted, letterSpacing: -0.3, whiteSpace: 'nowrap' }}>
          {before}
        </span>
        <Arrow color={accent} draw={arrowDraw} />
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: theme.textStrong,
            letterSpacing: -0.8,
            whiteSpace: 'nowrap',
            opacity: afterIn,
            display: 'inline-block',
            transform: `translateY(${(1 - afterIn) * 8}px) scale(${0.94 + 0.06 * afterIn})`,
          }}
        >
          {after}
        </span>
      </div>
      <span
        style={{
          alignSelf: 'flex-start',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: -0.2,
          color: accent,
          background: `${accent}1f`,
          borderRadius: 999,
          padding: '4px 11px',
          opacity: chipIn,
          transform: `translateY(${(1 - chipIn) * 6}px)`,
        }}
      >
        {sign}
        {Math.abs(delta)}%
      </span>
    </div>
  )
}

function Arrow({ color, draw }: { color: string; draw: number }) {
  return (
    <svg width="22" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
      <path d="M4 12 H19" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      <path d="M13 6 L19 12 L13 18" opacity={draw >= 1 ? 1 : 0} />
    </svg>
  )
}
