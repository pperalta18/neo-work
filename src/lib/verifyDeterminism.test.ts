/**
 * Unit tests for the render-determinism gate (`verifyDeterminism.ts`).
 *
 * The contract is the music-sync bedrock: *"rendering ProductTour twice yields
 * byte-identical frames"*. The pure half decides two things without booting
 * Remotion — which frames to sample, and (given two hashes per frame) whether the
 * renders agree. These tests pin both without echoing the implementation, and in
 * particular prove the gate is NOT a no-op:
 *   - an empty comparison FAILS (rendered nothing → proven nothing), and
 *   - a hand-built mismatch is REPORTED with the offending frame.
 */
import { describe, expect, it } from 'vitest'
import {
  chooseSampleFrames,
  determinismReport,
  type FrameRenderPair,
} from '@/lib/verifyDeterminism'

describe('chooseSampleFrames — picks which frames to render twice', () => {
  it('always includes the first and last frame', () => {
    const frames = chooseSampleFrames(240, [], 8)
    expect(frames[0]).toBe(0)
    expect(frames[frames.length - 1]).toBe(239) // totalFrames - 1
  })

  it('returns a sorted, de-duplicated, in-range set', () => {
    const frames = chooseSampleFrames(240, [60, 60, 180], 8)
    // sorted ascending
    for (let i = 1; i < frames.length; i++) expect(frames[i]).toBeGreaterThan(frames[i - 1])
    // unique
    expect(new Set(frames).size).toBe(frames.length)
    // in range [0, last]
    for (const f of frames) {
      expect(f).toBeGreaterThanOrEqual(0)
      expect(f).toBeLessThanOrEqual(239)
    }
  })

  it('always samples the supplied cut frames (the transition boundaries)', () => {
    const frames = chooseSampleFrames(240, [60, 180], 8)
    expect(frames).toContain(60)
    expect(frames).toContain(180)
  })

  it('drops cut frames that fall out of range', () => {
    const frames = chooseSampleFrames(100, [-5, 50, 100, 250], 8)
    expect(frames).toContain(50) // in range
    expect(frames).not.toContain(-5)
    expect(frames).not.toContain(100) // == totalFrames, i.e. == last + 1
    expect(frames).not.toContain(250)
  })

  it('gives even coverage of count distinct frames when the clip is long enough', () => {
    // 240 frames, count 8, no cuts → 8 evenly spaced, all distinct.
    const frames = chooseSampleFrames(240, [], 8)
    expect(frames).toHaveLength(8)
    expect(frames).toEqual([0, 34, 68, 102, 137, 171, 205, 239])
  })

  it('handles a single-frame composition', () => {
    expect(chooseSampleFrames(1, [0], 8)).toEqual([0])
  })

  it('returns nothing for a non-positive length', () => {
    expect(chooseSampleFrames(0)).toEqual([])
    expect(chooseSampleFrames(-10)).toEqual([])
    expect(chooseSampleFrames(Number.NaN)).toEqual([])
  })

  it('is deterministic — same inputs, same frames', () => {
    expect(chooseSampleFrames(480, [120, 360], 8)).toEqual(chooseSampleFrames(480, [120, 360], 8))
  })
})

describe('determinismReport — verdict on two renders of each frame', () => {
  const pair = (frame: number, hashA: string, hashB = hashA): FrameRenderPair => ({
    frame,
    hashA,
    hashB,
  })

  it('passes when every sampled frame is byte-identical', () => {
    const report = determinismReport([pair(0, 'aaaa'), pair(120, 'bbbb'), pair(239, 'cccc')])
    expect(report.ok).toBe(true)
    expect(report.total).toBe(3)
    expect(report.identical).toBe(3)
    expect(report.divergences).toHaveLength(0)
    expect(report.reason).toMatch(/byte-identical/i)
  })

  it('FAILS (not a no-op) when a frame differs, naming the first offender', () => {
    const report = determinismReport([
      pair(0, 'aaaa'),
      { frame: 120, hashA: 'beef0001', hashB: 'beef9999' }, // drift
      pair(239, 'cccc'),
    ])
    expect(report.ok).toBe(false)
    expect(report.identical).toBe(2)
    expect(report.divergences).toEqual([{ frame: 120, hashA: 'beef0001', hashB: 'beef9999' }])
    expect(report.reason).toMatch(/frame 120/)
    expect(report.reason).toMatch(/differ/i)
  })

  it('reports every divergence, in order', () => {
    const report = determinismReport([
      { frame: 10, hashA: 'x', hashB: 'y' },
      pair(20, 'same'),
      { frame: 30, hashA: 'p', hashB: 'q' },
    ])
    expect(report.ok).toBe(false)
    expect(report.divergences.map((d) => d.frame)).toEqual([10, 30])
  })

  it('FAILS on an empty comparison — a gate that rendered nothing proves nothing', () => {
    const report = determinismReport([])
    expect(report.ok).toBe(false)
    expect(report.total).toBe(0)
    expect(report.reason).toMatch(/no frames|unproven/i)
  })

  it('is deterministic — same input, identical report', () => {
    const pairs = [pair(0, 'aaaa'), { frame: 1, hashA: 'p', hashB: 'q' }]
    expect(determinismReport(pairs)).toEqual(determinismReport(pairs))
  })
})
