/**
 * chatScript.ts — pure frame-driven logic for the scripted AiKit chat.
 * ────────────────────────────────────────────────────────────────────
 * The mechanics absorbed from ConversationVideo, extracted as pure functions
 * of (script, frame) so every piece scripts a chat the same way and the
 * behaviour is unit-testable without rendering. ChatPanel is the visual shell
 * on top of these.
 *
 * Timeline contract per line:
 *   - `showAt`     — frame the bubble commits to the thread.
 *   - `typeStart?` — when set, the lead-up window [typeStart, showAt) is
 *     animated: a 'me' line types letter by letter into the composer; a
 *     'them' line shows the typing-dots bubble. Omit for a line that is
 *     simply already there.
 */

export type ChatLine = {
  /** 'me' = the human (blue, right) · 'them' = AiKit (raised plate, left). */
  from: 'me' | 'them'
  text: string
  /** Timestamp under the bubble, e.g. '9:41'. Optional. */
  time?: string
  /** Frame the bubble commits to the thread. */
  showAt: number
  /** Start of the animated lead-up (typing). Must be < showAt. */
  typeStart?: number
}

/** Frames the composer needs to "settle" before send: typing completes this
 * many frames before showAt so the full sentence reads for a beat. */
export const COMPOSE_SETTLE = 8

/** Lines already committed to the thread at `frame`, in showAt order. */
export function visibleLines(script: readonly ChatLine[], frame: number): ChatLine[] {
  return script.filter((l) => frame >= l.showAt).sort((a, b) => a.showAt - b.showAt)
}

/** The 'them' line currently in its typing-dots window, if any. */
export function typingLine(script: readonly ChatLine[], frame: number): ChatLine | undefined {
  return script.find(
    (l) => l.from === 'them' && l.typeStart != null && frame >= l.typeStart && frame < l.showAt,
  )
}

/** The 'me' line currently being typed into the composer, if any. */
export function composingLine(script: readonly ChatLine[], frame: number): ChatLine | undefined {
  return script.find(
    (l) => l.from === 'me' && l.typeStart != null && frame >= l.typeStart && frame < l.showAt,
  )
}

/**
 * The composer's text at `frame` for a composing line: the sentence sliced
 * letter by letter across [typeStart, showAt - settle], clamped both ends.
 */
export function composedText(line: ChatLine, frame: number, settle = COMPOSE_SETTLE): string {
  const start = line.typeStart ?? line.showAt
  const end = Math.max(start + 1, line.showAt - settle)
  const t = Math.min(1, Math.max(0, (frame - start) / (end - start)))
  return line.text.slice(0, Math.round(t * line.text.length))
}

/** Composition duration that covers the whole script plus a held tail. */
export function chatDuration(script: readonly ChatLine[], tailFrames = 45): number {
  return script.reduce((max, l) => Math.max(max, l.showAt), 0) + tailFrames
}

/**
 * Deterministic typing-dots bob — the frame-driven port of the CSS keyframes
 * (`0%,60%,100% → rest · 30% → peak`) the Storybook bubble animates with.
 * Returns the dot's vertical offset (px, ≤ 0) and opacity for dot `i`.
 */
export function typingDotPose(
  frame: number,
  i: number,
  fps = 30,
): { y: number; opacity: number } {
  const period = 1.2 * fps // the CSS cycle: 1.2s
  const delay = 0.18 * fps // stagger per dot: 0.18s
  const p = (((frame - i * delay) % period) + period) % period
  const up = 0.3 * period // rest → peak over the first 30%
  const down = 0.6 * period // peak → rest by 60%, then hold
  // Triangle to the peak, smoothed so the bob eases instead of snapping.
  const lin = p < up ? p / up : p < down ? (down - p) / (down - up) : 0
  const t = lin * lin * (3 - 2 * lin)
  return { y: -4 * t, opacity: 0.35 + 0.65 * t }
}

/**
 * Sanity-check an authored script. Returns human-readable problems (empty =
 * valid): lead-ups must end before their bubble lands, bubbles must land in
 * order, and lead-up windows must not overlap (one composer, one dots bubble).
 */
export function validateChatScript(script: readonly ChatLine[]): string[] {
  const errors: string[] = []
  script.forEach((l, i) => {
    if (l.typeStart != null && l.typeStart >= l.showAt) {
      errors.push(`line ${i} ("${l.text.slice(0, 24)}…"): typeStart ${l.typeStart} must be < showAt ${l.showAt}`)
    }
    if (i > 0 && l.showAt < script[i - 1].showAt) {
      errors.push(`line ${i}: showAt ${l.showAt} lands before line ${i - 1} (${script[i - 1].showAt})`)
    }
    if (i > 0 && l.typeStart != null && l.typeStart < script[i - 1].showAt) {
      errors.push(`line ${i}: typeStart ${l.typeStart} overlaps line ${i - 1}'s window (ends ${script[i - 1].showAt})`)
    }
  })
  return errors
}
