import { BRAND, elevation, KIT_BLUE, type BrandColor } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

type Theme = ReturnType<typeof useNeoTheme>

export type DashboardKpi = {
  /** Tiny uppercase label above the number. */
  label: string
  /** The big figure (already formatted, e.g. "1.284" or "92%"). */
  value: string
  /** Signed delta vs. el periodo anterior (e.g. "+12%"). */
  delta?: string
  /** Up = bueno (verde), down = malo (rojo). Defaults to up. */
  trend?: 'up' | 'down'
}

export type DashboardPriority = {
  /** Etiqueta de la fila. */
  label: string
  /** Recuento (define el ancho de la barra, relativo al máximo). */
  count: number
  /** Color del punto + barra. */
  color: BrandColor
}

export type DashboardWidgetProps = {
  /** Título en negrita de la cabecera. */
  title?: string
  /** Texto del chip de rango de fechas. */
  range?: string
  /** Las 3 placas de KPI superiores. */
  kpis?: DashboardKpi[]
  /** Serie del mini gráfico de área (valores 0–1, se normaliza solo). */
  chart?: number[]
  /** Etiquetas del eje X bajo el gráfico (extremos). */
  chartSpan?: [string, string]
  /** Filas de "Tickets por prioridad". */
  priorities?: DashboardPriority[]
}

const DEFAULT_KPIS: DashboardKpi[] = [
  { label: 'Ingresos', value: '24,8k €', delta: '+12%', trend: 'up' },
  { label: 'Tickets', value: '1.284', delta: '+8%', trend: 'up' },
  { label: 'Resueltos', value: '92%', delta: '-3%', trend: 'down' },
]

const DEFAULT_CHART = [0.32, 0.48, 0.4, 0.62, 0.55, 0.74, 0.68, 0.86, 0.79, 0.94]

const DEFAULT_PRIORITIES: DashboardPriority[] = [
  { label: 'Urgente', count: 18, color: 'red' },
  { label: 'Alta', count: 34, color: 'orange' },
  { label: 'Media', count: 52, color: 'blue' },
  { label: 'Baja', count: 27, color: 'teal' },
]

/**
 * DashboardWidget — resumen ejecutivo en tiempo real.
 * ─────────────────────────────────────────────────────
 * Una sola placa elevada (NeoCard ~560) con cabecera + chip de rango, una fila
 * de tres placas de KPI elevadas (label · número grande · delta), y debajo un
 * área a dos columnas: a la izquierda un mini gráfico de área en un pozo
 * hundido, a la derecha "Tickets por prioridad" con punto + barra proporcional
 * + recuento. Tranquilo, equilibrado y aireado. Esto es lo fácil: tú míralo.
 * Re-iluminado en vivo por el NeoTheme activo como el resto de la galería.
 */
export function DashboardWidget({
  title = 'Resumen ejecutivo',
  range = 'Últimos 30 días',
  kpis = DEFAULT_KPIS,
  chart = DEFAULT_CHART,
  chartSpan = ['1 may', '30 may'],
  priorities = DEFAULT_PRIORITIES,
}: DashboardWidgetProps) {
  const theme = useNeoTheme()
  const chip = elevation(theme, { depth: 'recessed', distance: 2, blur: 6, radius: 999 })

  return (
    <NeoCard width={560} center={false} padding={28} radius={30} style={{ gap: 22 }}>
      {/* Cabecera: título + chip de rango. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: KIT_BLUE }} />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.2, color: theme.textStrong }}>
            {title}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 500,
            color: theme.textMuted,
            ...chip,
          }}
        >
          <CalendarGlyph />
          {range}
        </div>
      </div>

      {/* Fila de 3 placas KPI. */}
      <div style={{ display: 'flex', gap: 12 }}>
        {kpis.map((k, i) => (
          <StatPlate key={i} kpi={k} theme={theme} />
        ))}
      </div>

      {/* Área a dos columnas: gráfico de área · prioridades. */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
        <AreaChart data={chart} span={chartSpan} theme={theme} />
        <PriorityList rows={priorities} theme={theme} />
      </div>
    </NeoCard>
  )
}

/** Placa elevada pequeña: label · número grande · delta minúsculo. */
function StatPlate({ kpi, theme }: { kpi: DashboardKpi; theme: Theme }) {
  const plate = elevation(theme, { depth: 'raised', distance: 4, blur: 10, radius: 16 })
  const up = (kpi.trend ?? 'up') === 'up'
  const deltaColor = up ? BRAND.green : BRAND.red

  return (
    <div
      style={{
        flex: 1,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        ...plate,
      }}
    >
      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, color: theme.textMuted }}>
        {kpi.label.toUpperCase()}
      </span>
      <span style={{ fontSize: 27, fontWeight: 700, letterSpacing: -0.8, color: theme.textStrong, lineHeight: 1 }}>
        {kpi.value}
      </span>
      {kpi.delta && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: deltaColor }}>
          <TrendArrow up={up} />
          {kpi.delta}
        </span>
      )}
    </div>
  )
}

/** Mini gráfico de área (SVG) en un pozo hundido, con relleno en degradado. */
function AreaChart({ data, span, theme }: { data: number[]; span: [string, string]; theme: Theme }) {
  const well = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 18 })
  const W = 280
  const H = 132
  const PAD = 6
  const gid = 'neo-dash-area'

  const max = Math.max(...data, 0.0001)
  const n = data.length
  const x = (i: number) => PAD + (i / (n - 1)) * (W - PAD * 2)
  const y = (v: number) => PAD + (1 - v / max) * (H - PAD * 2)

  const line = data.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const area = `${PAD},${H - PAD} ${line} ${W - PAD},${H - PAD}`
  const last = data[n - 1]

  return (
    <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 9, padding: 14, ...well }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: theme.textMuted }}>
        EVOLUCIÓN DE TICKETS
      </span>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={KIT_BLUE} stopOpacity={0.28} />
            <stop offset="100%" stopColor={KIT_BLUE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gid})`} />
        <polyline
          points={line}
          fill="none"
          stroke={KIT_BLUE}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Punto destacado en el último valor. */}
        <circle cx={x(n - 1)} cy={y(last)} r={3.4} fill={KIT_BLUE} />
        <circle cx={x(n - 1)} cy={y(last)} r={6.5} fill={KIT_BLUE} fillOpacity={0.16} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: theme.textMuted }}>
        <span>{span[0]}</span>
        <span>{span[1]}</span>
      </div>
    </div>
  )
}

/** Lista compacta "Tickets por prioridad": punto · label · barra · recuento. */
function PriorityList({ rows, theme }: { rows: DashboardPriority[]; theme: Theme }) {
  const max = Math.max(...rows.map((r) => r.count), 1)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: theme.textMuted }}>
        TICKETS POR PRIORIDAD
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center', flex: 1 }}>
        {rows.map((r, i) => {
          const color = BRAND[r.color]
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flex: '0 0 auto' }} />
              <span style={{ fontSize: 12.5, color: theme.textStrong, width: 58, flex: '0 0 auto' }}>{r.label}</span>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 999,
                  background: `${theme.textMuted}14`,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.round((r.count / max) * 100)}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: color,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: theme.textStrong,
                  width: 26,
                  textAlign: 'right',
                  flex: '0 0 auto',
                }}
              >
                {r.count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Flechita de tendencia (sube / baja). */
function TrendArrow({ up }: { up: boolean }) {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: up ? 'none' : 'rotate(180deg)' }}
    >
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  )
}

/** Glifo de calendario para el chip de rango. */
function CalendarGlyph() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}
