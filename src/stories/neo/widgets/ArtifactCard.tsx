import { KIT_BLUE } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

/** Source app of the shared artifact — drives the link icon glyph + colour. */
export type ArtifactKind = 'slides' | 'docs' | 'sheets' | 'pdf' | 'link'

export type ArtifactPalette = {
  /** Left panel background. */
  left: string
  /** Right (chart) panel background. */
  right: string
  /** Dot + dark ink colour. */
  ink: string
  /** Strong heading colour. */
  strong: string
  /** Muted label colour. */
  muted: string
}

export type ArtifactCardProps = {
  /** Small bold lead word in the eyebrow (e.g. "AGROTECH"). */
  eyebrow?: string
  /** Date / context after the eyebrow word. */
  date?: string
  /** Serif headline. */
  title?: string
  /** Mono uppercase subtitle. */
  subtitle?: string
  /** Mono uppercase footer label. */
  footer?: string
  /** Big highlighted figure (e.g. "44%"). */
  stat?: string
  /** Words shown next to the stat (wrap onto two lines). */
  statWords?: string[]
  /** Dot-matrix columns / rows. */
  cols?: number
  rows?: number
  /** Shared link URL (truncated with an ellipsis). */
  url?: string
  /** Message timestamp shown under the link. */
  time?: string
  /** Which app the artifact comes from (icon + colour). */
  kind?: ArtifactKind
  /** Poster colour palette (lavender by default). */
  palette?: ArtifactPalette
  /** Card width (px). */
  width?: number
}

const MONO = "'SF Mono', 'SFMono-Regular', ui-monospace, 'Cascadia Code', Menlo, monospace"
const SERIF = "'Iowan Old Style', Georgia, 'Times New Roman', serif"

const DEFAULT_PALETTE: ArtifactPalette = {
  left: '#bcbad8',
  right: '#cdcbf2',
  ink: '#56557e',
  strong: '#2c2c40',
  muted: '#6a6a86',
}

const KIND_COLOR: Record<Exclude<ArtifactKind, 'link'>, string> = {
  slides: '#f5a623',
  docs: KIT_BLUE,
  sheets: '#1aa463',
  pdf: '#ff4d40',
}

/**
 * ArtifactCard — a chat "shared document" card.
 * ──────────────────────────────────────────────
 * The bubble that appears in a conversation when an artifact is shared: a
 * raised NeoCard (so it floats + re-lights with the theme) wrapping a poster
 * preview (a two-panel slide: serif title on the left, a dot-matrix stat on
 * the right), the source link with its app icon, and a timestamp.
 */
export function ArtifactCard({
  eyebrow = 'AGROTECH',
  date = 'MARCH 12-13, 2026',
  title = 'AgroTech VC',
  subtitle = 'INVESTMENT LANDSCAPE',
  footer = 'MARKET ANALYSIS',
  stat = '44%',
  statWords = ['ADV ROUNDS', 'AGRO ROUNDS', 'CROP BIOTECH'],
  cols = 8,
  rows = 7,
  url = 'https://docs.google.com/presentation/d/1FHqo',
  time = '01:36 pm',
  kind = 'slides',
  palette = DEFAULT_PALETTE,
  width = 560,
}: ArtifactCardProps) {
  const theme = useNeoTheme()
  const minH = Math.round((width - 36) * 0.46)

  return (
    <NeoCard width={width} center={false} padding={18} radius={24} style={{ gap: 14 }}>
      {/* Poster preview */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          minHeight: minH,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Left: title panel */}
        <div
          style={{
            flex: 1.12,
            background: palette.left,
            padding: '24px 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 18,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 0.4, color: palette.strong }}>
              <strong style={{ fontWeight: 700 }}>{eyebrow}</strong>
              {date ? <span style={{ color: palette.muted }}> {date}</span> : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: SERIF, fontSize: 38, lineHeight: 1.02, color: palette.strong }}>
                {title}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 14,
                  letterSpacing: 1.2,
                  color: palette.muted,
                }}
              >
                {subtitle}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ height: 1, width: '82%', background: `${palette.strong}40` }} />
            <span style={{ fontFamily: MONO, fontSize: 12.5, letterSpacing: 1, color: palette.muted }}>
              {footer}
            </span>
          </div>
        </div>

        {/* Right: chart panel */}
        <div
          style={{
            flex: 1,
            background: palette.right,
            padding: '24px 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <DotMatrix cols={cols} rows={rows} color={palette.ink} />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 48,
                lineHeight: 0.82,
                fontWeight: 500,
                color: palette.strong,
              }}
            >
              {stat}
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
                lineHeight: 1.35,
                color: palette.strong,
                paddingBottom: 3,
              }}
            >
              {statWords.join(' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Link row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 4px' }}>
        <KindIcon kind={kind} />
        <a
          href={url}
          style={{
            fontFamily: MONO,
            fontSize: 16,
            color: KIT_BLUE,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {url}
        </a>
      </div>

      {/* Timestamp */}
      <span style={{ fontFamily: MONO, fontSize: 14, color: theme.textMuted, padding: '0 4px' }}>
        {time}
      </span>
    </NeoCard>
  )
}

/** The dot-matrix chart — the top row fades out toward the right. */
function DotMatrix({ cols, rows, color }: { cols: number; rows: number; color: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 7,
      }}
    >
      {Array.from({ length: cols * rows }).map((_, i) => {
        const row = Math.floor(i / cols)
        const col = i % cols
        // First row dims progressively past the third dot (the reference look).
        const opacity = row === 0 && col >= 3 ? Math.max(0.32, 1 - (col - 2) * 0.13) : 1
        return (
          <div
            key={i}
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: '50%',
              background: color,
              opacity,
            }}
          />
        )
      })}
    </div>
  )
}

/** The app glyph next to the link (Google-app style square, or a globe). */
function KindIcon({ kind }: { kind: ArtifactKind }) {
  if (kind === 'link') {
    return <Icon name="global" size={26} color={KIT_BLUE} strokeWidth={1.8} />
  }
  const bg = KIND_COLOR[kind]
  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <div style={{ width: 12, height: 10, borderRadius: 2, background: '#fff' }} />
    </div>
  )
}
