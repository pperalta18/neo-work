/**
 * Unit tests for the dynamics ear (energyAnalysis).
 *
 * The DSP is pure number-array math, so it's pinned with *synthetic* signals
 * whose answer is known a priori: a 100 Hz tone lives in the low band, a 5 kHz
 * tone in the high band; a flat envelope is steady; a quiet-then-loud envelope
 * has exactly one structural cut at the seam. We test the building blocks
 * (filter separation, windowed RMS, normalisation) un-normalised so the
 * assertions can't be fooled by per-band peak-normalisation, then check the
 * assembled outputs only for shape/range/length and determinism.
 */

import { describe, expect, it } from 'vitest'
import {
  barSeconds,
  classifyShape,
  computeBands,
  deriveSectionsFromEnergy,
  detectImpacts,
  detectMoments,
  detectTroughs,
  envelopeGrid,
  findSectionCuts,
  highpass,
  labelSection,
  lowpass,
  meanRange,
  normalizePeak,
  overallEnergy,
  rmsWindows,
  runBiquads,
  smooth,
  snapToNearest,
} from '@/lib/energyAnalysis'
import type { BeatBands, Section } from '@/lib/beatmap'

const FS = 44100

/** A pure sine of `freq` Hz, `n` samples at sample rate `fs`, amplitude 1. */
function sine(freq: number, n: number, fs = FS): Float32Array {
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = Math.sin((2 * Math.PI * freq * i) / fs)
  return out
}

/** Plain RMS of a whole signal (steady-state, transient is negligible over 1s). */
function rms(x: Float32Array | number[]): number {
  let s = 0
  for (let i = 0; i < x.length; i++) s += x[i] * x[i]
  return Math.sqrt(s / x.length)
}

describe('biquad band separation', () => {
  it('a low-pass keeps a 100 Hz tone and kills a 5 kHz tone', () => {
    const lp = [lowpass(250, FS)]
    const keptLow = rms(runBiquads(sine(100, FS), lp))
    const killedHigh = rms(runBiquads(sine(5000, FS), lp))
    expect(keptLow).toBeGreaterThan(0.5) // ~passband (input rms ≈ 0.707)
    expect(killedHigh).toBeLessThan(0.05) // far down the stopband
    expect(keptLow).toBeGreaterThan(killedHigh * 20)
  })

  it('a high-pass keeps a 5 kHz tone and kills a 100 Hz tone', () => {
    const hp = [highpass(2500, FS)]
    const keptHigh = rms(runBiquads(sine(5000, FS), hp))
    const killedLow = rms(runBiquads(sine(100, FS), hp))
    expect(keptHigh).toBeGreaterThan(0.5)
    expect(killedLow).toBeLessThan(0.05)
  })

  it('runBiquads does not mutate its input and an empty cascade is a copy', () => {
    const x = sine(440, 1000)
    const before = Float32Array.from(x)
    const copy = runBiquads(x, [])
    expect(Array.from(x)).toEqual(Array.from(before))
    expect(Array.from(copy)).toEqual(Array.from(before))
  })
})

describe('rmsWindows', () => {
  it('measures RMS per non-overlapping window', () => {
    // constant 2 → RMS 2 in every full window
    expect(rmsWindows([2, 2, 2, 2], 2)).toEqual([2, 2])
  })

  it('covers a trailing partial window over the samples it has', () => {
    const out = rmsWindows([3, 3, 3], 2)
    expect(out.length).toBe(2)
    expect(out[0]).toBeCloseTo(3)
    expect(out[1]).toBeCloseTo(3) // single-sample window
  })
})

describe('normalizePeak', () => {
  it('scales the peak to 1', () => {
    expect(normalizePeak([0.5, 1, 2, 4])).toEqual([0.125, 0.25, 0.5, 1])
  })
  it('returns all-zeros for a silent envelope', () => {
    expect(normalizePeak([0, 0, 0])).toEqual([0, 0, 0])
  })
})

describe('envelopeGrid', () => {
  it('gives an exact effective hz when fs divides evenly', () => {
    expect(envelopeGrid(44100, 20)).toEqual({ win: 2205, hz: 20 })
    expect(envelopeGrid(44100, 12)).toEqual({ win: 3675, hz: 12 })
  })
})

