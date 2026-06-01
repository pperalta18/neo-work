import { BRAND, elevation, KIT_BLUE, TEXT_FONT } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { useNeoTheme } from '../NeoTheme'
import { NeoButton } from '../NeoButton'
import { NeoCard } from './NeoCard'

export type JobPostCandidate = {
  /** Candidate full name. */
  name: string
  /** One-line note about why they stand out. */
  note?: string
  /** Match score, 0–100. Shown as a green tinted chip. */
  match: number
}

export type JobPostWidgetProps = {
  /** Role title — the bold headline of the card. */
  role?: string
  /** Where the role is based. */
  location?: string
  /** Contract type, shown as a tinted chip (e.g. "Jornada completa"). */
  type?: string
  /** One-line summary of the role. */
  summary?: string
  /** Skill tags, drawn as small tinted chips. */
  skills?: string[]
  /** The highlighted candidate AiKit surfaced for you. */
  candidate?: JobPostCandidate
}

const DEFAULT_SKILLS = ['React', 'TypeScript', 'UI']

const DEFAULT_CANDIDATE: JobPostCandidate = {
  name: 'Marta Ríos',
  note: '5 años montando interfaces que no dan vergüenza ajena.',
  match: 92,
}

type Theme = ReturnType<typeof useNeoTheme>

/**
 * JobPostWidget — a neumorphic recruitment card.
 * ───────────────────────────────────────────────
 * AiKit redacta la vacante, filtra los CVs y te agenda las entrevistas: tú solo
 * decides a quién contratas. Arriba el puesto con su sitio y tipo de jornada,
 * un resumen y los skills en chips suaves. Una hairline, y debajo el candidato
 * destacado: avatar con iniciales, nota, un chip verde de match y el botón para
 * agendar. Re-iluminado en vivo por el NeoTheme activo como el resto de widgets.
 */
export function JobPostWidget({
  role = 'Desarrollador/a Frontend',
  location = 'Madrid · Híbrido',
  type = 'Jornada completa',
  summary = 'Buscamos a alguien con buen gusto para montar la interfaz. El papeleo lo hacemos nosotros.',
  skills = DEFAULT_SKILLS,
  candidate = DEFAULT_CANDIDATE,
}: JobPostWidgetProps) {
  const theme = useNeoTheme()
  const hairline = `1px solid ${theme.gridLine}`
  const green = BRAND.green

  return (
    <NeoCard width={380} center={false} padding={28} radius={28} style={{ gap: 20 }}>
      {/* Top: role title + location chip + contract-type tag. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: -0.5,
            color: theme.textStrong,
            lineHeight: 1.15,
          }}
        >
          {role}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Recessed location well with a pin glyph. */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 500,
              color: theme.textMuted,
              padding: '4px 11px 4px 9px',
              ...elevation(theme, { depth: 'recessed', distance: 2, blur: 6, radius: 999 }),
            }}
          >
            <Icon name="location" size={13} color={theme.textMuted} strokeWidth={1.8} />
            {location}
          </span>

          {/* Tinted contract-type tag. */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.2,
              color: KIT_BLUE,
              background: `${KIT_BLUE}1f`,
              borderRadius: 999,
              padding: '4px 11px',
            }}
          >
            {type}
          </span>
        </div>
      </div>

      {/* One-line summary. */}
      <span style={{ fontSize: 13.5, lineHeight: 1.45, letterSpacing: -0.2, color: theme.textMuted }}>
        {summary}
      </span>

      {/* Skill tags. */}
      {skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {skills.map((skill) => (
            <span
              key={skill}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: theme.textStrong,
                background: `${theme.textMuted}1f`,
                borderRadius: 8,
                padding: '4px 10px',
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div style={{ borderTop: hairline }} />

      {/* Candidato destacado. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: theme.textMuted,
          }}
        >
          Candidato destacado
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <Avatar name={candidate.name} theme={theme} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: theme.textStrong }}>
                {candidate.name}
              </span>
              {/* Green tinted match chip. */}
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  color: green,
                  background: `${green}22`,
                  borderRadius: 999,
                  padding: '2px 8px',
                  whiteSpace: 'nowrap',
                }}
              >
                {candidate.match}% match
              </span>
            </div>
            {candidate.note && (
              <span style={{ fontSize: 12, lineHeight: 1.35, color: theme.textMuted }}>
                {candidate.note}
              </span>
            )}
          </div>
        </div>

        <NeoButton size="sm" accent icon="calendar">
          Agendar entrevista
        </NeoButton>

        {/* Tiny caption. */}
        <span style={{ fontSize: 11, color: theme.textMuted, textAlign: 'center' }}>
          +3 candidatos nuevos esta semana
        </span>
      </div>
    </NeoCard>
  )
}

function Avatar({ name, theme }: { name: string; theme: Theme }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      style={{
        width: 46,
        height: 46,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: TEXT_FONT,
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: -0.3,
        color: KIT_BLUE,
        ...elevation(theme, { depth: 'raised', distance: 4, blur: 9, radius: 999 }),
      }}
    >
      {initials}
    </div>
  )
}
