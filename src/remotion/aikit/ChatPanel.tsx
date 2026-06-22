import type { CSSProperties } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { elevation, KIT_BLUE, BRAND, TEXT_FONT, lightTheme, type NeoTheme } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { CURVE, DUR, ease } from '../motion'
import {
  type ChatLine,
  visibleLines,
  typingLine,
  composingLine,
  composedText,
  typingDotPose,
} from './chatScript'

export type { ChatLine }

export type ChatPanelProps = {
  /** The scripted conversation. See chatScript.ts for the timeline contract. */
  script: readonly ChatLine[]
  /** Header title — the app identity. */
  title?: string
  /** Muted line under the title, e.g. the workspace / company. */
  subtitle?: string
  width?: number
  height?: number
  theme?: NeoTheme
  placeholder?: string
  /** Local frame override; defaults to useCurrentFrame() (wrap in <Sequence> to offset). */
  frame?: number
  style?: CSSProperties
}

/**
 * ChatPanel — the scripted AiKit chat, frame-driven end to end.
 * ─────────────────────────────────────────────────────────────
 * Port of ConversationVideo's mechanics into the shared kit: bubbles commit at
 * `showAt`; a 'me' lead-up types letter by letter into the composer; a 'them'
 * lead-up shows a typing-dots bubble (deterministic bob — no CSS animation).
 * App chrome with header per the spec; themed by prop, not context, so the
 * panel is self-contained inside any scene.
 */
export function ChatPanel({
  script,
  title = 'AiKit',
  subtitle,
  width = 580,
  height = 760,
  theme = lightTheme,
  placeholder = 'Escribe un mensaje…',
  frame: frameProp,
  style,
}: ChatPanelProps) {
  const globalFrame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const frame = frameProp ?? globalFrame

  const shown = visibleLines(script, frame)
  const thinking = typingLine(script, frame)
  const composing = composingLine(script, frame)
  const inputValue = composing ? composedText(composing, frame) : ''

  // Bubble entrance: settle up from slightly below + faded. Eased interpolate
  // per the motion language (no spring — calm, no bounce).
  const enter = (since: number, from: 'me' | 'them'): CSSProperties => {
    const t = ease(frame, since, since + DUR.base, CURVE.enter)
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: from === 'me' ? 'flex-end' : 'flex-start',
      opacity: t,
      transform: `translateY(${(1 - t) * 14}px) scale(${0.97 + 0.03 * t})`,
    }
  }

  const card = elevation(theme, { depth: 'raised', distance: 10, blur: 22, radius: 40 })
  // Composer presses in while a line is being typed, sits raised at rest.
  const pill = elevation(theme, {
    depth: composing ? 'recessed' : 'raised',
    distance: 7,
    blur: 16,
    radius: 999,
  })
  // Caret blinks on a fixed frame cycle — deterministic, render-stable.
  const caretOn = composing != null && frame % 30 < 18

  return (
    <div
      style={{
        width,
        height,
        boxSizing: 'border-box',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TEXT_FONT,
        color: theme.textStrong,
        ...card,
        ...style,
      }}
    >
      <Header theme={theme} title={title} subtitle={subtitle} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          justifyContent: 'flex-end',
          flex: 1,
          minHeight: 0,
          paddingBottom: 22,
          // A long thread clips at the top — history scrolled past, the chat
          // idiom — instead of spilling over the header.
          overflow: 'hidden',
        }}
      >
        {shown.map((l) => (
          <div key={`${l.showAt}-${l.from}`} style={enter(l.showAt, l.from)}>
            <Bubble theme={theme} from={l.from} time={l.time}>
              {l.text}
            </Bubble>
          </div>
        ))}
        {thinking && (
          <div style={enter(thinking.typeStart!, 'them')}>
            <Bubble theme={theme} from="them">
              <TypingDots frame={frame} fps={fps} color={theme.textMuted} />
            </Bubble>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          boxSizing: 'border-box',
          padding: '16px 20px',
          ...pill,
        }}
      >
        <Icon name="plus" size={20} color={theme.textMuted} strokeWidth={1.6} />
        <span
          style={{
            flex: 1,
            fontSize: 16,
            letterSpacing: -0.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            color: inputValue ? theme.textStrong : theme.textMuted,
          }}
        >
          {inputValue || (composing ? '' : placeholder)}
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: 18,
              marginLeft: 1,
              verticalAlign: 'text-bottom',
              backgroundColor: KIT_BLUE,
              opacity: caretOn ? 1 : 0,
            }}
          />
        </span>
        <span style={{ display: 'flex', color: inputValue ? KIT_BLUE : theme.textMuted, opacity: inputValue ? 1 : 0.45 }}>
          <Icon name="arrow" size={20} strokeWidth={1.8} />
        </span>
      </div>
    </div>
  )
}

/** App chrome: AiKit identity badge + title, quiet status at the right. */
function Header({ theme, title, subtitle }: { theme: NeoTheme; title: string; subtitle?: string }) {
  const badge = elevation(theme, { depth: 'raised', distance: 4, blur: 9, radius: 14 })
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        paddingBottom: 20,
        marginBottom: 6,
        borderBottom: `1px solid ${theme.gridLine}`,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...badge,
        }}
      >
        <Icon name="sparkles" size={22} color={KIT_BLUE} strokeWidth={1.7} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>{title}</span>
        {subtitle && <span style={{ fontSize: 12.5, color: theme.textMuted }}>{subtitle}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: BRAND.green }} />
        <span style={{ fontSize: 12.5, color: theme.textMuted }}>en línea</span>
      </div>
    </div>
  )
}

/** Chat bubble — NeoMessage ported inline: themed by prop, no context. */
function Bubble({
  theme,
  from,
  time,
  children,
}: {
  theme: NeoTheme
  from: 'me' | 'them'
  time?: string
  children?: React.ReactNode
}) {
  const mine = from === 'me'
  const plate = elevation(theme, { depth: 'raised', distance: 5, blur: 12, radius: 20 })
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: mine ? 'flex-end' : 'flex-start',
        gap: 5,
        maxWidth: '78%',
        alignSelf: mine ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          fontSize: 15,
          lineHeight: '21px',
          letterSpacing: -0.2,
          ...plate,
          ...(mine ? { borderBottomRightRadius: 6 } : { borderBottomLeftRadius: 6 }),
          ...(mine ? { backgroundColor: KIT_BLUE, color: '#fff' } : { color: theme.textStrong }),
        }}
      >
        {children}
      </div>
      {time && <span style={{ fontSize: 11, color: theme.textMuted, padding: '0 6px' }}>{time}</span>}
    </div>
  )
}

/** Frame-driven typing dots — the deterministic port of NeoMessage's CSS bob. */
function TypingDots({ frame, fps, color }: { frame: number; fps: number; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 8, padding: '2px 1px' }}>
      {[0, 1, 2].map((i) => {
        const { y, opacity } = typingDotPose(frame, i, fps)
        return (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: color,
              opacity,
              transform: `translateY(${y}px)`,
            }}
          />
        )
      })}
    </div>
  )
}
