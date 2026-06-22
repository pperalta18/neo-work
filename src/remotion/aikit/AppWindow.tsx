import type { CSSProperties, ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { BRAND, CELL, elevation, KIT_BLUE, TEXT_FONT, lightTheme, type NeoTheme } from '@/lib/neumorphism'
import { Icon, type IconName } from '@/components/icons'
import { CURVE } from '../motion'
import {
  type AppWindowTiming,
  type WindowEnter,
  appWindowTimeline,
  DEFAULT_WINDOW_TIMING,
  phase,
} from './windowScript'
import { type TraceStyle, inkReveal, roundedRectPerimeter, tipDashes } from './trace'

export type { WindowEnter, AppWindowTiming, TraceStyle }

export type AppWindowProps = {
  /** The app identity in the chrome, e.g. 'CRM · Clientes'. */
  title?: string
  icon?: IconName
  /** Address bar URL — set it for browser-like windows, omit for plain apps. */
  url?: string
  width?: number
  height?: number
  radius?: number
  theme?: NeoTheme
  /** Entrance choreography; see appWindow.ts. */
  enter?: WindowEnter
  /** Frame the entrance starts (in this window's local frame space). */
  enterAt?: number
  /** Outline trace style for the 'draw' entrance. */
  traceStyle?: TraceStyle
  /** Pen / comet colour. Defaults to KIT_BLUE. */
  accent?: string
  timing?: Partial<AppWindowTiming>
  /** Padding inside the recessed viewport. */
  viewportPadding?: number
  /** Local frame override; defaults to useCurrentFrame() (wrap in <Sequence> to offset). */
  frame?: number
  style?: CSSProperties
  children?: ReactNode
}

/**
 * AppWindow — the kit's neumorphic app window, frame-driven end to end.
 * ─────────────────────────────────────────────────────────────────────
 * Port of BrowserWidget's chrome onto a NeoCard plate, themed by prop (no
 * context) so it self-contains in any scene: traffic dots · icon + title tab ·
 * optional recessed address bar, over a recessed viewport that hosts the app
 * content (`children`). Optional entrances per appWindow.ts: the outline
 * traces itself ('draw', the Prod01 per-app gesture) or the window settles up
 * ('rise'). Layout is fixed from frame 0 — entrances only fade/transform, so
 * scenes can position windows without reflow.
 */
export function AppWindow({
  title = 'AiKit',
  icon = 'global',
  url,
  width = 640,
  height = 460,
  radius = 26,
  theme = lightTheme,
  enter = 'none',
  enterAt = 0,
  traceStyle = 'pen',
  accent = KIT_BLUE,
  timing,
  viewportPadding = 18,
  frame: frameProp,
  style,
  children,
}: AppWindowProps) {
  const globalFrame = useCurrentFrame()
  const frame = frameProp ?? globalFrame
  const t = { ...DEFAULT_WINDOW_TIMING, ...timing }
  const tl = appWindowTimeline(enter, enterAt, t)

  const surfaceP = CURVE.enter(phase(frame, tl.surfaceStart, tl.surfaceEnd))
  const contentP = CURVE.enter(phase(frame, tl.contentStart, tl.contentEnd))

  const plate = elevation(theme, { depth: 'raised', distance: 10, blur: 22, radius })
  const viewport = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 18 })
  const titleTab = elevation(theme, { depth: 'raised', distance: 4, blur: 8, radius: 12 })
  const addressBar = elevation(theme, { depth: 'recessed', distance: 3, blur: 6, radius: 999 })

  // Chrome settles in a quiet cascade: dots → title → address bar.
  const chrome = (step: number): CSSProperties => {
    const p = CURVE.enter(phase(frame, tl.surfaceStart + step * t.chromeStagger, tl.surfaceEnd + step * t.chromeStagger))
    return { opacity: p, transform: `translateY(${(1 - p) * 6}px)` }
  }

  // 'rise': the whole window settles up from below (the chat-bubble idiom).
  const risePose: CSSProperties =
    enter === 'rise'
      ? {
          opacity: surfaceP,
          transform: `translateY(${(1 - surfaceP) * 22}px) scale(${0.97 + 0.03 * surfaceP})`,
        }
      : {}

  return (
    <div style={{ position: 'relative', width, height, ...risePose, ...style }}>
      {/* The solid window. For 'draw' it materialises beneath the traced outline. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxSizing: 'border-box',
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          fontFamily: TEXT_FONT,
          color: theme.textStrong,
          opacity: enter === 'draw' ? surfaceP : 1,
          ...plate,
        }}
      >
        {/* Chrome: traffic dots · icon + title tab · address bar (optional) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 7, ...chrome(0) }}>
            {[BRAND.red, BRAND.orange, BRAND.green].map((c) => (
              <span
                key={c}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  background: c,
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              fontSize: 13,
              whiteSpace: 'nowrap',
              color: theme.textStrong,
              ...titleTab,
              ...chrome(1),
            }}
          >
            <Icon name={icon} size={14} color={theme.textMuted} />
            {title}
          </div>
          {url && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                fontSize: 13,
                minWidth: 0,
                color: theme.textMuted,
                ...addressBar,
                ...chrome(2),
              }}
            >
              <Icon name="lock" size={13} color={theme.textMuted} />
              <span style={{ color: theme.textStrong, overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</span>
            </div>
          )}
        </div>

        {/* Viewport: the recessed stage the app content plays on. */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            boxSizing: 'border-box',
            padding: viewportPadding,
            overflow: 'hidden',
            position: 'relative',
            ...viewport,
          }}
        >
          <div style={{ opacity: contentP, width: '100%', height: '100%' }}>{children}</div>
        </div>
      </div>

      {enter === 'draw' && <TraceOutline frame={frame} tl={tl} t={t} width={width} height={height} radius={radius} theme={theme} traceStyle={traceStyle} accent={accent} />}
    </div>
  )
}

