import { BRAND, elevation, KIT_BLUE } from '@/lib/neumorphism'
import { Icon, type IconName } from '@/components/icons'
import { useNeoTheme } from '../NeoTheme'
import { NeoButton } from '../NeoButton'
import { NeoCard } from './NeoCard'

export type LandingFeature = {
  icon: IconName
  title: string
}

export type LandingWidgetProps = {
  /** Brand name shown next to the logo mark. */
  brand?: string
  /** Logo mark icon (sits in a small raised plate). */
  brandIcon?: IconName
  /** Nav links in the header (muted). */
  nav?: string[]
  /** Header call-to-action label. */
  cta?: string
  /** Small pill above the headline. */
  eyebrow?: string
  /** The big hero statement. */
  headline?: string
  /** Supporting line under the headline. */
  subhead?: string
  /** Primary (filled blue) hero action. */
  primaryCta?: string
  /** Secondary (neumorphic) hero action. */
  secondaryCta?: string
  /** The three feature tiles below the hero. */
  features?: LandingFeature[]
}

/**
 * LandingWidget — a neumorphic abstraction of a landing page.
 * ───────────────────────────────────────────────────────────
 * Captures the skeleton of a marketing landing — header (logo + nav + CTA),
 * a hero (eyebrow pill, headline, subhead, two actions + a recessed preview)
 * and a row of feature tiles — all re-lit live by the active NeoTheme.
 */
export function LandingWidget({
  brand = 'AiKit',
  brandIcon = 'sparkles',
  nav = ['Producto', 'Precios', 'Docs'],
  cta = 'Empezar',
  eyebrow = 'Novedad',
  headline = 'Diseña ideas que cobran relieve',
  subhead = 'Compón conceptos sobre una rejilla neumórfica y míralos emerger.',
  primaryCta = 'Probar gratis',
  secondaryCta = 'Ver demo',
  features = [
    { icon: 'brain', title: 'Conceptos' },
    { icon: 'target', title: 'Rutas' },
    { icon: 'star', title: 'Relieve' },
  ],
}: LandingWidgetProps) {
  const theme = useNeoTheme()
  const mark = elevation(theme, { depth: 'raised', distance: 4, blur: 8, radius: 12 })
  const pill = elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: 999 })
  const preview = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 16 })
  const tile = elevation(theme, { depth: 'raised', distance: 5, blur: 11, radius: 14 })

  const bar = (w: string | number, h = 8) => (
    <div style={{ width: w, height: h, borderRadius: 5, background: theme.textMuted, opacity: 0.24 }} />
  )

  return (
    <NeoCard width={520} center={false} padding={22} radius={28} style={{ gap: 22 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, ...mark }}>
            <Icon name={brandIcon} size={16} color={KIT_BLUE} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.4, color: theme.textStrong }}>
            {brand}
          </span>
        </div>
        <nav style={{ display: 'flex', gap: 18, marginLeft: 8 }}>
          {nav.map((item) => (
            <span key={item} style={{ fontSize: 13.5, color: theme.textMuted }}>
              {item}
            </span>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto' }}>
          <NeoButton size="sm" tone="solid" fill={KIT_BLUE}>
            {cta}
          </NeoButton>
        </div>
      </div>

      {/* Hero */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              fontSize: 12,
              color: theme.textMuted,
              ...pill,
            }}
          >
            <Icon name="sparkles" size={12} color={BRAND.violet} />
            {eyebrow}
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: 27,
              lineHeight: 1.12,
              fontWeight: 700,
              letterSpacing: -0.8,
              color: theme.textStrong,
            }}
          >
            {headline}
          </h1>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: theme.textMuted }}>{subhead}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <NeoButton size="sm" tone="solid" fill={KIT_BLUE} icon="arrow" iconPosition="right">
              {primaryCta}
            </NeoButton>
            <NeoButton size="sm">{secondaryCta}</NeoButton>
          </div>
        </div>

        {/* Preview panel */}
        <div style={{ width: 168, flexShrink: 0, padding: 16, ...preview }}>
          <div
            style={{
              height: 44,
              borderRadius: 10,
              background: `linear-gradient(120deg, ${KIT_BLUE}, #5aa6ff)`,
              opacity: 0.9,
              marginBottom: 12,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bar('80%', 9)}
            {bar('100%')}
            {bar('64%')}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', gap: 12 }}>
        {features.map((f) => (
          <div key={f.title} style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 9, ...tile }}>
            <Icon name={f.icon} size={20} color={KIT_BLUE} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: theme.textStrong }}>{f.title}</span>
            {bar('70%', 7)}
          </div>
        ))}
      </div>
    </NeoCard>
  )
}
