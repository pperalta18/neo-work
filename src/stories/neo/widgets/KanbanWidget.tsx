import { BRAND, elevation, TEXT_FONT, type BrandColor } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

export type KanbanCard = {
  title: string
  /** Short tag / label shown above the title. */
  tag?: string
  /** Accent colour of the tag + left rail. */
  color?: BrandColor
  /** Number of people on the card (drawn as overlapping avatar dots). */
  people?: number
}

export type KanbanColumn = {
  title: string
  cards: KanbanCard[]
}

export type KanbanWidgetProps = {
  /** Board title shown in the header. */
  title?: string
  /** The lanes, left to right. */
  columns?: KanbanColumn[]
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  {
    title: 'Por hacer',
    cards: [
      { title: 'Wireframes home', tag: 'Diseño', color: 'violet', people: 2 },
      { title: 'Definir API pagos', tag: 'Backend', color: 'blue', people: 1 },
    ],
  },
  {
    title: 'En curso',
    cards: [
      { title: 'Onboarding flow', tag: 'Producto', color: 'orange', people: 3 },
    ],
  },
  {
    title: 'Hecho',
    cards: [
      { title: 'Setup CI/CD', tag: 'Infra', color: 'teal', people: 1 },
      { title: 'Landing v1', tag: 'Marketing', color: 'green', people: 2 },
    ],
  },
]

/**
 * KanbanWidget — a neumorphic board abstraction.
 * ──────────────────────────────────────────────
 * Recessed lanes hold raised task cards, each with a coloured rail + tag, a
 * title and an overlapping avatar stack. A count chip sits next to every lane
 * title. Re-lit live by the active NeoTheme like the rest of the gallery.
 */
export function KanbanWidget({
  title = 'Sprint 14',
  columns = DEFAULT_COLUMNS,
}: KanbanWidgetProps) {
  const theme = useNeoTheme()
  const lane = elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: 16 })

  return (
    <NeoCard width={520} center={false} padding={22} radius={28} style={{ gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 9, height: 9, borderRadius: 3, background: BRAND.blue }} />
        <span style={{ fontSize: 17, fontWeight: 600, color: theme.textStrong }}>{title}</span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {columns.map((col, i) => (
          <div key={i} style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 10, ...lane }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '2px 2px 0' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.textStrong }}>{col.title}</span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: theme.textMuted,
                  background: `${theme.textMuted}22`,
                  borderRadius: 999,
                  padding: '1px 7px',
                }}
              >
                {col.cards.length}
              </span>
            </div>
            {col.cards.map((card, j) => (
              <Card key={j} card={card} theme={theme} />
            ))}
          </div>
        ))}
      </div>
    </NeoCard>
  )
}

type Theme = ReturnType<typeof useNeoTheme>

function Card({ card, theme }: { card: KanbanCard; theme: Theme }) {
  const plate = elevation(theme, { depth: 'raised', distance: 4, blur: 9, radius: 12 })
  const color = BRAND[card.color ?? 'blue']
  const people = card.people ?? 0

  return (
    <div
      style={{
        position: 'relative',
        padding: '11px 12px 11px 15px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontFamily: TEXT_FONT,
        overflow: 'hidden',
        ...plate,
      }}
    >
      {/* Coloured left rail. */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: color }} />

      {card.tag && (
        <span
          style={{
            alignSelf: 'flex-start',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.3,
            color,
            background: `${color}1f`,
            borderRadius: 6,
            padding: '2px 7px',
          }}
        >
          {card.tag}
        </span>
      )}
      <span style={{ fontSize: 13, fontWeight: 500, color: theme.textStrong, lineHeight: 1.3 }}>
        {card.title}
      </span>

      {people > 0 && (
        <div style={{ display: 'flex' }}>
          {Array.from({ length: people }).map((_, k) => (
            <div
              key={k}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: BRAND[(['blue', 'pink', 'green', 'orange', 'violet'] as BrandColor[])[k % 5]],
                border: `2px solid ${theme.surface}`,
                marginLeft: k === 0 ? 0 : -6,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
