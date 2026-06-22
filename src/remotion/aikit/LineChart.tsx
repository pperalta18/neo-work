import { useId, type CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { BRAND, KIT_BLUE, TEXT_FONT, elevation, lightTheme, type BrandColor, type NeoTheme } from '@/lib/neumorphism'
import { CURVE, DUR, ease } from '../motion'
import { CHART_VB, chartPoints, frontPop, smoothPath } from './widgetScript'

export type LineChartProps = {
  /** Title shown in the header. */
  title?: string
  /** The series — one value per period. 6–7 points look best. */
  data: readonly number[]
  /** X-axis labels, one per data point. Trimmed/padded to data length. */
  labels?: readonly string[]
  /** Accent colour for the delta badge + highlighted point. Blue stays the line. */
  accent?: BrandColor
  /** Delta pill copy, e.g. "+18,4%". Leading +/− tints it green/red. Omit to hide. */
  delta?: string
  /** Frame the curve starts drawing itself left → right. Default 0. */
  drawAt?: number
  /** Frames the draw takes. 0 = appears fully drawn at drawAt. Default 42. */
  drawFrames?: number
  /** Index of the highlighted point (dot + tooltip). Default: the maximum. */
  highlightIndex?: number
  /** Tooltip chip text on the highlighted point. Default `€X,Xk` of its value. */
  tooltip?: string
  width?: number
  theme?: NeoTheme
  /** Draw the raised card plate. Turn off inside an AppWindow viewport. */
  plate?: boolean
  /** Panel entrance start. Default 0. */
  enterAt?: number
  /** Local frame override; defaults to useCurrentFrame() (wrap in <Sequence> to offset). */
  frame?: number
  style?: CSSProperties
}

/**
 * LineChart — ChartWidget ported inline, frame-driven.
 * ────────────────────────────────────────────────────
 * The modes Yusta03/Yusta07 use: the recessed plotting well with the smoothed
 * Catmull-Rom line + soft area fill, drawing itself progressively (one clip
 * front sweeps left → right so line, fill, labels and the highlighted point
 * reveal in sync — la curva implacable), and the peak tooltip chip popping as
 * the front passes it. Themed by prop, deterministic per frame.
 */
export function LineChart({
  title = 'Flujo de caja',
  data,
  labels = [],
  accent = 'green',
  delta,
  drawAt = 0,
  drawFrames = 42,
  highlightIndex,
  tooltip,
  width = 420,
  theme = lightTheme,
  plate = true,
  enterAt = 0,
  frame: frameProp,
  style,
}: LineChartProps) {
  const globalFrame = useCurrentFrame()
  const frame = frameProp ?? globalFrame
  const uid = useId()

  const enter = ease(frame, enterAt, enterAt + DUR.reveal)
  const card = plate
    ? elevation(theme, { depth: 'raised', distance: 10, blur: 22, radius: 28 })
    : {}
  const well = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 18 })

  const accentColor = BRAND[accent]
  const down = delta != null && (delta.trim().startsWith('-') || delta.trim().startsWith('−'))
  const deltaColor = down ? BRAND.red : accentColor

  // ── Geometry (pure, unit-tested in widgetScript) ───────────────────────
  const vb = CHART_VB
  const pts = chartPoints(data, vb)
  const linePath = smoothPath(pts)
  const last = pts[pts.length - 1]
  const areaPath = `${linePath} L ${last.x.toFixed(2)} ${(vb.h - vb.padBottom).toFixed(2)} L ${pts[0].x.toFixed(2)} ${(vb.h - vb.padBottom).toFixed(2)} Z`

  // The draw front: one clip edge sweeping the box, everything reveals in
  // sync. It overshoots the right edge so a feature ON the last point (la
  // curva's peak) still gets passed and pops before the draw ends.
  const reveal = ease(frame, drawAt, drawAt + drawFrames, CURVE.standard)
  const innerW = vb.w - vb.padX * 2
  const revealX = vb.padX + (innerW + 30) * reveal

  const hiIdx = highlightIndex ?? data.indexOf(Math.max(...data))
  const hi = pts[hiIdx]
  const hiPop = frontPop(revealX, hi.x)

  // Four evenly-spaced gridlines across the plot band.
  const innerH = vb.h - vb.padTop - vb.padBottom
  const gridYs = [0, 1, 2, 3].map((g) => vb.padTop + (innerH * g) / 3)

  const chipText =
    tooltip ?? `€${(hi.v / 1000).toFixed(1).replace('.', ',')}k`

  // Tooltip chip placement (in SVG units) — clamp so it never leaves the box.
  const chipW = Math.max(56, chipText.length * 7.5 + 16)
  const chipH = 26
  const chipX = Math.min(Math.max(hi.x - chipW / 2, vb.padX), vb.w - vb.padX - chipW)
  const chipY = Math.max(hi.y - chipH - 12, 2)

  return (
    <div
      style={{
        width,
        boxSizing: 'border-box',
        padding: plate ? 26 : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: TEXT_FONT,
        ...card,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 16}px)`,
        ...style,
      }}
    >
      {/* Header: dot + title  ·  delta pill (pops once the draw completes). */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: KIT_BLUE }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: theme.textStrong }}>{title}</span>
        </div>
        {delta != null && <DeltaBadge text={delta} color={deltaColor} down={down} pop={reveal} />}
      </div>

      {/* Recessed plotting well. */}
      <div style={{ padding: 14, ...well }}>
        <svg
          viewBox={`0 0 ${vb.w} ${vb.h}`}
          width="100%"
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={KIT_BLUE} stopOpacity={0.28} />
              <stop offset="100%" stopColor={KIT_BLUE} stopOpacity={0} />
            </linearGradient>
            <clipPath id={`${uid}-front`}>
              <rect x={0} y={-4} width={revealX} height={vb.h + 8} />
            </clipPath>
          </defs>

          {/* Faint horizontal gridlines — the quiet backdrop, not clipped. */}
          {gridYs.map((gy, i) => (
            <line
              key={i}
              x1={vb.padX}
              x2={vb.w - vb.padX}
              y1={gy}
              y2={gy}
              stroke={theme.gridLine}
              strokeWidth={1}
            />
          ))}

          {/* Area fill + line, both behind the sweeping clip front. */}
          <g clipPath={`url(#${uid}-front)`}>
            <path d={areaPath} fill={`url(#${uid}-grad)`} />
            <path
              d={linePath}
              fill="none"
              stroke={KIT_BLUE}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Highlighted point: halo + dot ringed by the surface, popping in. */}
          {hiPop > 0 && (
            <g opacity={hiPop} transform={`translate(${hi.x} ${hi.y}) scale(${0.85 + 0.15 * hiPop}) translate(${-hi.x} ${-hi.y})`}>
              <circle cx={hi.x} cy={hi.y} r={9} fill={accentColor} opacity={0.16} />
              <circle
                cx={hi.x}
                cy={hi.y}
                r={4.4}
                fill={accentColor}
                stroke={theme.surface}
                strokeWidth={2.4}
              />
              {/* Tooltip chip on the highlighted point. */}
              <rect x={chipX} y={chipY} width={chipW} height={chipH} rx={8} fill={accentColor} />
              <text
                x={chipX + chipW / 2}
                y={chipY + chipH / 2 + 4}
                textAnchor="middle"
                fontSize={12.5}
                fontWeight={700}
                fill="#fff"
              >
                {chipText}
              </text>
            </g>
          )}

          {/* X-axis labels fade in as the front passes them. */}
          {labels.slice(0, data.length).map((lab, i) => (
            <text
              key={i}
              x={pts[i].x}
              y={vb.h - 6}
              textAnchor="middle"
              fontSize={11}
              fill={theme.textMuted}
              opacity={frontPop(revealX, pts[i].x, 18)}
            >
              {lab}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}

/** Delta pill: a tiny up/down chevron + the figure, tinted by sign. */
function DeltaBadge({ text, color, down, pop }: { text: string; color: string; down: boolean; pop: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        fontWeight: 700,
        color,
        background: `${color}1f`,
        borderRadius: 999,
        padding: '4px 10px 4px 8px',
        letterSpacing: -0.2,
        opacity: pop,
        transform: `translateY(${(1 - pop) * 6}px)`,
      }}
    >
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        {down ? <path d="M6 9l6 6 6-6" /> : <path d="M6 15l6-6 6 6" />}
      </svg>
      {text}
    </span>
  )
}
