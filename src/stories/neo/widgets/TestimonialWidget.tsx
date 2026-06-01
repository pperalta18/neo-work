import { BRAND, DISPLAY_FONT, KIT_BLUE, type BrandColor } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

export type TestimonialWidgetProps = {
  /** The quote itself. Keep it warm, short (~2 lines). */
  quote?: string
  /** Who said it. */
  name?: string
  /** Their role / company, shown muted under the name. */
  role?: string
  /** Star rating 0–5. Set to 0 to hide the row. */
  rating?: number
  /** Accent colour for the stars. KIT_BLUE by default. */
  starColor?: BrandColor
}

type Theme = ReturnType<typeof useNeoTheme>

/** Build the avatar initials from a name ("Marta Ruiz" → "MR"). */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * TestimonialWidget — a warm, credible quote card for the Push section.
 * ──────────────────────────────────────────────────────────────────────
 * A big muted opening quote mark sets the tone, then the testimonial text,
 * then a quiet footer: a raised circular avatar with initials, the name in
 * bold with a muted role, and an optional star rating. No heavy boxes — just
 * the soft neo plate, lots of air, re-lit live by the active NeoTheme.
 */
export function TestimonialWidget({
  quote = 'Le di a AiKit todo el papeleo que odiaba y me lo devolvió hecho. Ahora solo decido.',
  name = 'Marta Ruiz',
  role = 'Fundadora · Estudio Norte',
  rating = 5,
  starColor = 'blue',
}: TestimonialWidgetProps) {
  const theme = useNeoTheme()
  const stars = Math.max(0, Math.min(5, Math.round(rating)))
  const starHex = starColor === 'blue' ? KIT_BLUE : BRAND[starColor]

  return (
    <NeoCard width={380} center={false} padding={34} radius={30} style={{ gap: 18 }}>
      {/* Big, muted opening quote mark — overlaps the text a touch for warmth. */}
      <span
        aria-hidden
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: 72,
          fontWeight: 700,
          lineHeight: 0.6,
          height: 38,
          color: `${theme.textMuted}66`,
          userSelect: 'none',
        }}
      >
        “
      </span>

      {/* The quote. */}
      <p
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 500,
          lineHeight: 1.5,
          letterSpacing: -0.3,
          color: theme.textStrong,
        }}
      >
        {quote}
      </p>

      {/* Hairline before the footer. */}
      <div style={{ borderTop: `1px solid ${theme.gridLine}`, marginTop: 2 }} />

      {/* Footer: avatar + name/role, stars on the right. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <Avatar initials={initialsOf(name)} theme={theme} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: theme.textStrong, letterSpacing: -0.2 }}>
            {name}
          </span>
          {role && (
            <span
              style={{
                fontSize: 12,
                color: theme.textMuted,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {role}
            </span>
          )}
        </div>
        {stars > 0 && (
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon
                key={i}
                name="star"
                size={15}
                strokeWidth={1.8}
                color={i < stars ? starHex : `${theme.textMuted}55`}
              />
            ))}
          </div>
        )}
      </div>
    </NeoCard>
  )
}

/** A small raised circular avatar holding the speaker's initials. */
function Avatar({ initials, theme }: { initials: string; theme: Theme }) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        flexShrink: 0,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${KIT_BLUE}1f`,
        boxShadow: `0 0 0 1px ${KIT_BLUE}22, inset 0 1px 2px ${theme.highlight}`,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: 0.2,
        color: KIT_BLUE,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  )
}
