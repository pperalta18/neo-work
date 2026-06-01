/**
 * Unit tests for the beat-map contract & authoring helpers.
 *
 * These pin the *behaviour an author relies on* — the frame a beat lands on,
 * which section a frame belongs to, half-open boundaries, fps-invariance and
 * purity (Remotion determinism) — rather than re-deriving the arithmetic, so a
 * regression in any helper is caught without the test silently agreeing with a
 * buggy implementation. The fixture is a clean 120 BPM / 8 s map whose grid is
 * exact at 24 / 30 / 60 fps, plus one off-grid golpe (3.25 s) to exercise
 * rounding.
 */

import { describe, expect, it } from 'vitest'
import {
  accentFrames,
  bandEnergyAt,
  beatFrames,
  downbeatFrames,
  formatFrameSummary,
  formatMoments,
  frameToSeconds,
  momentFrames,
  momentFramesFor,
  momentPulseAt,
  nextDownbeat,
  nextMoment,
  overallEnergyAt,
  primaryMoment,
  secondsToFrame,
  sectionAt,
  type BeatMap,
} from '@/lib/beatmap'
import intro from '@/lib/__fixtures__/intro.beats.json'

const map = intro as BeatMap

describe('secondsToFrame / frameToSeconds', () => {
  it('rounds seconds to the nearest frame', () => {
    expect(secondsToFrame(0.5, 30)).toBe(15)
    expect(secondsToFrame(0, 30)).toBe(0)
    expect(secondsToFrame(8, 30)).toBe(240)
  })

  it('rounds half up (the off-grid golpe at 3.25s)', () => {
    expect(secondsToFrame(3.25, 30)).toBe(98) // 97.5 → 98
    expect(secondsToFrame(3.25, 24)).toBe(78) // exact
    expect(secondsToFrame(3.25, 60)).toBe(195) // exact
  })

  it('frameToSeconds is the grid inverse for integer frames', () => {
    for (const fps of [24, 30, 60]) {
      for (const f of [0, 1, 15, 240]) {
        expect(secondsToFrame(frameToSeconds(f, fps), fps)).toBe(f)
      }
    }
  })

  it('frameToSeconds recovers seconds to within half a frame', () => {
    for (const fps of [24, 30, 60]) {
      for (const t of [0, 0.5, 3.25, 7.5]) {
        const back = frameToSeconds(secondsToFrame(t, fps), fps)
        expect(Math.abs(back - t)).toBeLessThanOrEqual(0.5 / fps + 1e-9)
      }
    }
  })
})

describe('beatFrames', () => {
  it('maps every beat to its frame, preserving count and order', () => {
    const f = beatFrames(map, 30)
    expect(f.length).toBe(map.beats.length)
    expect(f.slice(0, 5)).toEqual([0, 15, 30, 45, 60])
    // strictly ascending
    for (let i = 1; i < f.length; i++) expect(f[i]).toBeGreaterThan(f[i - 1])
  })

  it('is fps-agnostic (no hardcoded fps): each frame is round(t*fps)', () => {
    for (const fps of [24, 30, 60]) {
      expect(beatFrames(map, fps)).toEqual(map.beats.map((t) => Math.round(t * fps)))
    }
  })
})

describe('downbeatFrames', () => {
  it('maps the four bar starts at 30fps', () => {
    expect(downbeatFrames(map, 30)).toEqual([0, 60, 120, 180])
  })

  it('scales with fps', () => {
    expect(downbeatFrames(map, 24)).toEqual([0, 48, 96, 144])
    expect(downbeatFrames(map, 60)).toEqual([0, 120, 240, 360])
  })
})

describe('accentFrames (golpes)', () => {
  it('maps onsets, rounding the off-grid hit', () => {
    expect(accentFrames(map, 30)).toEqual([30, 98, 180])
    expect(accentFrames(map, 24)).toEqual([24, 78, 144])
  })
})

describe('nextDownbeat', () => {
  it('returns the current frame when it already sits on a downbeat (at-or-after)', () => {
    expect(nextDownbeat(map, 0, 30)).toBe(0)
    expect(nextDownbeat(map, 60, 30)).toBe(60)
    expect(nextDownbeat(map, 180, 30)).toBe(180)
  })

  it('returns the upcoming bar start when between downbeats', () => {
    expect(nextDownbeat(map, 1, 30)).toBe(60)
    expect(nextDownbeat(map, 61, 30)).toBe(120)
  })

  it('returns null past the last downbeat', () => {
    expect(nextDownbeat(map, 181, 30)).toBeNull()
    expect(nextDownbeat(map, 10_000, 30)).toBeNull()
  })

  it('tracks the grid across fps', () => {
    expect(nextDownbeat(map, 1, 60)).toBe(120)
    expect(nextDownbeat(map, 1, 24)).toBe(48)
  })
})

