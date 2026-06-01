import { BRAND, KIT_BLUE, elevation, TEXT_FONT, type BrandColor } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

export type InboxChannel = 'email' | 'whatsapp' | 'chat' | 'web'

export type InboxItem = {
  /** Which inbox this ticket arrived through. Sets the badge glyph + colour. */
  channel: InboxChannel
  /** Who wrote in (shown bold). */
  sender: string
  /** First line of the message — clipped to one line with an ellipsis. */
  preview: string
  /** Right-aligned timestamp, free text. */
  time: string
  /** Draws a KIT_BLUE unread dot. */
  unread?: boolean
  /** Highlights the row (subtle blue tint + slight raise). */
  selected?: boolean
}

export type InboxWidgetProps = {
  /** Header label. */
  title?: string
  /** The conversation rows, newest first. */
  items?: InboxItem[]
}

const DEFAULT_ITEMS: InboxItem[] = [
  {
    channel: 'whatsapp',
    sender: 'Lucía Marín',
    preview: '¿Me podéis pasar el presupuesto antes del viernes? 🙏',
    time: '2 min',
    unread: true,
    selected: true,
  },
  {
    channel: 'email',
    sender: 'Soporte Acme',
    preview: 'Reenvío la factura, esta vez con el IVA bien puesto.',
    time: '18 min',
    unread: true,
  },
  {
    channel: 'chat',
    sender: 'Visitante #4821',
    preview: 'Hola, ¿esto lo hacéis vosotros o lo hace un robot? 👀',
    time: '1 h',
  },
  {
    channel: 'web',
    sender: 'Formulario · Contacto',
    preview: 'Quiero automatizar el rollo aburrido de mi tienda online.',
    time: '3 h',
    unread: true,
  },
  {
    channel: 'email',
    sender: 'Carlos Vidal',
    preview: 'Perfecto, dejádmelo a vosotros. Yo no quiero ni verlo 😅',
    time: 'Ayer',
  },
]

type Theme = ReturnType<typeof useNeoTheme>

const CHANNEL: Record<InboxChannel, { color: BrandColor; label: string }> = {
  email: { color: 'blue', label: 'Correo' },
  whatsapp: { color: 'green', label: 'WhatsApp' },
  chat: { color: 'violet', label: 'Chat' },
  web: { color: 'orange', label: 'Web' },
}

/**
 * InboxWidget — a multichannel inbox abstraction.
 * ────────────────────────────────────────────────
 * One recessed list holds every ticket — correo, chat, WhatsApp y web — each
 * row tagged by a small coloured channel badge, a bold sender, a single-line
 * preview that quietly clips, a timestamp and an optional unread dot. The active
 * row lifts on a soft KIT_BLUE tint. Re-lit live by the NeoTheme like the rest.
 */
export function InboxWidget({ title = 'Bandeja', items = DEFAULT_ITEMS }: InboxWidgetProps) {
  const theme = useNeoTheme()
  const list = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 18 })
  const hairline = `1px solid ${theme.gridLine}`

  return (
    <NeoCard width={420} center={false} padding={22} radius={28} style={{ gap: 16 }}>
      {/* Header: title + unread count, plus a small "Todos" filter chip. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3, color: theme.textStrong }}>
            {title}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: theme.textMuted }}>
            {items.filter((it) => it.unread).length} sin leer
          </span>
        </div>
        <FilterChip label="Todos" theme={theme} />
      </div>

      {/* Recessed list well holding the rows. */}
      <div style={{ padding: 6, display: 'flex', flexDirection: 'column', ...list }}>
        {items.map((it, i) => (
          <Row key={i} item={it} theme={theme} divider={i > 0 ? hairline : undefined} />
        ))}
      </div>
    </NeoCard>
  )
}

function FilterChip({ label, theme }: { label: string; theme: Theme }) {
  const plate = elevation(theme, { depth: 'raised', distance: 4, blur: 8, radius: 999 })
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '6px 12px',
        fontFamily: TEXT_FONT,
        ...plate,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: KIT_BLUE }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: theme.textStrong }}>{label}</span>
      <Chevron color={theme.textMuted} />
    </div>
  )
}

function Row({ item, theme, divider }: { item: InboxItem; theme: Theme; divider?: string }) {
  const ch = CHANNEL[item.channel]
  const accent = BRAND[ch.color]
  const raised = elevation(theme, { depth: 'raised', distance: 3, blur: 8, radius: 14 })

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 12px',
        borderRadius: 14,
        fontFamily: TEXT_FONT,
        // Selected row lifts on a faint blue tint; the divider tucks under it.
        ...(item.selected
          ? { ...raised, backgroundColor: `${KIT_BLUE}14`, borderTop: '1px solid transparent' }
          : { borderTop: divider ?? '1px solid transparent' }),
      }}
    >
      <ChannelBadge channel={item.channel} color={accent} theme={theme} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              letterSpacing: -0.2,
              color: theme.textStrong,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.sender}
          </span>
          {item.unread && (
            <span
              style={{
                flexShrink: 0,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: KIT_BLUE,
              }}
            />
          )}
        </div>
        <span
          style={{
            fontSize: 12.5,
            letterSpacing: -0.2,
            color: theme.textMuted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.preview}
        </span>
      </div>

      <span
        style={{
          flexShrink: 0,
          fontSize: 11,
          fontWeight: 500,
          color: theme.textMuted,
          whiteSpace: 'nowrap',
          alignSelf: 'flex-start',
          marginTop: 1,
        }}
      >
        {item.time}
      </span>
    </div>
  )
}

function ChannelBadge({
  channel,
  color,
  theme,
}: {
  channel: InboxChannel
  color: string
  theme: Theme
}) {
  const plate = elevation(theme, { depth: 'raised', distance: 3, blur: 7, radius: 11 })
  return (
    <div
      style={{
        flexShrink: 0,
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        ...plate,
        // Tint the badge in its channel colour (overrides the plate's surface).
        backgroundColor: `${color}1f`,
      }}
    >
      <ChannelGlyph channel={channel} />
    </div>
  )
}

function ChannelGlyph({ channel }: { channel: InboxChannel }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (channel) {
    case 'email':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M3.5 7.5 12 13l8.5-5.5" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg {...common}>
          <path d="M4 20l1.4-4A8 8 0 1 1 8 18.6L4 20Z" />
          <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5" />
        </svg>
      )
    case 'chat':
      return (
        <svg {...common}>
          <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V6a1 1 0 0 1 1-1Z" />
          <path d="M9 10h6M9 13h3" />
        </svg>
      )
    case 'web':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17" />
        </svg>
      )
  }
}

function Chevron({ color }: { color: string }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
