/**
 * Unit tests for the beat-driven scene layout (`planBeatScenes`).
 *
 * These pin the *contract the ProductTour relies on* — every transition's cut
 * lands on a downbeat, the durations sum to exactly the song length at any fps,
 * the per-scene `fromFrame` matches Remotion's TransitionSeries offset, and the
 * layout is pure — rather than re-deriving the closed-form arithmetic, so a
 * regression is caught without the test silently agreeing with a buggy
 * implementation. Fixtures: the clean 120 BPM / 8 s map (exact at 24/30/60) and
 * the committed `test-beat` analysis (real, slightly off-grid detection).
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  planBeatScenes,
  transitionCenterFrames,
  type BeatSceneLayout,
} from '@/lib/beatScenes'
import { beatFrames, downbeatFrames, secondsToFrame, type BeatMap } from '@/lib/beatmap'
import intro from '@/lib/__fixtures__/intro.beats.json'

const introMap = intro as BeatMap

const testBeatMap = JSON.parse(
  readFileSync(new URL('../../public/audio/test-beat.beats.json', import.meta.url), 'utf8'),
) as BeatMap

/** Σ scene durations − (n−1)·T, the actual rendered length of a TransitionSeries. */
function renderedLength(layout: BeatSceneLayout): number {
  const sumScenes = layout.scenes.reduce((a, s) => a + s.durationInFrames, 0)
  return sumScenes - layout.transitions.length * layout.transitionFrames
}

describe('planBeatScenes — structure', () => {
  it('emits one slot per scene and one transition per interior cut', () => {
    const layout = planBeatScenes(introMap, 30, { sceneCount: 3 })
    expect(layout.scenes).toHaveLength(3)
    expect(layout.transitions).toHaveLength(2)
    expect(layout.cutFrames).toHaveLength(2)
  })

  it('lays a single scene across the whole song with no transitions', () => {
    const layout = planBeatScenes(introMap, 30, { sceneCount: 1 })
    expect(layout.scenes).toHaveLength(1)
    expect(layout.transitions).toHaveLength(0)
    expect(layout.scenes[0].fromFrame).toBe(0)
    expect(layout.scenes[0].durationInFrames).toBe(secondsToFrame(introMap.duration, 30))
  })

  it('rejects a scene count below 1', () => {
    expect(() => planBeatScenes(introMap, 30, { sceneCount: 0 })).toThrow()
  })
})

describe('planBeatScenes — total duration stays exact', () => {
  it('spans exactly the song length at the chosen fps', () => {
    for (const fps of [24, 30, 60]) {
      const layout = planBeatScenes(introMap, fps, { sceneCount: 3 })
      const total = secondsToFrame(introMap.duration, fps)
      expect(layout.totalFrames).toBe(total)
      // The actual rendered TransitionSeries length must equal totalFrames.
      expect(renderedLength(layout)).toBe(total)
    }
  })

  it('holds for a range of scene counts', () => {
    for (const sceneCount of [1, 2, 3, 4]) {
      const layout = planBeatScenes(introMap, 30, { sceneCount })
      expect(renderedLength(layout)).toBe(secondsToFrame(introMap.duration, 30))
    }
  })
})

describe('planBeatScenes — cuts land on downbeats', () => {
  it('centres every transition exactly on its cut frame', () => {
    const layout = planBeatScenes(introMap, 30, { sceneCount: 3 })
    expect(transitionCenterFrames(layout)).toEqual(layout.cutFrames)
  })

  it('chooses cut frames from the downbeat grid', () => {
    for (const fps of [24, 30, 60]) {
      const layout = planBeatScenes(introMap, fps, { sceneCount: 3 })
      const downbeats = downbeatFrames(introMap, fps)
      expect(layout.cutOn).toBe('downbeat')
      for (const cut of layout.cutFrames) expect(downbeats).toContain(cut)
    }
  })

  it('keeps cut frames strictly ascending', () => {
    const layout = planBeatScenes(introMap, 30, { sceneCount: 4 })
    for (let i = 1; i < layout.cutFrames.length; i++) {
      expect(layout.cutFrames[i]).toBeGreaterThan(layout.cutFrames[i - 1])
    }
  })
})

describe('planBeatScenes — fromFrame matches the TransitionSeries offset', () => {
  it('starts scene 0 at frame 0 and offsets later scenes by Σdₖ − i·T', () => {
    const layout = planBeatScenes(introMap, 30, { sceneCount: 3 })
    const T = layout.transitionFrames
    expect(layout.scenes[0].fromFrame).toBe(0)
    let prefix = 0
    for (let i = 0; i < layout.scenes.length; i++) {
      expect(layout.scenes[i].fromFrame).toBe(prefix - i * T)
      prefix += layout.scenes[i].durationInFrames
    }
  })

  it('never lets a scene be shorter than the transitions touching it', () => {
    // Remotion throws if a sequence is shorter than an adjacent transition.
    const layout = planBeatScenes(introMap, 30, { sceneCount: 3 })
    for (const scene of layout.scenes) {
      expect(scene.durationInFrames).toBeGreaterThanOrEqual(layout.transitionFrames)
    }
  })
})

