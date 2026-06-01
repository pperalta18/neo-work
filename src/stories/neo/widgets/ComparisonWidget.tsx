import { BRAND, elevation, KIT_BLUE } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

type Cell = boolean | 'partial'

export type ComparisonRow = {
  /** Feature name shown on the left. */
  label: string
  /** AiKit column: ✓ (true), ✗ (false) or 'partial'. */
  a: Cell
  /** "los otros" column: ✓ (true), ✗ (false) or 'partial'. */
  b: Cell
}

export type ComparisonWidgetProps = {
  /** The feature rows, top to bottom. */
  rows?: ComparisonRow[]
  /** Header for the highlighted (blue) column. */
  aLabel?: string
  /** Header for the muted column. */
  bLabel?: string
  /** Bold headline above the table. */
  title?: string
  /** Muted line under the title. */
  subtitle?: string
  /** Footer tagline next to the blue dot. */
  footer?: string
}

const DEFAULT_ROWS: ComparisonRow[] = [
  { label: 'Opera tu ERP', a: true, b: false },
  { label: 'Ejecuta acciones reales', a: true, b: false },
  { label: 'Memoria de tu negocio', a: true, b: 'partial' },
  { label: 'Integraciones nativas', a: true, b: false },
  { label: 'Datos alojados en Europa', a: true, b: 'partial' },
  { label: 'Construye software a medida', a: true, b: false },
]

type Theme = ReturnType<typeof useNeoTheme>

/**
 * ComparisonWidget — "no es ChatGPT", en una tabla que lo deja clarísimo.
 * ──────────────────────────────────────────────────────────────────────
 * Tres columnas: la feature a la izquierda, AiKit (la columna que mola, con su
 * banda azul en relieve cruzando todas las filas) y "los otros" en gris. Cada
 * celda es un check, una × o un punto "parcial". Filas separadas por hairlines,
 * cero cajas pesadas. Se re-ilumina sola con el NeoTheme activo, como el resto.
 */
export function ComparisonWidget({
  rows = DEFAULT_ROWS,
  aLabel = 'AiKit',
  bLabel = 'ChatGPT / otros',
  title = 'Esto no es un chatbot',
  subtitle = 'Lo que hace AiKit y lo que no hace lo demás.',
  footer = 'Tú dale el trabajo de mierda que odias. Del resto nos encargamos.',
}: ComparisonWidgetProps) {
  const theme = useNeoTheme()
  const hairline = `1px solid ${theme.gridLine}`

  // Layout: feature label flexes, the two verdict columns are fixed + centred.
  const COL = 96
  const grid = `minmax(0, 1fr) ${COL}px ${COL}px`

  // The blue band that runs behind the whole AiKit column — recessed well so
  // the marks sit inside a soft tinted channel. Sits the column width + a hair.
  const band = elevation(theme, { depth: 'recessed', distance: 3, blur: 9, radius: 18 })

  return (
    <NeoCard width={480} center={false} padding={30} radius={30} style={{ gap: 0 }}>
      {/* Title + subtitle. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 22 }}>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.4, color: theme.textStrong }}>
          {title}
        </span>
        <span style={{ fontSize: 13, color: theme.textMuted, letterSpacing: -0.2 }}>
          {subtitle}
        </span>
      </div>

      {/* Table, relatively positioned so the blue band can sit behind column A. */}
      <div style={{ position: 'relative' }}>
        {/* Blue tinted band spanning all rows behind the AiKit column. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            // Right column is COL wide, then a 22px gutter before the A column.
            right: COL + 22,
            width: COL + 16,
            transform: 'translateX(8px)',
            background: `${KIT_BLUE}12`,
            ...band,
            pointerEvents: 'none',
          }}
        />

        {/* Header row. */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: grid,
            alignItems: 'center',
            columnGap: 22,
            paddingBottom: 14,
          }}
        >
          <span />
          <span
            style={{
              textAlign: 'center',
              fontSize: 13.5,
              fontWeight: 700,
              letterSpacing: -0.2,
              color: KIT_BLUE,
            }}
          >
            {aLabel}
          </span>
          <span
            style={{
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: theme.textMuted,
              letterSpacing: -0.1,
            }}
          >
            {bLabel}
          </span>
        </div>

        {/* Feature rows, split by hairlines. */}
        <div style={{ position: 'relative', borderTop: hairline }}>
          {rows.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: grid,
                alignItems: 'center',
                columnGap: 22,
                padding: '13px 0',
                borderBottom: i === rows.length - 1 ? undefined : hairline,
              }}
            >
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: theme.textStrong,
                  letterSpacing: -0.2,
                }}
              >
                {row.label}
              </span>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Mark value={row.a} highlight theme={theme} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Mark value={row.b} theme={theme} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer tagline — desenfadado. */}
      <div
        style={{
          marginTop: 22,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: KIT_BLUE }} />
        <span style={{ fontSize: 12, color: theme.textMuted, letterSpacing: -0.2 }}>
          {footer}
        </span>
      </div>
    </NeoCard>
  )
}

/**
 * A single verdict mark.
 * - true     → a check inside a soft tinted disc (blue when highlighted, green otherwise)
 * - false    → a quiet muted ×
 * - 'partial'→ a small "parcial" dot in a muted disc
 */
function Mark({
  value,
  highlight = false,
  theme,
}: {
  value: Cell
  highlight?: boolean
  theme: Theme
}) {
  const SIZE = 26

  if (value === 'partial') {
    return (
      <span
        title="Parcial"
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${BRAND.orange}1f`,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: BRAND.orange }} />
      </span>
    )
  }

  if (value === true) {
    const color = highlight ? KIT_BLUE : BRAND.green
    return (
      <span
        title="Sí"
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${color}1f`,
          color,
        }}
      >
        <svg
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5 10 17.5 19 7" />
        </svg>
      </span>
    )
  }

  // false → muted ×, no disc, kept airy.
  return (
    <span
      title="No"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.textMuted,
        opacity: 0.7,
      }}
    >
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 6 18 18 M18 6 6 18" />
      </svg>
    </span>
  )
}
