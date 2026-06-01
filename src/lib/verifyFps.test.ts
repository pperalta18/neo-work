/**
 * Unit tests for the fps-invariance gate (`verifyFps.ts`).
 *
 * The headline music-sync guarantee is *"the same beat map renders correctly at
 * 24 / 30 / 60 fps"*. These tests pin that contract two ways that don't just echo
 * the implementation:
 *   1. They re-derive each cut's frame straight from the map's **seconds**
 *      (`round(t·fps)`) and from the downbeat list, independent of `planBeatScenes`,
 *      then assert the layout agrees — so a frame-math bug can't hide behind itself.
 *   2. They feed `crossFpsConsistent` hand-built facts where the fps *disagree*
 *      and assert it reports a failure — proving the gate actually rejects a
 *      regression instead of rubber-stamping it.
 *
 * Fixtures: the clean 120 BPM / 8 s `intro` map (exact on the grid at every fps)
 * and the committed `test-beat` analysis (real, slightly off-grid detection).
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  crossFpsConsistent,
  fpsInvarianceReport,
  fpsLayoutFacts,
  renderedLength,
  type FpsLayoutFacts,
} from '@/lib/verifyFps'
import { planBeatScenes } from '@/lib/beatScenes'
import { secondsToFrame, type BeatMap } from '@/lib/beatmap'
import intro from '@/lib/__fixtures__/intro.beats.json'

const introMap = intro as BeatMap
const testBeatMap = JSON.parse(
  readFileSync(new URL('../../public/audio/test-beat.beats.json', import.meta.url), 'utf8'),
) as BeatMap

const SCENE_COUNT = 3 // the ProductTour lays out 3 scenes
const FPS_SET = [24, 30, 60]

describe('fpsInvarianceReport — the contract holds across 24/30/60 fps', () => {
  for (const map of [{ name: 'intro (clean)', map: introMap }, { name: 'test-beat (real)', map: testBeatMap }]) {
    it(`passes for the ${map.name} map`, () => {
      const report = fpsInvarianceReport(map.map, SCENE_COUNT, FPS_SET)
      expect(report.ok).toBe(true)
      expect(report.problems).toHaveLength(0)
      expect(report.facts).toHaveLength(3)
    })
  }

  it('spans exactly the song length at every fps (no hardcoded fps)', () => {
    const report = fpsInvarianceReport(introMap, SCENE_COUNT, FPS_SET)
    for (const f of report.facts) {
      // Re-derived from seconds, independent of the layout.
      expect(f.totalFrames).toBe(secondsToFrame(introMap.duration, f.fps))
      expect(f.renderedLength).toBe(f.totalFrames)
    }
    // 8 s at 24/30/60 → 192/240/480 frames.
    expect(report.facts.map((f) => f.totalFrames)).toEqual([192, 240, 480])
  })

  it('lands every cut on the SAME downbeats regardless of fps', () => {
    const report = fpsInvarianceReport(testBeatMap, SCENE_COUNT, FPS_SET)
    expect(report.cutOn).toBe('downbeat')
    // The cross-fps fingerprint: identical downbeat indices at every fps.
    const ref = report.facts[0].cutEventIndices
    expect(ref).toHaveLength(SCENE_COUNT - 1)
    for (const f of report.facts) expect(f.cutEventIndices).toEqual(ref)
    // …and the picked indices are real, ascending bar starts.
    for (let i = 1; i < ref.length; i++) expect(ref[i]).toBeGreaterThan(ref[i - 1])
    for (const idx of ref) {
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(testBeatMap.downbeats.length)
    }
  })

  it('places each cut on round(downbeatSeconds · fps), re-derived from the map', () => {
    for (const map of [introMap, testBeatMap]) {
      const report = fpsInvarianceReport(map, SCENE_COUNT, FPS_SET)
      for (const f of report.facts) {
        f.cutFrames.forEach((cut, i) => {
          const downbeatSeconds = map.downbeats[f.cutEventIndices[i]]
          // Independent re-derivation: the frame the cut MUST sit on at this fps.
          expect(cut).toBe(secondsToFrame(downbeatSeconds, f.fps))
        })
      }
    }
  })

  it('is deterministic — same inputs, byte-identical report', () => {
    const a = fpsInvarianceReport(introMap, SCENE_COUNT, FPS_SET)
    const b = fpsInvarianceReport(introMap, SCENE_COUNT, FPS_SET)
    expect(a).toEqual(b)
  })
})

describe('fpsLayoutFacts — matches a directly computed layout', () => {
  it('reports the same total/rendered length planBeatScenes produces', () => {
    for (const fps of FPS_SET) {
      const facts = fpsLayoutFacts(introMap, fps, SCENE_COUNT)
      const layout = planBeatScenes(introMap, fps, { sceneCount: SCENE_COUNT })
      expect(facts.totalFrames).toBe(layout.totalFrames)
      expect(facts.renderedLength).toBe(renderedLength(layout))
      expect(facts.cutFrames).toEqual(layout.cutFrames)
    }
  })
})

describe('crossFpsConsistent — actually rejects a mismatch (not a no-op)', () => {
  /** A minimal facts object; only the fields the cross-check reads matter. */
  const facts = (over: Partial<FpsLayoutFacts>): FpsLayoutFacts => ({
    fps: 30,
    totalFrames: 240,
    renderedLength: 240,
    transitionFrames: 16,
    cutOn: 'downbeat',
    cutFrames: [60, 180],
    cutEventIndices: [1, 3],
    cutFractions: [0.25, 0.75],
    ...over,
  })

  it('accepts fps that agree on the same downbeat indices', () => {
    const res = crossFpsConsistent([
      facts({ fps: 24, totalFrames: 192, cutFrames: [48, 144] }),
      facts({ fps: 30, totalFrames: 240, cutFrames: [60, 180] }),
      facts({ fps: 60, totalFrames: 480, cutFrames: [120, 360] }),
    ])
    expect(res.ok).toBe(true)
  })

  it('rejects fps that land cuts on DIFFERENT downbeats', () => {
    const res = crossFpsConsistent([
      facts({ fps: 24, cutEventIndices: [1, 3] }),
      facts({ fps: 30, cutEventIndices: [1, 2] }), // a different bar — regression
    ])
    expect(res.ok).toBe(false)
    expect(res.reason).toMatch(/different/i)
  })

  it('rejects fps that disagree on the cut class', () => {
    const res = crossFpsConsistent([
      facts({ fps: 24, cutOn: 'downbeat' }),
      facts({ fps: 30, cutOn: 'beat' }),
    ])
    expect(res.ok).toBe(false)
    expect(res.reason).toMatch(/class differs/i)
  })

  it('rejects fps that disagree on the number of cuts', () => {
    const res = crossFpsConsistent([
      facts({ fps: 24, cutFrames: [60, 180], cutEventIndices: [1, 3] }),
      facts({ fps: 30, cutFrames: [60], cutEventIndices: [1] }),
    ])
    expect(res.ok).toBe(false)
    expect(res.reason).toMatch(/count differs/i)
  })

  it('treats a single fps as trivially consistent', () => {
    expect(crossFpsConsistent([facts({})]).ok).toBe(true)
  })

  describe('the even-split fallback compares fractions, not indices', () => {
    const even = (fps: number, fractions: number[]): FpsLayoutFacts =>
      facts({ fps, cutOn: 'even', cutEventIndices: [-1, -1], cutFractions: fractions })

    it('accepts even splits at the same fractional positions', () => {
      const res = crossFpsConsistent([even(24, [0.333, 0.667]), even(60, [0.334, 0.666])])
      expect(res.ok).toBe(true)
    })

    it('rejects even splits that drift apart', () => {
      const res = crossFpsConsistent([even(24, [0.333, 0.667]), even(60, [0.5, 0.9])])
      expect(res.ok).toBe(false)
      expect(res.reason).toMatch(/drift/i)
    })
  })
})

describe('fpsInvarianceReport — sparse map that falls back to an even split', () => {
  // Too few downbeats to carry 2 cuts → the layout falls back, and it must still
  // be fps-consistent (the same even split at every fps).
  const sparse: BeatMap = {
    duration: 9,
    bpm: 120,
    beats: [0],
    downbeats: [0],
    onsets: [],
    sections: [],
  }

  it('still passes the cross-fps check under the even fallback', () => {
    const report = fpsInvarianceReport(sparse, SCENE_COUNT, FPS_SET)
    expect(report.cutOn).toBe('even')
    expect(report.ok).toBe(true)
  })
})