describe('planBeatScenes — transition length', () => {
  it('defaults to about one beat, rounded to an even number of frames', () => {
    const layout = planBeatScenes(introMap, 30, { sceneCount: 3 })
    // 120 BPM @30fps → a beat is 15 frames; rounded up to even → 16.
    expect(layout.transitionFrames).toBe(16)
    expect(layout.transitionFrames % 2).toBe(0)
  })

  it('honours an explicit transitionFrames, clamped to an even ≥ 2', () => {
    expect(planBeatScenes(introMap, 30, { sceneCount: 3, transitionFrames: 20 }).transitionFrames).toBe(20)
    expect(planBeatScenes(introMap, 30, { sceneCount: 3, transitionFrames: 21 }).transitionFrames).toBe(22)
    expect(planBeatScenes(introMap, 30, { sceneCount: 3, transitionFrames: 0 }).transitionFrames).toBe(2)
    // A larger transition still keeps the cut centred on a downbeat.
    const layout = planBeatScenes(introMap, 30, { sceneCount: 3, transitionFrames: 20 })
    expect(transitionCenterFrames(layout)).toEqual(layout.cutFrames)
  })
})

describe('planBeatScenes — determinism', () => {
  it('returns a byte-identical layout for identical inputs', () => {
    const a = planBeatScenes(introMap, 30, { sceneCount: 3 })
    const b = planBeatScenes(introMap, 30, { sceneCount: 3 })
    expect(a).toEqual(b)
  })
})

describe('planBeatScenes — graceful fallback when the map is too sparse', () => {
  const sparseDownbeats: BeatMap = {
    duration: 10,
    bpm: 120,
    beats: Array.from({ length: 20 }, (_, i) => i * 0.5), // plenty of beats
    downbeats: [0], // ...but only one bar start
    onsets: [],
    sections: [],
  }

  it('falls back to beats when there are too few downbeats for the cuts', () => {
    const layout = planBeatScenes(sparseDownbeats, 30, { sceneCount: 3 })
    expect(layout.cutOn).toBe('beat')
    const beats = beatFrames(sparseDownbeats, 30)
    for (const cut of layout.cutFrames) expect(beats).toContain(cut)
    expect(renderedLength(layout)).toBe(secondsToFrame(10, 30))
  })

  it('falls back to an even split when beats are too sparse too', () => {
    const sparseEverything: BeatMap = {
      duration: 6,
      bpm: 120,
      beats: [0],
      downbeats: [0],
      onsets: [],
      sections: [],
    }
    const layout = planBeatScenes(sparseEverything, 30, { sceneCount: 3 })
    expect(layout.cutOn).toBe('even')
    expect(layout.cutFrames).toHaveLength(2)
    expect(layout.cutFrames[1]).toBeGreaterThan(layout.cutFrames[0])
    expect(renderedLength(layout)).toBe(secondsToFrame(6, 30))
  })
})

describe('planBeatScenes — the committed test-beat map (real detection)', () => {
  it('cuts the 3-scene tour on detected downbeats and stays 240 frames @30fps', () => {
    const layout = planBeatScenes(testBeatMap, 30, { sceneCount: 3 })
    expect(layout.cutOn).toBe('downbeat')
    expect(layout.totalFrames).toBe(240)
    expect(renderedLength(layout)).toBe(240)
    expect(transitionCenterFrames(layout)).toEqual(layout.cutFrames)
    const downbeats = downbeatFrames(testBeatMap, 30)
    for (const cut of layout.cutFrames) expect(downbeats).toContain(cut)
  })

  it('reports the bars each scene spans as a clean partition of the song', () => {
    const layout = planBeatScenes(testBeatMap, 30, { sceneCount: 3 })
    // The cut-bounded bar windows partition [0, totalFrames), so the per-scene
    // bar counts sum to every downbeat that falls within the song.
    const totalBars = layout.scenes.reduce((a, s) => a + s.bars, 0)
    const downbeatsInSong = downbeatFrames(testBeatMap, 30).filter((f) => f < layout.totalFrames)
    expect(totalBars).toBe(downbeatsInSong.length)
    for (const scene of layout.scenes) expect(scene.bars).toBeGreaterThanOrEqual(0)
  })
})