describe('computeBands', () => {
  it('returns three equal-length 0..1 envelopes at the effective hz', () => {
    const pcm = sine(440, FS) // 1 second
    const bands = computeBands(pcm, FS, 20)
    expect(bands.hz).toBe(20)
    expect(bands.low.length).toBe(20)
    expect(bands.mid.length).toBe(20)
    expect(bands.high.length).toBe(20)
    for (const arr of [bands.low, bands.mid, bands.high]) {
      for (const v of arr) expect(v).toBeGreaterThanOrEqual(0)
      for (const v of arr) expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('tracks within-band dynamics: a low tone that stops empties the low envelope', () => {
    // 1 s of 100 Hz then 1 s of silence → low band full, then ~0. (Cross-band
    // magnitude can't be compared after per-band peak-normalisation; band
    // separation itself is pinned by the raw-RMS biquad test above.)
    const pcm = new Float32Array(FS * 2)
    pcm.set(sine(100, FS), 0) // second half left as zeros
    const bands = computeBands(pcm, FS, 20) // 40 windows: 20 loud, 20 silent
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    expect(mean(bands.low.slice(0, 20))).toBeGreaterThan(0.7)
    expect(mean(bands.low.slice(20))).toBeLessThan(0.1)
  })

  it('is pure — same PCM gives a byte-identical result', () => {
    const pcm = sine(330, FS)
    expect(computeBands(pcm, FS, 15)).toEqual(computeBands(pcm, FS, 15))
  })
})

describe('overallEnergy', () => {
  it('a constant-amplitude tone yields a flat, peak-normalised envelope', () => {
    const { hz, env } = overallEnergy(sine(440, FS), FS, 10)
    expect(hz).toBe(10)
    expect(env.length).toBe(10)
    expect(Math.max(...env)).toBeCloseTo(1)
    // flat: every window within a hair of the peak
    for (const v of env) expect(v).toBeGreaterThan(0.95)
  })
})

describe('classifyShape', () => {
  it('reads rising / falling / steady from the contour', () => {
    expect(classifyShape([0, 0.2, 0.4, 0.6, 0.8, 1])).toBe('rising')
    expect(classifyShape([1, 0.8, 0.6, 0.4, 0.2, 0])).toBe('falling')
    expect(classifyShape([0.5, 0.5, 0.5, 0.5, 0.5, 0.5])).toBe('steady')
  })
})

describe('smooth / meanRange', () => {
  it('meanRange averages a clamped half-open range', () => {
    expect(meanRange([1, 2, 3, 4], 1, 3)).toBe(2.5)
    expect(meanRange([1, 2, 3, 4], -5, 99)).toBe(2.5) // clamped to full
  })
  it('smooth preserves length and a constant signal', () => {
    expect(smooth([4, 4, 4, 4], 3)).toEqual([4, 4, 4, 4])
  })
})

describe('findSectionCuts / deriveSectionsFromEnergy', () => {
  // 24 s at 10 Hz: 12 s quiet (0.1) then 12 s loud (0.9); a downbeat every 2 s.
  const hz = 10
  const duration = 24
  const env = Array.from({ length: duration * hz }, (_, i) => (i < 12 * hz ? 0.1 : 0.9))
  const downbeats = Array.from({ length: 12 }, (_, i) => i * 2)

  it('cuts once, right at the energy seam', () => {
    const cuts = findSectionCuts(env, hz, downbeats, duration)
    expect(cuts.length).toBe(1)
    expect(cuts[0]).toBeCloseTo(12, 0)
  })

  it('builds two intensity/shape-tagged sections labelled by their dynamics', () => {
    const secs = deriveSectionsFromEnergy(env, hz, downbeats, duration)
    expect(secs.length).toBe(2)
    expect(secs[0].name).toBe('intro')
    expect(secs[0].intensity).toBeCloseTo(0.1, 1)
    expect(secs[1].name).toBe('drop')
    expect(secs[1].intensity).toBeCloseTo(0.9, 1)
    // tiles [0, duration] exactly
    expect(secs[0].start).toBe(0)
    expect(secs[secs.length - 1].end).toBe(duration)
  })

  it('falls back to one section with no downbeats', () => {
    const secs = deriveSectionsFromEnergy(env, hz, [], duration)
    expect(secs).toEqual([{ name: 'part 1', start: 0, end: 24 }])
  })
})

describe('barSeconds / snapToNearest', () => {
  it('barSeconds is the median downbeat gap', () => {
    expect(barSeconds([0, 2, 4, 6, 8], 10)).toBe(2)
    expect(barSeconds([], 8)).toBe(8) // no grid → whole song
  })
  it('snapToNearest lands on the closest grid value', () => {
    expect(snapToNearest(20.3, [0, 2, 18, 20, 22])).toBe(20)
    expect(snapToNearest(5, [])).toBe(5)
  })
})

describe('detectMoments', () => {
  // 40s @ 10Hz, downbeats every 2s. Four sections: a quiet intro, a rising build
  // (high band climbs, low stays empty), a DROP (low/sub re-enters loud), a break.
  const hz = 10
  const dur = 40
  const n = dur * hz
  const at = (i: number) => i / hz
  const low = Array.from({ length: n }, (_, i) => (at(i) >= 20 && at(i) < 30 ? 0.8 : at(i) >= 30 ? 0.1 : 0.05))
  const high = Array.from({ length: n }, (_, i) => {
    const t = at(i)
    if (t < 10) return 0.1
    if (t < 20) return 0.1 + 0.6 * ((t - 10) / 10) // build ramps up
    if (t < 30) return 0.9
    return 0.2
  })
  const bands: BeatBands = { hz, low, mid: Array(n).fill(0.2), high }
  const downbeats = Array.from({ length: 20 }, (_, i) => i * 2)
  const sections: Section[] = [
    { name: 'intro', start: 0, end: 10, intensity: 0.1, shape: 'steady' },
    { name: 'build', start: 10, end: 20, intensity: 0.3, shape: 'rising' },
    { name: 'drop', start: 20, end: 30, intensity: 0.9, shape: 'steady' },
    { name: 'break', start: 30, end: 40, intensity: 0.2, shape: 'falling' },
  ]

  const moments = detectMoments(sections, bands, downbeats, dur)

  it('emits a lift (ranged), a drop, then a break in time order', () => {
    expect(moments.map((m) => m.type)).toEqual(['lift', 'drop', 'break'])
  })

  it('gates the drop on low-band re-entry, snaps it to a downbeat, ranks it strongest', () => {
    const drop = moments.find((m) => m.type === 'drop')!
    expect(drop.time).toBe(20) // on the bar
    expect(drop.strength).toBeCloseTo(1, 5) // the headline hit
    expect(drop.end).toBeUndefined() // instant, not ranged
  })

  it('makes the build a ranged lift that resolves at the drop', () => {
    const lift = moments.find((m) => m.type === 'lift')!
    expect(lift.time).toBe(10)
    expect(lift.end).toBe(20)
    expect(lift.strength).toBeLessThan(1) // weaker than the drop it sets up
  })

  it('does NOT call a quiet→quiet rise a drop (no low re-entry)', () => {
    // intro→build is a positive wide step but the low band never re-enters,
    // so it must NOT produce a drop boundary moment.
    expect(moments.some((m) => m.type === 'drop' && m.time === 10)).toBe(false)
  })

  it('detects a sub-bar near-silence flanked by sound as a dropout', () => {
    const sm = Array.from({ length: 200 }, (_, i) => (i >= 100 && i < 110 ? 0 : 0.4))
    const dbands: BeatBands = { hz: 10, low: sm, mid: sm, high: sm }
    const onlySection: Section[] = [{ name: 'part 1', start: 0, end: 20, intensity: 0.4, shape: 'steady' }]
    const ms = detectMoments(onlySection, dbands, Array.from({ length: 10 }, (_, i) => i * 2), 20)
    const dropout = ms.find((m) => m.type === 'dropout')
    expect(dropout).toBeDefined()
    expect(dropout!.time).toBeGreaterThanOrEqual(10)
    expect(dropout!.time).toBeLessThanOrEqual(11.5)
  })

  it('returns [] without bands', () => {
    expect(detectMoments(sections, undefined, downbeats, dur)).toEqual([])
  })

  it('is pure — same inputs give a byte-identical result', () => {
    expect(detectMoments(sections, bands, downbeats, dur)).toEqual(detectMoments(sections, bands, downbeats, dur))
  })
})

describe('detectImpacts / detectTroughs (relative, section-independent)', () => {
  // 40s @ 10Hz, a downbeat every 2s (bar = 2s). A steady body at 0.5 with a
  // 10s breakdown to ~0.15 in the middle: the fall onset at 20s is a BREAK, the
  // recovery slam at 30s is an IMPACT. The low band re-enters with the slam.
  const hz = 10
  const dur = 40
  const n = dur * hz
  const at = (i: number) => i / hz
  const dip = (t: number, lo: number, hi: number) => (t >= 20 && t < 30 ? lo : hi)
  const overall = Array.from({ length: n }, (_, i) => dip(at(i), 0.15, 0.5))
  const low = Array.from({ length: n }, (_, i) => dip(at(i), 0.1, 0.6))
  const downbeats = Array.from({ length: 20 }, (_, i) => i * 2)
  const bar = 2

  it('detectImpacts flags the recovery slam on its downbeat, nothing else', () => {
    const impacts = detectImpacts(overall, low, downbeats, bar, hz, dur)
    expect(impacts.length).toBe(1)
    expect(impacts[0].time).toBe(30)
    expect(impacts[0].raw).toBeGreaterThan(0)
  })

  it('detectTroughs flags the sustained fall on its downbeat, nothing else', () => {
    const troughs = detectTroughs(overall, downbeats, bar, hz, dur)
    expect(troughs.length).toBe(1)
    expect(troughs[0].time).toBe(20)
  })

  it('a one-beat dip is NOT a break (left to the dropout detector)', () => {
    // 0.5 everywhere except a single 0.5s gap — shorter than minBreakBars (1 bar).
    const blip = Array.from({ length: n }, (_, i) => (at(i) >= 20 && at(i) < 20.5 ? 0.1 : 0.5))
    expect(detectTroughs(blip, downbeats, bar, hz, dur)).toEqual([])
  })

  it('a flat signal yields no impacts and no troughs', () => {
    const flat = Array(n).fill(0.4)
    expect(detectImpacts(flat, flat, downbeats, bar, hz, dur)).toEqual([])
    expect(detectTroughs(flat, downbeats, bar, hz, dur)).toEqual([])
  })

  it('are pure — same inputs give byte-identical results', () => {
    expect(detectImpacts(overall, low, downbeats, bar, hz, dur)).toEqual(detectImpacts(overall, low, downbeats, bar, hz, dur))
    expect(detectTroughs(overall, downbeats, bar, hz, dur)).toEqual(detectTroughs(overall, downbeats, bar, hz, dur))
  })

  it('detectMoments catches a compressed-dynamics hit the old logic missed', () => {
    // ONE section (no boundary moments) and energy that never nears the absolute
    // silence floor (0.06) — so the seam classifier and the dropout test both
    // produce nothing. The relative passes still find the break→slam inside it.
    const band = Array.from({ length: n }, (_, i) => dip(at(i), 0.18, 0.5))
    const bands: BeatBands = { hz, low: band, mid: band, high: band }
    const oneSection: Section[] = [{ name: 'part 1', start: 0, end: dur, intensity: 0.4, shape: 'steady' }]
    const ms = detectMoments(oneSection, bands, downbeats, dur)
    expect(ms.some((m) => m.type === 'break' && Math.abs(m.time - 20) <= bar)).toBe(true)
    expect(ms.some((m) => m.type === 'drop' && Math.abs(m.time - 30) <= bar)).toBe(true)
    expect(ms.some((m) => m.type === 'dropout')).toBe(false) // 0.18 is not silence
  })
})

describe('labelSection', () => {
  it('names parts by energy + position', () => {
    expect(labelSection(0.1, 'rising', null, true, false)).toBe('intro')
    expect(labelSection(0.1, 'falling', 0.8, false, true)).toBe('outro')
    expect(labelSection(0.9, 'steady', 0.2, false, false)).toBe('drop')
    expect(labelSection(0.9, 'steady', 0.85, false, false)).toBe('peak')
    expect(labelSection(0.5, 'rising', 0.4, false, false)).toBe('build')
    expect(labelSection(0.1, 'falling', 0.7, false, false)).toBe('break')
    expect(labelSection(0.5, 'steady', 0.5, false, false)).toBe('groove')
  })
})
