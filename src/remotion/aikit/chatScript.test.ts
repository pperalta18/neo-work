import { describe, expect, it } from 'vitest'
import {
  COMPOSE_SETTLE,
  type ChatLine,
  chatDuration,
  composedText,
  composingLine,
  typingDotPose,
  typingLine,
  validateChatScript,
  visibleLines,
} from './chatScript'

/** A representative script: greeting already animated, one of each lead-up. */
const SCRIPT: ChatLine[] = [
  { from: 'them', text: 'Hola, soy AiKit.', time: '9:41', showAt: 10 },
  { from: 'me', text: 'Prepara el presupuesto.', time: '9:41', typeStart: 30, showAt: 90 },
  { from: 'them', text: 'Hecho. ¿Lo envío?', time: '9:42', typeStart: 100, showAt: 160 },
]

describe('visibleLines', () => {
  it('shows nothing before the first showAt', () => {
    expect(visibleLines(SCRIPT, 0)).toEqual([])
    expect(visibleLines(SCRIPT, 9)).toEqual([])
  })

  it('commits each bubble exactly at its showAt frame', () => {
    expect(visibleLines(SCRIPT, 10)).toHaveLength(1)
    expect(visibleLines(SCRIPT, 89)).toHaveLength(1)
    expect(visibleLines(SCRIPT, 90)).toHaveLength(2)
    expect(visibleLines(SCRIPT, 160)).toHaveLength(3)
  })

  it('returns lines in showAt order even if the script is unsorted', () => {
    const shuffled = [SCRIPT[2], SCRIPT[0], SCRIPT[1]]
    expect(visibleLines(shuffled, 999).map((l) => l.showAt)).toEqual([10, 90, 160])
  })
})

describe('typingLine / composingLine', () => {
  it('finds the them-line only inside its lead-up window', () => {
    expect(typingLine(SCRIPT, 99)).toBeUndefined()
    expect(typingLine(SCRIPT, 100)?.text).toBe('Hecho. ¿Lo envío?')
    expect(typingLine(SCRIPT, 159)?.text).toBe('Hecho. ¿Lo envío?')
    expect(typingLine(SCRIPT, 160)).toBeUndefined() // committed — dots gone
  })

  it('finds the me-line only inside its lead-up window', () => {
    expect(composingLine(SCRIPT, 29)).toBeUndefined()
    expect(composingLine(SCRIPT, 30)?.from).toBe('me')
    expect(composingLine(SCRIPT, 89)?.from).toBe('me')
    expect(composingLine(SCRIPT, 90)).toBeUndefined() // sent
  })

  it('never matches lines of the other role or without typeStart', () => {
    expect(typingLine(SCRIPT, 50)).toBeUndefined() // frame 50 is the me-window
    expect(composingLine(SCRIPT, 120)).toBeUndefined() // frame 120 is the them-window
    expect(typingLine(SCRIPT, 5)).toBeUndefined() // line 0 has no typeStart
  })
})

describe('composedText', () => {
  const line = SCRIPT[1] // typeStart 30 → showAt 90, settle default

  it('is empty at typeStart and complete by showAt - settle', () => {
    expect(composedText(line, 30)).toBe('')
    expect(composedText(line, 90 - COMPOSE_SETTLE)).toBe(line.text)
    expect(composedText(line, 89)).toBe(line.text) // settled — holds full
  })

  it('clamps outside the window', () => {
    expect(composedText(line, 0)).toBe('')
    expect(composedText(line, 10_000)).toBe(line.text)
  })

  it('grows monotonically, letter by letter, always a prefix', () => {
    let prev = ''
    for (let f = 30; f <= 90; f++) {
      const cur = composedText(line, f)
      expect(cur.startsWith(prev)).toBe(true)
      expect(cur.length).toBeGreaterThanOrEqual(prev.length)
      prev = cur
    }
    expect(prev).toBe(line.text)
  })

  it('survives a degenerate window (typeStart right before showAt)', () => {
    const tight: ChatLine = { from: 'me', text: 'ok', typeStart: 10, showAt: 12 }
    expect(composedText(tight, 9)).toBe('')
    expect(composedText(tight, 12)).toBe('ok')
  })
})

