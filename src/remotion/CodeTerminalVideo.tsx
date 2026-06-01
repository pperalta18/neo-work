import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { buildStream, COLORS, type Tok } from './codeStream'
import { Fonts } from './fonts'

/**
 * CodeTerminalVideo — a terminal where a `pnpm build` log flies by "a toda
 * pastilla" and lands on the success summary.
 *
 * The reel is a pre-generated block (see codeStream), but it is *printed*, not
 * panned: a monotonic `emitted` count (lines, fractional) drives everything.
 * Only lines up to the leading edge are drawn, that line types in char by char
 * with a write-head caret, and nothing below it exists yet — so there's no
 * pre-existing content sliding up into view, which is what read as "scrolling".
 * The screen first fills downward from the top (no scroll); once the printed
 * lines outgrow the viewport, the oldest scroll off the top like a live tail.
 *
 * Motion blur is *real* directional blur, not a gaussian defocus: within each
 * frame's shutter we sample `emitted` at N sub-positions and stack those copies
 * additively (`plus-lighter`) at opacity 1/N. At rest the copies coincide → one
 * crisp, full-brightness frame; in motion they spread along the travel axis →
 * a vertical streak whose length tracks speed. That reads as velocity.
 *
 * Timeline (30fps):
 *   0–16    hold    — command types in at the top, then caret blinks
 *   16–40   prime   — lines print at a steady, readable pace and fill the screen (no scroll yet)
 *   40–98   accel   — progressive ramp: scroll + its motion-blur build up *gradually*, near-crisp → peak
 *   98–224  cruise  — long, near-linear at a HIGH peak (the "toda pastilla" stretch)
 *   224–258 settle  — linear decel onto the summary
 *   258–290 rest    — parked on ✓ built, blinking prompt cursor
 */

export const CODE_TERMINAL_DURATION = 290

// Terminal geometry (px). LINE_H drives both layout and the scroll maths.
const CARD_W = 1320
const CARD_H = 800
const TITLE_H = 46
const PAD_X = 26
const PAD_Y = 16
const LINE_H = 34
const FONT_SIZE = 19
const BODY_H = CARD_H - TITLE_H
const VISIBLE_H = BODY_H - PAD_Y * 2

const MONO =
  "'SF Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace"

// Timeline keyframes. After a steady "prime" that fills the screen, the scroll
// accelerates *progressively* over a wide window so its speed (and motion blur)
// build up gradually — starting near-crisp and ramping into heavy streak —
// rather than snapping to peak.
const HOLD = 16
const FILL_END = 40
const ACCEL_END = 98
const CRUISE_END = 224
const SETTLE = 258

// Speed (lines/frame) of the steady prime — the readable "typing" pace before
// the scroll starts ramping, and the (low, near-crisp) speed the scroll begins
// at. The cruise peak is solved from the reel length.
const V0 = 0.8

// Head-room (px) the reel keeps above the first line before it has to scroll.
// While the screen fills, content stays parked here and grows *downward* — that
// stretch reads as code being typed, not panned — and it keeps the typed
// command clear of the top edge-fade.
const START_OFFSET = LINE_H * 2

/**
 * Cumulative *lines emitted* at a (possibly fractional) frame. The reel is a
 * build log being printed, not a window panning a finished block: the integer
 * part is how many lines are fully on screen, the fraction is how far the
 * leading line has been typed. Velocity profile: steady prime → progressive
 * linear ramp → flat cruise → linear decel onto the summary.
 */
