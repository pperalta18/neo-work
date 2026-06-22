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
  /**
   * Drive the typing dots deterministically from this frame instead of the CSS
   * loop. Pass `useCurrentFrame()` inside a Remotion composition so the bob
   * survives the frame-by-frame export (CSS animations render frozen). Omit in
   * Storybook / live DOM — the dots keep their CSS loop.
   */
  typingFrame?: number
  children?: ReactNode
}

/**
 * NeoMessage — a chat bubble.
 * ───────────────────────────
 * Received bubbles are raised neumorphic plates aligned left; sent bubbles are a
 * solid blue plate aligned right. A `typing` state shows three pulsing dots.
 */
export function NeoMessage({ from = 'them', time, typing = false, typingFrame, children }: NeoMessageProps) {
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
        {typing ? <TypingDots color={theme.textMuted} frame={typingFrame} /> : children}
      </div>
      {time && (
        <span style={{ fontSize: 11, color: theme.textMuted, padding: '0 6px' }}>{time}</span>
      )}
    </div>
  )
}

/** Deterministic bob for dot `i` at `frame` (fps 30) — the exact port of the CSS
 * keyframes (rest at 0/60/100%, peak −4px/opacity 1 at 30%), smoothstepped. */
function dotPose(frame: number, i: number): { y: number; opacity: number } {
  const period = 36 // 1.2s @30fps
  const delay = 5.4 // 0.18s stagger
  const p = (((frame - i * delay) % period) + period) % period
  const up = 0.3 * period
  const down = 0.6 * period
  const lin = p < up ? p / up : p < down ? (down - p) / (down - up) : 0
  const t = lin * lin * (3 - 2 * lin)
  return { y: -4 * t, opacity: 0.35 + 0.65 * t }
}

function TypingDots({ color, frame }: { color: string; frame?: number }) {
  const driven = frame != null
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 8 }}>
      {!driven && (
        <style>{`@keyframes neo-typing{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-4px);opacity:1}}`}</style>
      )}
      {[0, 1, 2].map((i) => {
        const pose = driven ? dotPose(frame, i) : null
        return (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: color,
              ...(pose
                ? { transform: `translateY(${pose.y}px)`, opacity: pose.opacity }
                : {
                    animation: 'neo-typing 1.2s ease-in-out infinite',
                    animationDelay: `${i * 0.18}s`,
                  }),
            }}
          />
        )
      })}
    </div>
  )
}