describe('sectionAt', () => {
  it('locates the section a frame falls in', () => {
    expect(sectionAt(map, 0, 30)?.name).toBe('intro')
    expect(sectionAt(map, 119, 30)?.name).toBe('intro')
    expect(sectionAt(map, 200, 30)?.name).toBe('build')
  })

  it('treats sections as half-open: the boundary frame belongs to the next section', () => {
    // 4.0s → frame 120 is the intro→build boundary.
    expect(sectionAt(map, 120, 30)?.name).toBe('build')
  })

  it('gives the final closing frame to the last section', () => {
    // 8.0s → frame 240 is the song end; build owns it.
    expect(sectionAt(map, 240, 30)?.name).toBe('build')
  })

  it('returns null past the end of the last section', () => {
    expect(sectionAt(map, 241, 30)).toBeNull()
  })

  it('returns null in a gap before the first section', () => {
    const gapped: BeatMap = {
      ...map,
      sections: [{ name: 'verse', start: 2, end: 6 }],
    }
    expect(sectionAt(gapped, 0, 30)).toBeNull() // t=0 < 2
    expect(sectionAt(gapped, 90, 30)?.name).toBe('verse') // t=3
  })

  it('returns null when there are no sections', () => {
    const empty: BeatMap = { ...map, sections: [] }
    expect(sectionAt(empty, 30, 30)).toBeNull()
  })
})

describe('formatFrameSummary', () => {
  it('renders a readable, frame-indexed summary', () => {
    const s = formatFrameSummary(map, 30)
    expect(s).toContain('@ 30fps')
    expect(s).toContain('120 BPM')
    expect(s).toContain('8.00s (240 frames)')
    expect(s).toContain('beats     (16): 0, 15, 30')
    expect(s).toContain('downbeats (4): 0, 60, 120, 180')
    expect(s).toContain('golpes    (3): 30, 98, 180')
    expect(s).toContain('intro: frames 0–120 (0.00–4.00s)')
    expect(s).toContain('build: frames 120–240 (4.00–8.00s)')
  })

  it('reflects the chosen fps in the printed frames', () => {
    expect(formatFrameSummary(map, 60)).toContain('downbeats (4): 0, 120, 240, 360')
  })

  it('handles an empty section list', () => {
    const empty: BeatMap = { ...map, sections: [] }
    expect(formatFrameSummary(empty, 30)).toContain('sections  (0): —')
  })

  it('is pure — same map + fps gives a byte-identical string', () => {
    expect(formatFrameSummary(map, 30)).toBe(formatFrameSummary(map, 30))
  })
})

describe('bandEnergyAt / overallEnergyAt (committed envelopes)', () => {
  // Bands at 1 Hz: a triangle on low, ramps on mid/high. At 10 fps, frame 5 = t0.5.
  const energetic: BeatMap = {
    ...map,
    bands: { hz: 1, low: [0, 1, 0], mid: [0, 0.5, 1], high: [1, 0.5, 0] },
  }

  it('linearly interpolates a band between samples', () => {
    expect(bandEnergyAt(energetic, 'low', 0, 10)).toBe(0)
    expect(bandEnergyAt(energetic, 'low', 10, 10)).toBe(1) // t=1s, exact sample
    expect(bandEnergyAt(energetic, 'low', 5, 10)).toBeCloseTo(0.5) // halfway 0→1
    expect(bandEnergyAt(energetic, 'low', 15, 10)).toBeCloseTo(0.5) // halfway 1→0
  })

  it('clamps past the ends and returns 0 without bands', () => {
    expect(bandEnergyAt(energetic, 'high', 1000, 10)).toBe(0) // clamps to last sample (0)
    const { bands: _omit, ...noBands } = map
    expect(bandEnergyAt(noBands as BeatMap, 'low', 5, 10)).toBe(0)
    expect(overallEnergyAt(noBands as BeatMap, 5, 10)).toBe(0)
  })

  it('overallEnergyAt averages the three bands', () => {
    // t=1s exact: (low1 + mid0.5 + high0.5)/3 = (1 + 0.5 + 0.5)/3
    expect(overallEnergyAt(energetic, 10, 10)).toBeCloseTo((1 + 0.5 + 0.5) / 3)
  })

  it('stays deterministic and never mutates the map', () => {
    const before = JSON.stringify(energetic)
    bandEnergyAt(energetic, 'mid', 7, 10)
    overallEnergyAt(energetic, 7, 10)
    expect(JSON.stringify(energetic)).toBe(before)
  })
})