function emittedAt(frame: number, total: number): number {
  const Tf = FILL_END - HOLD // steady prime
  const Ta = ACCEL_END - FILL_END // progressive ramp
  const Tc = CRUISE_END - ACCEL_END // cruise
  const Ts = SETTLE - CRUISE_END // settle
  // Solve the cruise peak so the whole move is velocity-continuous — steady
  // prime (V0) → linear ramp V0→peak → flat cruise → linear decel to a stop —
  // and the reel lands exactly on the summary at SETTLE. Distances (∫v): prime
  // V0·Tf, ramp ½(V0+peak)·Ta, cruise peak·Tc, decel ½·peak·Ts. Reel length
  // dials the peak up or down — see buildStream() below.
  const peak = (total - 1 - V0 * (Tf + Ta / 2)) / (Ta / 2 + Tc + Ts / 2)
  const eF = 1 + V0 * Tf // end of prime
  const eA = eF + ((V0 + peak) / 2) * Ta // end of ramp
  const eC = eA + peak * Tc // end of cruise

  if (frame <= HOLD) {
    // Type the command line (line 0), then idle a beat with a blinking caret.
    return interpolate(frame, [0, 13], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  }
  if (frame <= FILL_END) {
    // Prime: lines print at a steady, readable pace and stack down the screen.
    return 1 + V0 * (frame - HOLD)
  }
  if (frame <= ACCEL_END) {
    // Progressive acceleration: velocity ramps linearly V0 → peak, so the scroll
    // and its motion-blur streak build up *gradually*, not in a single snap.
    const t = frame - FILL_END
    const a = (peak - V0) / Ta
    return eF + V0 * t + 0.5 * a * t * t
  }
  if (frame <= CRUISE_END) {
    return eA + peak * (frame - ACCEL_END)
  }
  // Settle: linear decel peak → 0, easing the reel onto the summary. Clamp `t`
  // so the parabola can't roll back past its vertex during the rest hold.
  const t = Math.min(frame - CRUISE_END, Ts)
  const d = peak / Ts
  return eC + peak * t - 0.5 * d * t * t
}

/**
 * Px scroll for an emitted-line count. The reel is bottom-fed: until the printed
 * lines outgrow the viewport they stay parked (with START_OFFSET head-room) and
 * grow downward; past that, the oldest scroll off the top like a live tail.
 */
function scrollFromEmitted(emitted: number, dEnd: number): number {
  return Math.min(dEnd, Math.max(-START_OFFSET, emitted * LINE_H - VISIBLE_H))
}

/** Total visible characters in a line (sum of its token strings). */
function lineLen(toks: Tok[]): number {
  let n = 0
  for (const t of toks) n += t.s.length
  return n
}

/** First `n` characters of a token list, preserving colours. */
function sliceToks(toks: Tok[], n: number): Tok[] {
  const out: Tok[] = []
  let left = n
  for (const t of toks) {
    if (left <= 0) break
    if (t.s.length <= left) {
      out.push(t)
      left -= t.s.length
    } else {
      out.push({ s: t.s.slice(0, left), c: t.c })
      left = 0
    }
  }
  return out
}

const dot = (c: string): CSSProperties => ({
  width: 13,
  height: 13,
  borderRadius: '50%',
  background: c,
  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)',
})

function Cursor({ color, on }: { color: string; on: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: FONT_SIZE * 0.56,
        height: FONT_SIZE * 1.05,
        marginLeft: 1,
        transform: 'translateY(3px)',
        background: color,
        opacity: on ? 0.95 : 0,
        borderRadius: 1,
      }}
    />
  )
}

function Line({ top, toks, trailing }: { top: number; toks: Tok[]; trailing?: ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        height: LINE_H,
        lineHeight: `${LINE_H}px`,
        whiteSpace: 'pre',
        overflow: 'hidden',
      }}
    >
      {toks.map((t, i) => (
        <span key={i} style={{ color: COLORS[t.c] }}>
          {t.s}
        </span>
      ))}
      {trailing}
    </div>
  )
}

