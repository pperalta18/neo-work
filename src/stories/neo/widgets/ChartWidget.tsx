import { BRAND, elevation, KIT_BLUE, TEXT_FONT, type BrandColor } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

export type ChartWidgetProps = {
  /** Title shown in the header. */
  title?: string
  /** The series — one value per period. 6–7 points look best. */
  data?: number[]
  /** X-axis labels, one per data point. Trimmed/padded to data length. */
  labels?: string[]
  /** Accent colour for the delta badge + highlighted point. Blue stays the line. */
  accent?: BrandColor
  /** Delta pill copy, e.g. "+18,4%". Leading +/− tints it green/red. */
  delta?: string
}

const DEFAULT_DATA = [4200, 3850, 5100, 4700, 6250, 5900, 7400]
const DEFAULT_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul']

/** SVG drawing box. Geometry is computed in these units, then scaled by CSS. */
const VB = { w: 360, h: 150, padX: 6, padTop: 16, padBottom: 26 }

/**
 * ChartWidget — a neumorphic cash-flow line / area chart.
 * ────────────────────────────────────────────────────────
 * The calm sibling of ExpensesWidget (bars): a recessed plotting well holds an
 * inline SVG with faint gridlines, a soft KIT_BLUE area fill under a smoothed
 * line (Catmull-Rom → bézier, so no kinks), x-axis month labels and ONE
 * highlighted point — the peak — carrying a little value tooltip chip. All
 * geometry is derived from the data so any series plots correctly. Re-lit live
 * by the active NeoTheme like the rest of the gallery.
 */
export function ChartWidget({
  title = 'Flujo de caja',
  data = DEFAULT_DATA,
  labels = DEFAULT_LABELS,
  accent = 'green',
  delta = '+18,4%',
}: ChartWidgetProps) {
  const theme = useNeoTheme()
  const well = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 18 })

  const accentColor = BRAND[accent]
  // Tint the delta pill by its sign: rises read positive, falls negative.
  const down = delta.trim().startsWith('-') || delta.trim().startsWith('−')
  const deltaColor = down ? BRAND.red : accentColor

  // ── Geometry ──────────────────────────────────────────────────────────
  const n = Math.max(data.length, 2)
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const innerW = VB.w - VB.padX * 2
  const innerH = VB.h - VB.padTop - VB.padBottom

  const x = (i: number) => VB.padX + (innerW * i) / (n - 1)
  // Pad the value range a touch so the line never kisses the rim.
  const y = (v: number) => VB.padTop + innerH * (1 - (v - min) / span) * 0.86 + innerH * 0.07

  const pts = data.map((v, i) => ({ x: x(i), y: y(v), v }))

  const linePath = smoothPath(pts)
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(2)} ${(VB.h - VB.padBottom).toFixed(2)} L ${pts[0].x.toFixed(2)} ${(VB.h - VB.padBottom).toFixed(2)} Z`

  // Highlight the peak.
  const peakIdx = data.indexOf(max)
  const peak = pts[peakIdx]

  // Four evenly-spaced gridlines across the plot band.
  const gridYs = [0, 1, 2, 3].map((g) => VB.padTop + (innerH * g) / 3)

  const gradId = 'neo-chart-area-grad'
  const money = (v: number) =>
    `€${(v / 1000).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`

  // Tooltip chip placement (in SVG units) — clamp so it never leaves the box.
  const chipW = 56
  const chipH = 26
  const chipX = Math.min(Math.max(peak.x - chipW / 2, VB.padX), VB.w - VB.padX - chipW)
  const chipY = Math.max(peak.y - chipH - 12, 2)

  return (
    <NeoCard width={420} center={false} padding={26} radius={28} style={{ gap: 18 }}>
      {/* Header: dot + title  ·  delta pill. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: KIT_BLUE }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: theme.textStrong }}>{title}</span>
        </div>
        <DeltaBadge text={delta} color={deltaColor} down={down} />
      </div>

      {/* Recessed plotting well. */}
      <div style={{ padding: 14, ...well }}>
        <svg
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          width="100%"
          style={{ display: 'block', overflow: 'visible', fontFamily: TEXT_FONT }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={KIT_BLUE} stopOpacity={0.28} />
              <stop offset="100%" stopColor={KIT_BLUE} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Faint horizontal gridlines. */}
          {gridYs.map((gy, i) => (
            <line
              key={i}
              x1={VB.padX}
              x2={VB.w - VB.padX}
              y1={gy}
              y2={gy}
              stroke={theme.gridLine}
              strokeWidth={1}
            />
          ))}

          {/* Area fill, then the line on top. */}
          <path d={areaPath} fill={`url(#${gradId})`} />
          <path
            d={linePath}
            fill="none"
            stroke={KIT_BLUE}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Highlighted peak: halo + dot ringed by the surface. */}
          <circle cx={peak.x} cy={peak.y} r={9} fill={accentColor} opacity={0.16} />
          <circle
            cx={peak.x}
            cy={peak.y}
            r={4.4}
            fill={accentColor}
            stroke={theme.surface}
            strokeWidth={2.4}
          />

          {/* Tooltip chip on the peak. */}
          <g>
            <rect
              x={chipX}
              y={chipY}
              width={chipW}
              height={chipH}
              rx={8}
              fill={accentColor}
            />
            <text
              x={chipX + chipW / 2}
              y={chipY + chipH / 2 + 4}
              textAnchor="middle"
              fontSize={12.5}
              fontWeight={700}
              fill="#fff"
            >
              {money(max)}
            </text>
          </g>

          {/* X-axis month labels. */}
          {labels.slice(0, n).map((lab, i) => (
            <text
              key={i}
              x={x(i)}
              y={VB.h - 6}
              textAnchor="middle"
              fontSize={11}
              fill={theme.textMuted}
            >
              {lab}
            </text>
          ))}
        </svg>
      </div>
    </NeoCard>
  )
}

/** Delta pill: a tiny up/down chevron + the figure, tinted by sign. */
function DeltaBadge({ text, color, down }: { text: string; color: string; down: boolean }) {
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
      }}
    >
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        {down ? <path d="M6 9l6 6 6-6" /> : <path d="M6 15l6-6 6 6" />}
      </svg>
      {text}
    </span>
  )
}

/**
 * Smooth a polyline through `pts` into a cubic-bézier path using a
 * Catmull-Rom → bézier conversion. Deterministic, no kinks, endpoints exact.
 */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  const t = 0.18 // tension — lower is tauter
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) * t
    const c1y = p1.y + (p2.y - p0.y) * t
    const c2x = p2.x - (p3.x - p1.x) * t
    const c2y = p2.y - (p3.y - p1.y) * t
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}
