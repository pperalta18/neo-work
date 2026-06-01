/**
 * Unit tests for the rendered-cut timing gate (`verifyCutTiming.ts`).
 *
 * These never touch ffmpeg or a real MP4 — they drive the pure logic with
 * hand-built signals so the tests assert *behaviour*, not the magic numbers of
 * one particular render:
 *   - `changeSignalFromGray` is checked against frame buffers whose mean absolute
 *     difference is computed by hand.
 *   - `analyzeCutTiming` is fed synthetic change signals modelling the cases that
 *     matter — transitions on the cuts (pass), a front-loaded/eased transition
 *     (still pass), a missing transition, a misplaced one, an off-centre one, a
 *     low-concentration smear, and a stray transition the same size as the real
 *     ones (the case a concentration threshold alone would wave through) — and we
 *     assert it accepts the good ones and *rejects* each regression. A gate that
 *     can't fail isn't a gate.
 */
import { describe, expect, it } from 'vitest'
import {
  analyzeCutTiming,
  changeSignalFromGray,
  type CutTimingConfig,
} from '@/lib/verifyCutTiming'

// ── signal builders ────────────────────────────────────────────────────────

/** A flat signal of length `n` at constant `baseline` (the scene-hold noise). */
function flat(n: number, baseline = 0.01): number[] {
  return new Array<number>(n).fill(baseline)
}

/** Add a smooth Gaussian bump (a rendered transition) to `signal`, in place. */
function addBump(signal: number[], center: number, height: number, sigma = 4): number[] {
  for (let f = 0; f < signal.length; f++) {
    signal[f] += height * Math.exp(-((f - center) ** 2) / (2 * sigma * sigma))
  }
  return signal
}

const N = 240
const CUTS = [75, 135] // the ProductTour's downbeat cuts at 30fps
const RADIUS = 16 // one transition length
const baseConfig: CutTimingConfig = { windowRadius: RADIUS, openingFrames: 20 }

// ── changeSignalFromGray ────────────────────────────────────────────────────

describe('changeSignalFromGray — mean absolute inter-frame difference', () => {
  it('computes the per-frame MAFD, with signal[0] = 0', () => {
    // 3 frames, 4 px each. Diffs: f1 vs f0 = |10-0|·4/4 = 10; f2 vs f1 = |5-10|·4/4 = 5.
    const buf = Uint8Array.from([0, 0, 0, 0, 10, 10, 10, 10, 5, 5, 5, 5])
    expect(changeSignalFromGray(buf, 4)).toEqual([0, 10, 5])
  })

  it('averages over differing pixels only', () => {
    // 2 frames, 4 px: one pixel changes by 8 → mean = 8/4 = 2.
    const buf = [0, 0, 0, 0, 8, 0, 0, 0]
    expect(changeSignalFromGray(buf, 4)).toEqual([0, 2])
  })

  it('is zero for a static clip', () => {
    expect(changeSignalFromGray(Uint8Array.from([7, 7, 7, 7, 7, 7]), 3)).toEqual([0, 0])
  })

  it('floors a buffer with trailing bytes to whole frames (no throw)', () => {
    // 9 bytes, 4 px/frame → 2 whole frames, last byte ignored.
    const sig = changeSignalFromGray(Uint8Array.from([0, 0, 0, 0, 1, 1, 1, 1, 9]), 4)
    expect(sig).toHaveLength(2)
  })

  it('rejects a non-positive frame size', () => {
    expect(() => changeSignalFromGray([1, 2, 3], 0)).toThrow()
    expect(() => changeSignalFromGray([1, 2, 3], -4)).toThrow()
  })
})

// ── analyzeCutTiming: the good render ───────────────────────────────────────

describe('analyzeCutTiming — accepts transitions that land on the downbeats', () => {
  it('passes when bumps sit on the cuts', () => {
    const sig = flat(N)
    CUTS.forEach((c) => addBump(sig, c, 3))
    const r = analyzeCutTiming(sig, CUTS, baseConfig)
    expect(r.ok).toBe(true)
    expect(r.concentration).toBeGreaterThan(0.9)
    expect(r.findings).toHaveLength(2)
    expect(r.findings.every((f) => f.ok && f.hasTransition)).toBe(true)
    expect(r.reason).toMatch(/confirmed/i)
  })

  it('still passes a front-loaded (eased) transition whose centroid is a few frames early', () => {
    // Spring timing renders most motion ahead of the geometric cut (like the real
    // ProductTour slide: cut 75, energy centroid ≈ 69).
    const sig = flat(N)
    addBump(sig, 69, 3) // for cut 75
    addBump(sig, 137, 2) // for cut 135, slightly late + weaker (a soft wipe)
    const r = analyzeCutTiming(sig, CUTS, baseConfig)
    expect(r.ok).toBe(true)
    expect(r.findings[0].centroidOffset).toBeGreaterThan(3)
    expect(r.findings[0].centroidOffset).toBeLessThanOrEqual(RADIUS)
  })

  it('accepts a soft transition alongside a bold one (≈ the tour slide vs wipe)', () => {
    const sig = flat(N)
    addBump(sig, 75, 3) // bold slide
    addBump(sig, 135, 1) // softer wipe — ~3× weaker, like the real render, still a cut
    const r = analyzeCutTiming(sig, CUTS, baseConfig)
    expect(r.ok).toBe(true)
    expect(r.findings[1].hasTransition).toBe(true)
    expect(r.findings[1].peakProminence).toBeGreaterThan(0.2)
  })

  it('ignores a beat-pulse accent on a non-cut downbeat (accent ≠ transition)', () => {
    // The composition pulses captions on EVERY downbeat; downbeats that aren't
    // scene cuts produce a small accent that must not be mistaken for a stray cut.
    const sig = flat(N)
    addBump(sig, 75, 3)
    addBump(sig, 135, 3)
    addBump(sig, 195, 0.5) // a caption pulse on the 4th downbeat — not a cut
    const r = analyzeCutTiming(sig, CUTS, baseConfig)
    expect(r.ok).toBe(true)
    expect(r.strayPeak?.frame).toBe(195)
    expect(r.strayPeak?.prominence).toBeLessThan(0.2) // below transition scale → fine
  })

  it('is deterministic — same signal, identical report', () => {
    const sig = flat(N)
    CUTS.forEach((c) => addBump(sig, c, 3))
    expect(analyzeCutTiming(sig, CUTS, baseConfig)).toEqual(
      analyzeCutTiming(sig, CUTS, baseConfig),
    )
  })
})