export function CodeTerminalVideo() {
  const frame = useCurrentFrame()
  // A long reel so the fixed-duration cruise runs at a genuinely high speed.
  const stream = useMemo(() => buildStream(545), [])
  const L = stream.lines.length

  const totalH = L * LINE_H
  const dEnd = totalH - VISIBLE_H

  const emitted = emittedAt(frame, L)
  const emittedPrev = emittedAt(frame - 1, L)
  const scrollY = scrollFromEmitted(emitted, dEnd)

  // ── shutter sampling: how far the reel travels across this frame ───────────
  const prevY = scrollFromEmitted(emittedPrev, dEnd)
  const dist = Math.abs(scrollY - prevY)
  // One sub-sample per ~4px of travel → streak stays dense even at peak speed;
  // capped for cost.
  const SAMPLES = Math.min(24, Math.max(1, Math.ceil(dist / 4)))

  // Caret behaviour: solid while the reel is actively printing, blinking when it
  // idles — the opening command hold and the final parked prompt.
  const blinkOn = Math.floor(frame / 14) % 2 === 0
  const typingNow = emitted - emittedPrev > 0.02
  const caretOn = typingNow || blinkOn
  const showActiveCaret = frame <= SETTLE - 6 // write head follows the leading line
  const showPromptCursor = frame > SETTLE - 6 // …then hands off to the parked prompt
  const running = frame > HOLD && frame < SETTLE
  const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame / 3.5))

  // Render the printed lines for one emitted-count (one shutter sample). Nothing
  // below the leading line is drawn — the bottom is the live write head, so no
  // pre-existing content slides up into view (which is what read as scrolling).
  const renderWindow = (em: number): ReactNode => {
    const y = scrollFromEmitted(em, dEnd)
    const lead = Math.min(Math.floor(em), L - 1)
    const frac = em - lead
    const first = Math.max(0, Math.floor(y / LINE_H) - 1)
    const last = Math.min(lead, Math.ceil((y + VISIBLE_H) / LINE_H) + 1)
    const out: ReactNode[] = []
    for (let idx = first; idx <= last; idx++) {
      const top = idx * LINE_H - y
      const active = idx === lead && showActiveCaret

      if (idx === stream.cmdIndex) {
        const typed = active ? Math.round(frac * stream.command.length) : stream.command.length
        out.push(
          <Line
            key={idx}
            top={top}
            toks={[
              { s: '$ ', c: 'prompt' },
              { s: stream.command.slice(0, typed), c: 'plain' },
            ]}
            trailing={active ? <Cursor color={COLORS.plain} on={caretOn} /> : null}
          />,
        )
      } else if (idx === stream.promptIndex) {
        out.push(
          <Line
            key={idx}
            top={top}
            toks={[{ s: '$ ', c: 'prompt' }]}
            trailing={
              showPromptCursor ? (
                <Cursor color={COLORS.prompt} on={blinkOn} />
              ) : active ? (
                <Cursor color={COLORS.plain} on={caretOn} />
              ) : null
            }
          />,
        )
      } else if (active) {
        // The leading line types in character by character.
        const full = stream.lines[idx].toks
        out.push(
          <Line
            key={idx}
            top={top}
            toks={sliceToks(full, Math.round(frac * lineLen(full)))}
            trailing={<Cursor color={COLORS.plain} on={caretOn} />}
          />,
        )
      } else {
        out.push(<Line key={idx} top={top} toks={stream.lines[idx].toks} />)
      }
    }
    return out
  }

  // Build the shutter stack: SAMPLES copies, each at a sub-frame emitted-count,
  // summed additively so overlapping (slow) frames stay bright and crisp while
  // fast frames smear into a directional streak.
  const layers: ReactNode[] = []
  for (let k = 0; k < SAMPLES; k++) {
    const t = frame - 1 + (k + 0.5) / SAMPLES
    const em = emittedAt(t, L)
    const layerStyle: CSSProperties = { position: 'absolute', inset: 0, opacity: 1 / SAMPLES }
    // mixBlendMode 'plus-lighter' isn't in this React version's CSS typings.
    ;(layerStyle as Record<string, string | number>).mixBlendMode = 'plus-lighter'
    layers.push(
      <div key={k} style={layerStyle}>
        {renderWindow(em)}
      </div>,
    )
  }

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 28%, #ffffff 0%, #e9e9f2 60%, #dfe0ec 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: MONO,
      }}
    >
      <Fonts />
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          borderRadius: 20,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0e1117 0%, #0a0d13 100%)',
          boxShadow:
            '0 60px 130px -34px rgba(26,36,62,0.55), 0 22px 60px -26px rgba(26,36,62,0.40), inset 0 1px 0 rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            height: TITLE_H,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${PAD_X}px`,
            background: 'linear-gradient(180deg, #1a2029 0%, #141923 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', gap: 9 }}>
            <span style={dot('#ff5f57')} />
            <span style={dot('#febc2e')} />
            <span style={dot('#28c840')} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 13.5,
              color: '#8a94a6',
              letterSpacing: 0.2,
              pointerEvents: 'none',
            }}
          >
            zsh — aikit-prints — 120×40
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12.5,
              color: '#6b7689',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#2ada56',
                opacity: running ? pulse : 0.35,
                boxShadow: running ? `0 0 8px rgba(42,218,86,${pulse})` : 'none',
              }}
            />
            {running ? 'building' : 'done'}
          </div>
        </div>

        {/* Scrolling body */}
        <div
          style={{
            position: 'relative',
            height: BODY_H,
            overflow: 'hidden',
            padding: `${PAD_Y}px ${PAD_X}px`,
            fontSize: FONT_SIZE,
            // Fade the top & bottom edges so lines bleed in/out like a real tail.
            maskImage:
              'linear-gradient(to bottom, transparent 0%, #000 7%, #000 90%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, #000 7%, #000 90%, transparent 100%)',
          }}
        >
          {/* Isolate so the additive blend only sums the shutter copies. */}
          <div style={{ position: 'absolute', inset: `${PAD_Y}px ${PAD_X}px`, isolation: 'isolate' }}>
            {layers}
          </div>

          {/* Faint CRT scanlines + a soft top glow for terminal depth. */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage:
                'repeating-linear-gradient(to bottom, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)',
              mixBlendMode: 'overlay',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'radial-gradient(120% 60% at 50% -10%, rgba(122,162,255,0.10) 0%, transparent 60%)',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  )
}
