import type { ReactNode } from 'react'
import { elevation, KIT_BLUE, TEXT_FONT } from '@/lib/neumorphism'
import { useNeoTheme } from './NeoTheme'

export type NeoMessageProps = {
  /** 'them' = received (raised, left); 'me' = sent (blue, right). */
  from?: 'them' | 'me'
  /** Timestamp shown under the bubble. */
  time?: string
  /** Show the animated "typing…" dots instead of children. */
  typing?: boolean
  children?: ReactNode
}

/**
 * NeoMessage — a chat bubble.
 * ───────────────────────────
 * Received bubbles are raised neumorphic plates aligned left; sent bubbles are a
 * solid blue plate aligned right. A `typing` state shows three pulsing dots.
 */
export function NeoMessage({ from = 'them', time, typing = false, children }: NeoMessageProps) {
  const theme = useNeoTheme()
  const mine = from === 'me'
  const plate = elevation(theme, { depth: 'raised', distance: 5, blur: 12, radius: 20 })

  const tail = mine
    ? { borderBottomRightRadius: 6 }
    : { borderBottomLeftRadius: 6 }

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
          padding: typing ? '14px 18px' : '12px 16px',
          fontFamily: TEXT_FONT,
          fontSize: 15,
          lineHeight: '21px',
          letterSpacing: -0.2,
          ...plate,
          ...tail,
          ...(mine
            ? { backgroundColor: KIT_BLUE, color: '#fff' }
            : { color: theme.textStrong }),
        }}
      >
        {typing ? <TypingDots color={theme.textMuted} /> : children}
      </div>
      {time && (
        <span style={{ fontSize: 11, color: theme.textMuted, padding: '0 6px' }}>{time}</span>
      )}
    </div>
  )
}

function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 8 }}>
      <style>{`@keyframes neo-typing{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-4px);opacity:1}}`}</style>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: color,
            animation: 'neo-typing 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
    </div>
  )
}
