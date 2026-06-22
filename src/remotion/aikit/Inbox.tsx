import type { CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { BRAND, KIT_BLUE, TEXT_FONT, elevation, lightTheme, type BrandColor, type NeoTheme } from '@/lib/neumorphism'
import { DUR, ease } from '../motion'
import { rowPresence } from './widgetScript'

export type InboxChannel = 'email' | 'whatsapp' | 'chat' | 'web'

export type InboxRow = {
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
  /** Frame the row slides into the list (the email arriving). Omit = already there. */
  showAt?: number
  /** Frame the row highlights (the click that opens it). Omit = never. */
  selectAt?: number
}

export type InboxProps = {
  /** Header label. */
  title?: string
  /** The conversation rows, newest first. */
  items: readonly InboxRow[]
  width?: number
  /** Uniform row pitch (px) — fixed so arrivals can collapse deterministically. */
  rowHeight?: number
  theme?: NeoTheme
  /** Draw the raised card plate. Turn off inside an AppWindow viewport. */
  plate?: boolean
  /** Panel entrance start. Default 0. */
  enterAt?: number
  /** Local frame override; defaults to useCurrentFrame() (wrap in <Sequence> to offset). */
  frame?: number
  style?: CSSProperties
}

const CHANNEL: Record<InboxChannel, { color: BrandColor; label: string }> = {
  email: { color: 'blue', label: 'Correo' },
  whatsapp: { color: 'green', label: 'WhatsApp' },
  chat: { color: 'violet', label: 'Chat' },
  web: { color: 'orange', label: 'Web' },
}

/**
 * Inbox — InboxWidget ported inline, frame-driven.
 * ────────────────────────────────────────────────
 * The mode Prod01/Prod02 use: the multichannel list at rest until the email
 * arrives — a row with `showAt` grows into the top of the list (height +
 * fade, pushing the rest down) — and is clicked (`selectAt` lifts it on the
 * blue tint, the unread counter follows along). Copy comes from the scene
 * (CAST), themed by prop, deterministic per frame.
 */
export function Inbox({
  title = 'Bandeja',
  items,
  width = 420,
  rowHeight = 62,
  theme = lightTheme,
  plate = true,
  enterAt = 0,
  frame: frameProp,
  style,
}: InboxProps) {
  const globalFrame = useCurrentFrame()
  const frame = frameProp ?? globalFrame

  const enter = ease(frame, enterAt, enterAt + DUR.reveal)
  const card = plate
    ? elevation(theme, { depth: 'raised', distance: 10, blur: 22, radius: 28 })
    : {}
  const list = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 18 })
  const hairline = `1px solid ${theme.gridLine}`

  // Unread = rows present on screen at this frame still flagged unread.
  const unreadCount = items.filter((it) => it.unread && rowPresence(it.showAt, frame) > 0).length

  return (
    <div
      style={{
        width,
        boxSizing: 'border-box',
        padding: plate ? 22 : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: TEXT_FONT,
        ...card,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 16}px)`,
        ...style,
      }}
    >
      {/* Header: title + live unread count, plus the quiet "Todos" filter chip. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3, color: theme.textStrong }}>
            {title}
          </span>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
              color: theme.textMuted,
            }}
          >
            {unreadCount} sin leer
          </span>
        </div>
        <FilterChip label="Todos" theme={theme} />
      </div>

      {/* Recessed list well holding the rows. */}
      <div style={{ padding: 6, display: 'flex', flexDirection: 'column', ...list }}>
        {items.map((it, i) => (
          <Row
            key={i}
            item={it}
            frame={frame}
            theme={theme}
            rowHeight={rowHeight}
            divider={i > 0 ? hairline : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function Row({
  item,
  frame,
  theme,
  rowHeight,
  divider,
}: {
  item: InboxRow
  frame: number
  theme: NeoTheme
  rowHeight: number
  divider?: string
}) {
  const presence = rowPresence(item.showAt, frame)
  if (presence === 0) return null

  const ch = CHANNEL[item.channel]
  const accent = BRAND[ch.color]
  const raised = elevation(theme, { depth: 'raised', distance: 3, blur: 8, radius: 14 })

  // The click highlight: tint fades in fast, the lift lands with it.
  const selected = item.selectAt != null && frame >= item.selectAt
  const select = item.selectAt != null ? ease(frame, item.selectAt, item.selectAt + DUR.micro) : 0
  const tintAlpha = Math.round(select * 0x14)
    .toString(16)
    .padStart(2, '0')

  return (
    // Arrival wrapper: the row grows into its slot, pushing the list apart.
    <div
      style={{
        height: rowHeight * presence,
        overflow: presence < 1 ? 'hidden' : 'visible',
        opacity: presence,
      }}
    >
      <div
        style={{
          height: rowHeight,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 12px',
          borderRadius: 14,
          transform: `translateY(${(1 - presence) * -10}px)`,
          // Selected row lifts on a faint blue tint; the divider tucks under it.
          ...(selected
            ? { ...raised, backgroundColor: `${KIT_BLUE}${tintAlpha}`, borderTop: '1px solid transparent' }
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
            marginTop: 12,
          }}
        >
          {item.time}
        </span>
      </div>
    </div>
  )
}

function FilterChip({ label, theme }: { label: string; theme: NeoTheme }) {
  const chip = elevation(theme, { depth: 'raised', distance: 4, blur: 8, radius: 999 })
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '6px 12px',
        ...chip,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: KIT_BLUE }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: theme.textStrong }}>{label}</span>
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.textMuted}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
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
  theme: NeoTheme
}) {
  const badge = elevation(theme, { depth: 'raised', distance: 3, blur: 7, radius: 11 })
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
        ...badge,
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