describe('chatDuration', () => {
  it('covers the last bubble plus the tail', () => {
    expect(chatDuration(SCRIPT, 45)).toBe(160 + 45)
    expect(chatDuration(SCRIPT, 0)).toBe(160)
  })

  it('is just the tail for an empty script', () => {
    expect(chatDuration([], 45)).toBe(45)
  })
})

describe('typingDotPose', () => {
  const fps = 30
  const period = 1.2 * fps // 36 frames

  it('rests at the cycle start (y 0, dim) and peaks at 30% (y -4, full)', () => {
    const rest = typingDotPose(0, 0, fps)
    expect(rest.y).toBeCloseTo(0)
    expect(rest.opacity).toBeCloseTo(0.35)
    const peak = typingDotPose(0.3 * period, 0, fps)
    expect(peak.y).toBeCloseTo(-4)
    expect(peak.opacity).toBeCloseTo(1)
  })

  it('holds at rest from 60% through the end of the cycle', () => {
    for (const f of [0.6 * period, 0.8 * period, period - 1]) {
      const pose = typingDotPose(f, 0, fps)
      expect(pose.y).toBeCloseTo(0)
      expect(pose.opacity).toBeCloseTo(0.35)
    }
  })

  it('is periodic and deterministic', () => {
    for (const f of [3, 7, 19]) {
      expect(typingDotPose(f + period, 0, fps)).toEqual(typingDotPose(f, 0, fps))
      expect(typingDotPose(f, 1, fps)).toEqual(typingDotPose(f, 1, fps))
    }
  })

  it('staggers the three dots (later dots lag the first)', () => {
    const delay = 0.18 * fps
    const atPeak = 0.3 * period
    expect(typingDotPose(atPeak + delay, 1, fps).y).toBeCloseTo(typingDotPose(atPeak, 0, fps).y)
    expect(typingDotPose(atPeak, 1, fps).y).not.toBeCloseTo(typingDotPose(atPeak, 0, fps).y)
  })

  it('keeps offsets within the bob range and opacity within [0.35, 1]', () => {
    for (let f = 0; f < period * 2; f++) {
      for (const i of [0, 1, 2]) {
        const { y, opacity } = typingDotPose(f, i, fps)
        expect(y).toBeLessThanOrEqual(0)
        expect(y).toBeGreaterThanOrEqual(-4)
        expect(opacity).toBeGreaterThanOrEqual(0.35)
        expect(opacity).toBeLessThanOrEqual(1)
      }
    }
  })

  it('never goes negative-phase on early frames of staggered dots', () => {
    const pose = typingDotPose(0, 2, fps) // frame 0, dot delayed past it
    expect(Number.isFinite(pose.y)).toBe(true)
    expect(pose.opacity).toBeGreaterThanOrEqual(0.35)
  })
})

describe('validateChatScript', () => {
  it('accepts the well-formed script', () => {
    expect(validateChatScript(SCRIPT)).toEqual([])
  })

  it('rejects a lead-up that ends after its bubble lands', () => {
    const bad: ChatLine[] = [{ from: 'me', text: 'x', typeStart: 50, showAt: 50 }]
    expect(validateChatScript(bad)).toHaveLength(1)
  })

  it('rejects bubbles landing out of order', () => {
    const bad: ChatLine[] = [
      { from: 'them', text: 'a', showAt: 100 },
      { from: 'me', text: 'b', showAt: 40 },
    ]
    expect(validateChatScript(bad).some((e) => e.includes('lands before'))).toBe(true)
  })

  it('rejects a lead-up overlapping the previous bubble window', () => {
    const bad: ChatLine[] = [
      { from: 'me', text: 'a', typeStart: 10, showAt: 60 },
      { from: 'them', text: 'b', typeStart: 40, showAt: 100 },
    ]
    expect(validateChatScript(bad).some((e) => e.includes('overlaps'))).toBe(true)
  })
})