// ── analyzeCutTiming: each regression must be rejected ───────────────────────

describe('analyzeCutTiming — rejects renders where cuts miss the downbeats', () => {
  it('fails when a downbeat cut has no rendered transition', () => {
    const sig = flat(N)
    addBump(sig, 75, 3) // only the first cut transitions
    const r = analyzeCutTiming(sig, CUTS, baseConfig)
    expect(r.ok).toBe(false)
    expect(r.findings[1].hasTransition).toBe(false)
    expect(r.reason).toMatch(/no transition/i)
  })

  it('fails when the transition renders between the cuts, not on them', () => {
    const sig = flat(N)
    addBump(sig, 110, 3) // a cut that drifted off both downbeats
    const r = analyzeCutTiming(sig, CUTS, baseConfig)
    expect(r.ok).toBe(false)
    // The stray energy is outside both windows → low concentration.
    expect(r.concentration).toBeLessThan(0.6)
  })

  it('fails on a stray transition the same size as the real ones (concentration alone would pass)', () => {
    const sig = flat(N)
    addBump(sig, 75, 3)
    addBump(sig, 135, 3)
    addBump(sig, 110, 3) // an extra, unexplained cut between the downbeats
    const r = analyzeCutTiming(sig, CUTS, baseConfig)
    // 2 of 3 transitions are on cuts → concentration ≈ 0.67, above the 0.6 floor…
    expect(r.concentration).toBeGreaterThan(0.6)
    // …but the stray-transition gate still rejects it.
    expect(r.ok).toBe(false)
    expect(r.strayPeak?.prominence).toBeGreaterThan(0.2)
    expect(r.reason).toMatch(/unexplained/i)
  })

  it('fails a smeared signal with no concentrated transitions', () => {
    // Uniform change everywhere: no real cuts, energy spread across the song.
    const sig = flat(N, 1)
    const r = analyzeCutTiming(sig, CUTS, baseConfig)
    expect(r.ok).toBe(false)
    expect(r.concentration).toBeLessThan(0.6)
  })

  it('fails an off-centre transition under a strict centroid tolerance', () => {
    // Bump pushed to the far edge of cut 135's window; with a tight tolerance the
    // centroid offset exceeds it even though the energy is technically in-window.
    const sig = flat(N)
    addBump(sig, 75, 3)
    addBump(sig, 135 + RADIUS, 3, 2) // narrow bump at the window's right edge
    const r = analyzeCutTiming(sig, CUTS, { ...baseConfig, centroidTolerance: 5 })
    expect(r.ok).toBe(false)
    expect(r.findings[1].centroidOk).toBe(false)
    expect(r.reason).toMatch(/off-centre/i)
  })
})

// ── analyzeCutTiming: opening exclusion & guards ─────────────────────────────

describe('analyzeCutTiming — opening entrance is not counted as a cut', () => {
  it('ignores a big opening bump before openingFrames', () => {
    const sig = flat(N)
    addBump(sig, 5, 4) // the first scene's entrance animation
    CUTS.forEach((c) => addBump(sig, c, 3))
    const r = analyzeCutTiming(sig, CUTS, baseConfig)
    expect(r.ok).toBe(true)
    // The opening spike is excluded from the interior → not flagged as stray.
    expect(r.strayPeak === null || r.strayPeak.frame >= 20).toBe(true)
  })

  it('rejects a negative windowRadius', () => {
    expect(() => analyzeCutTiming(flat(N), CUTS, { windowRadius: -1 })).toThrow()
  })
})

// ── end-to-end: signal → verdict ────────────────────────────────────────────

describe('changeSignalFromGray → analyzeCutTiming end to end', () => {
  it('detects a hard cut built from raw frames', () => {
    // 30 frames, 1 px: black holds, one bright frame at index 15 (a cut), black again.
    const px = 1
    const bytes: number[] = []
    for (let f = 0; f < 30; f++) bytes.push(f === 15 ? 200 : 0)
    const sig = changeSignalFromGray(bytes, px)
    // Diffs spike at frame 15 (0→200) and 16 (200→0): a transition centred ≈15.5.
    const r = analyzeCutTiming(sig, [15], { windowRadius: 4, openingFrames: 2 })
    expect(r.ok).toBe(true)
    expect(r.findings[0].hasTransition).toBe(true)
  })
})