describe('formatFrameSummary with energy (structure block)', () => {
  const energetic: BeatMap = {
    duration: 8,
    bpm: 120,
    beats: map.beats,
    downbeats: map.downbeats,
    onsets: map.onsets,
    bands: { hz: 1, low: Array(8).fill(0.5), mid: Array(8).fill(0.5), high: Array(8).fill(0.5) },
    sections: [
      { name: 'intro', start: 0, end: 4, intensity: 0.12, shape: 'rising' },
      { name: 'drop', start: 4, end: 8, intensity: 0.93, shape: 'steady' },
    ],
  }

  it('renders the energy band line and the rich structure block', () => {
    const s = formatFrameSummary(energetic, 30)
    expect(s).toContain('energy    : low/mid/high envelopes @ 1Hz (8 samples each)')
    expect(s).toContain('structure (2 sections, energy-cut):')
    expect(s).toContain('intro')
    expect(s).toContain('0.12')
    expect(s).toContain('rising')
    expect(s).toContain('0.93')
    // it does NOT fall back to the plain "sections (N):" listing
    expect(s).not.toContain('sections  (2):')
  })

  it('keeps the plain listing when sections carry no intensity', () => {
    expect(formatFrameSummary(map, 30)).toContain('sections  (2):')
  })
})

describe('structural moments (hit points)', () => {
  const withMoments: BeatMap = {
    ...map,
    moments: [
      { time: 1, type: 'lift', strength: 0.4 },
      { time: 3, type: 'drop', strength: 1.0 },
      { time: 6, type: 'break', strength: 0.6 },
      { time: 7, type: 'dropout', strength: 0.9 },
    ],
  }

  it('maps moment frames, all and by type', () => {
    expect(momentFrames(withMoments, 10)).toEqual([10, 30, 60, 70])
    expect(momentFramesFor(withMoments, 'drop', 10)).toEqual([30])
    expect(momentFramesFor(withMoments, 'dropout', 10)).toEqual([70])
    expect(momentFrames(map, 10)).toEqual([]) // none on the bare fixture
  })

  it('nextMoment returns the upcoming hit (at-or-after), else null', () => {
    expect(nextMoment(withMoments, 0, 10)?.type).toBe('lift')
    expect(nextMoment(withMoments, 31, 10)?.type).toBe('break') // past the drop frame (30)
    expect(nextMoment(withMoments, 71, 10)).toBeNull()
  })

  it('primaryMoment is the strongest hit', () => {
    expect(primaryMoment(withMoments)?.type).toBe('drop')
    expect(primaryMoment(map)).toBeNull()
  })

  it('momentPulseAt is strength-weighted and type-filterable', () => {
    // on the drop frame: pulse 1 × strength 1.0
    expect(momentPulseAt(withMoments, undefined, 30, 10, { decay: 5 })).toBeCloseTo(1.0)
    // on the lift frame: pulse 1 × strength 0.4
    expect(momentPulseAt(withMoments, undefined, 10, 10, { decay: 5 })).toBeCloseTo(0.4)
    // filtering to drops mutes the lift entirely
    expect(momentPulseAt(withMoments, 'drop', 10, 10, { decay: 5 })).toBe(0)
    // decays between hits
    expect(momentPulseAt(withMoments, 'drop', 33, 10, { decay: 5 })).toBeCloseTo(1.0 * (1 - 3 / 5))
  })

  it('formatMoments renders a typed, strength-metered block', () => {
    const s = formatMoments(withMoments, 10)
    expect(s[0]).toContain('moments   (4)')
    expect(s.join('\n')).toContain('▲ drop')
    expect(s.join('\n')).toContain('○ dropout')
    expect(s.join('\n')).toContain('1.00')
  })
})

describe('purity (Remotion determinism)', () => {
  it('no helper mutates the beat map', () => {
    const before = JSON.stringify(map)
    beatFrames(map, 30)
    downbeatFrames(map, 30)
    accentFrames(map, 30)
    nextDownbeat(map, 50, 30)
    sectionAt(map, 50, 30)
    formatFrameSummary(map, 30)
    expect(JSON.stringify(map)).toBe(before)
  })

  it('the fixture map is well-formed: beats/downbeats/onsets sorted ascending', () => {
    const sorted = (xs: number[]) => xs.every((v, i) => i === 0 || v > xs[i - 1])
    expect(sorted(map.beats)).toBe(true)
    expect(sorted(map.downbeats)).toBe(true)
    expect(sorted(map.onsets)).toBe(true)
    // downbeats are a subset of beats
    for (const d of map.downbeats) expect(map.beats).toContain(d)
  })
})
