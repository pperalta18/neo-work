import { elevation, KIT_BLUE } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { useNeoTheme } from '../NeoTheme'
import { NeoButton } from '../NeoButton'
import { NeoCard } from './NeoCard'

export type PricingWidgetProps = {
  /** Plan name shown at the top-left. */
  plan?: string
  /** Big price, currency included (e.g. "€49"). */
  price?: string
  /** Small muted suffix after the price (e.g. "/mes"). */
  period?: string
  /** One short line under the price. */
  tagline?: string
  /** What's included — one tick row each. */
  features?: string[]
  /** Call-to-action label on the full-width button. */
  cta?: string
  /** Tint the whole card blue + lift it a touch (the chosen plan). */
  highlighted?: boolean
  /** Show the "Popular" pill top-right. */
  popular?: boolean
}

const DEFAULT_FEATURES = [
  'Conversaciones ilimitadas',
  'Todos los módulos AiKit',
  'Integraciones que ya usas',
  'Soporte sin esperas',
]

/**
 * PricingWidget — a clean SaaS pricing plan card.
 * ───────────────────────────────────────────────
 * Plan name + an optional "Popular" pill, a big price with a muted /period,
 * a short tagline, a hairline, then a tick-list of what's included (each tick
 * sits in a tinted blue chip) and a full-width solid CTA. When `highlighted`
 * the whole plate picks up a soft KIT_BLUE tint and a touch more elevation, so
 * the chosen plan reads as lifted off the page. Re-lit live by the NeoTheme.
 */
export function PricingWidget({
  plan = 'Pro',
  price = '€49',
  period = '/mes',
  tagline = 'Para los que ya no quieren tocar el trabajo aburrido.',
  features = DEFAULT_FEATURES,
  cta = 'Empezar',
  highlighted = false,
  popular = true,
}: PricingWidgetProps) {
  const theme = useNeoTheme()
  const hairline = `1px solid ${theme.gridLine}`

  // Highlighted plates float a touch higher + carry a faint blue wash.
  const lift = highlighted
    ? elevation(theme, { depth: 'raised', distance: 13, blur: 28, radius: 30 })
    : null

  return (
    <NeoCard
      width={320}
      center={false}
      padding={30}
      radius={30}
      style={{
        gap: 22,
        ...lift,
        ...(highlighted ? { backgroundColor: `${KIT_BLUE}0d` } : null),
      }}
    >
      {/* Plan name · optional Popular pill. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: highlighted ? KIT_BLUE : theme.textMuted,
          }}
        >
          {plan}
        </span>
        {popular && <PopularPill theme={theme} />}
      </div>

      {/* Price block: big number + muted period. */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.8, color: theme.textStrong }}>
          {price}
        </span>
        <span style={{ fontSize: 14, color: theme.textMuted }}>{period}</span>
      </div>

      {/* Tagline. */}
      <span style={{ fontSize: 13, lineHeight: 1.45, letterSpacing: -0.2, color: theme.textMuted }}>
        {tagline}
      </span>

      <div style={{ borderTop: hairline }} />

      {/* Feature checklist. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <CheckChip theme={theme} />
            <span style={{ fontSize: 13.5, letterSpacing: -0.2, color: theme.textStrong }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Full-width CTA. */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 2 }}>
        <NeoButton tone="solid" fill={KIT_BLUE} size="sm" radius={16}>
          {cta}
        </NeoButton>
      </div>
    </NeoCard>
  )
}

function PopularPill({ theme }: { theme: ReturnType<typeof useNeoTheme> }) {
  return (
    <span
      style={{
        ...elevation(theme, { depth: 'recessed', distance: 2, blur: 6, radius: 999 }),
        backgroundColor: `${KIT_BLUE}1f`,
        padding: '4px 11px',
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: KIT_BLUE,
        whiteSpace: 'nowrap',
      }}
    >
      Popular
    </span>
  )
}

function CheckChip({ theme }: { theme: ReturnType<typeof useNeoTheme> }) {
  return (
    <span
      style={{
        flexShrink: 0,
        width: 24,
        height: 24,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: 8 }),
        backgroundColor: `${KIT_BLUE}1f`,
      }}
    >
      <Icon name="check" size={15} color={KIT_BLUE} strokeWidth={2} />
    </span>
  )
}
