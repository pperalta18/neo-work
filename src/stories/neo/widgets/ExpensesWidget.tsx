import { BRAND, elevation } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

export type ExpensesWidgetProps = {
  title?: string
  /** value (0–1) per month. */
  data?: { label: string; value: number }[]
  /** Tint every bar with a single colour instead of the multi-series palette. */
  monochrome?: boolean
}

const DEFAULT_DATA = [
  { label: 'Jan', value: 0.55 },
  { label: 'Feb', value: 0.78 },
  { label: 'Mar', value: 0.62 },
  { label: 'Apr', value: 0.7 },
  { label: 'May', value: 0.48 },
  { label: 'Jun', value: 0.33 },
]

/** Brand colours cycled across the bars (a multi-series chart). */
const SERIES = [BRAND.blue, BRAND.teal, BRAND.green, BRAND.orange, BRAND.violet, BRAND.pink]

/** ExpensesWidget — titled bar chart; each bar sits in a recessed track. */
export function ExpensesWidget({
  title = 'Expenses',
  data = DEFAULT_DATA,
  monochrome = false,
}: ExpensesWidgetProps) {
  const theme = useNeoTheme()
  const track = elevation(theme, { depth: 'recessed', distance: 3, blur: 6, radius: 8 })
  const CHART_H = 150

  return (
    <NeoCard width={290} style={{ minHeight: 260, gap: 18 }}>
      <div style={{ fontSize: 18, color: theme.textMuted }}>{title}</div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', height: CHART_H }}>
        {data.map((d, i) => (
          <div
            key={d.label}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            <div
              style={{
                position: 'relative',
                width: 14,
                height: CHART_H,
                display: 'flex',
                alignItems: 'flex-end',
                ...track,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${Math.round(d.value * 100)}%`,
                  borderRadius: 8,
                  background: monochrome ? theme.textMuted : SERIES[i % SERIES.length],
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: theme.textMuted }}>{d.label}</div>
          </div>
        ))}
      </div>
    </NeoCard>
  )
}