/**
 * The self-drawing outline of the 'draw' entrance: neutral ink traces the
 * window's silhouette with an accent tip riding the front (trace.ts math),
 * then dissolves as the solid plate takes over.
 */
function TraceOutline({
  frame,
  tl,
  t,
  width,
  height,
  radius,
  theme,
  traceStyle,
  accent,
}: {
  frame: number
  tl: ReturnType<typeof appWindowTimeline>
  t: AppWindowTiming
  width: number
  height: number
  radius: number
  theme: NeoTheme
  traceStyle: TraceStyle
  accent: string
}) {
  const traceP = CURVE.standard(phase(frame, tl.traceStart, tl.traceEnd))
  // The hairline holds until the trace completes, then hands off to the plate.
  const inkLevel = 1 - CURVE.enter(phase(frame, tl.traceEnd, tl.surfaceEnd))
  const tipFade = 1 - phase(frame, tl.traceEnd, tl.traceEnd + t.traceSettle)
  if (traceP <= 0 || (inkLevel <= 0.001 && tipFade <= 0.001)) return null

  const w = width - 1.5
  const h = height - 1.5
  const perimeter = roundedRectPerimeter(w, h, radius)
  const rect = { x: 0.75, y: 0.75, width: w, height: h, rx: radius, ry: radius, fill: 'none' } as const

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
    >
      <rect
        {...rect}
        stroke={theme.gridLine}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={inkLevel}
        {...inkReveal(traceP)}
      />
      {tipDashes(traceP, perimeter, CELL, traceStyle, tipFade).map((tip, k) => (
        <rect
          key={k}
          {...rect}
          stroke={accent}
          strokeWidth={1.5 + tip.widthDelta}
          strokeLinecap="round"
          opacity={tip.opacity}
          strokeDasharray={tip.strokeDasharray}
          strokeDashoffset={tip.strokeDashoffset}
        />
      ))}
    </svg>
  )
}
