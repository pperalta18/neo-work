import { elevation, KIT_BLUE } from '@/lib/neumorphism'
import { Icon, type IconName } from '@/components/icons'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

type Theme = ReturnType<typeof useNeoTheme>

export type SecurityWidgetProps = {
  /** Centered bold headline under the badge. */
  title?: string
  /** Reassurance lines, one per row. Each gets a tinted lock/check chip. */
  points?: string[]
}

const DEFAULT_POINTS: string[] = [
  'Alojados en Europa 🇪🇺',
  'No entrenamos modelos con tus datos · DPA',
  'Cifrado extremo y acceso granular',
  'Cumple verifactu y normativa IA',
]

/**
 * SecurityWidget — a calm trust / security panel.
 * ────────────────────────────────────────────────
 * Seguridad primero: tus datos son solo tuyos. The centerpiece is a big raised
 * circular badge sitting inside a recessed ring (for depth), holding a
 * shield-with-lock in KIT_BLUE. Below, a centered bold title and a short list
 * of reassurance rows — each a tinted round chip (lock / check) beside a quiet
 * Spanish line. Generous spacing, no shouting. Re-lit live by the active
 * NeoTheme like the rest of the gallery.
 */
export function SecurityWidget({
  title = 'Tus datos son solo tuyos',
  points = DEFAULT_POINTS,
}: SecurityWidgetProps) {
  const theme = useNeoTheme()

  // Recessed ring carved into the surface…
  const ring = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 999 })
  // …holding a raised badge that pops out of it.
  const badge = elevation(theme, { depth: 'raised', distance: 6, blur: 14, radius: 999 })

  return (
    <NeoCard width={360} center padding={34} radius={32} style={{ gap: 22 }}>
      {/* Centerpiece: recessed ring + raised badge + shield-lock. */}
      <div
        style={{
          width: 108,
          height: 108,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...ring,
        }}
      >
        <div
          style={{
            width: 82,
            height: 82,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: KIT_BLUE,
            ...badge,
          }}
        >
          <ShieldLock size={40} />
        </div>
      </div>

      {/* Title — centered, bold, with a quiet reassuring subline. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: -0.4,
            textAlign: 'center',
            color: theme.textStrong,
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: 12.5, color: theme.textMuted, textAlign: 'center' }}>
          Seguridad primero. Esto no lo tocas tú: lo cuidamos nosotros.
        </span>
      </div>

      {/* Reassurance rows. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignSelf: 'stretch' }}>
        {points.map((line, i) => (
          <Point key={i} line={line} index={i} theme={theme} />
        ))}
      </div>
    </NeoCard>
  )
}

/** A single reassurance row: a tinted round chip + a short line. */
function Point({ line, index, theme }: { line: string; index: number; theme: Theme }) {
  // First row leads with a lock; the rest are ticks (all clear).
  const icon: IconName = index === 0 ? 'lock' : 'check'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
      <div
        style={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${KIT_BLUE}1f`,
          color: KIT_BLUE,
        }}
      >
        <Icon name={icon} size={15} color={KIT_BLUE} strokeWidth={2} />
      </div>
      <span style={{ fontSize: 13.5, lineHeight: 1.35, letterSpacing: -0.2, color: theme.textStrong }}>
        {line}
      </span>
    </div>
  )
}

/** Shield with a small lock — a simple geometric stroke mark, in currentColor. */
function ShieldLock({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2.5 4.5 5.5v6c0 4.6 3.1 7.7 7.5 9.5 4.4-1.8 7.5-4.9 7.5-9.5v-6L12 2.5Z" />
      <rect x="9" y="11" width="6" height="5" rx="1.2" />
      <path d="M10 11V9.7a2 2 0 0 1 4 0V11" />
    </svg>
  )
}
