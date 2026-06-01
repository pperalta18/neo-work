/**
 * Unit tests for the offline beat-analyser's pure derivations
 * (src/lib/beatAnalysis.ts — the math behind scripts/analyze-beats.mjs).
 * essentia.js + ffmpeg are the analyser's only impure edges and live in the
 * `.mjs` shell, so exercising the math here (arg parsing, downbeat/section
 * derivation, offset/grid corrections, rounding, validation) needs no WASM and
 * no shelling out — the same "keep the math pure so it's node-testable" split
 * the rest of the beat-map layer follows.
 *
 * Tests assert the documented contract (4/4 downbeat grouping, contiguous
 * sections covering [0, duration], out-of-range drops, ascending/in-range
 * validation, last-section-ends-at-duration) rather than echoing arithmetic, so
 * a broken implementation can't quietly pass. A final block guards the committed
 * `public/audio/test-beat.beats.json` so an analyser regression is caught too.
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  applyOffset,
  assembleBeatMap,
  buildBeatGrid,
  defaultOutPath,
  deriveDownbeats,
  deriveSections,
  parseArgs,
  roundTo,
  serializeBeatMap,
  validateBeatMap,
} from '@/lib/beatAnalysis'
import { beatFrames, downbeatFrames, type BeatMap } from '@/lib/beatmap'

describe('parseArgs', () => {
  it('applies sensible defaults and reads the positional input', () => {
    expect(parseArgs(['song.mp3'])).toMatchObject({ input: 'song.mp3', fps: 30, bar: 4, sectionBars: 8 })
  })

  it('parses every flag (and the --beats-per-bar alias)', () => {
    const a = parseArgs(['x.wav', '--fps', '60', '--bpm', '128', '--offset', '0.25', '--section-bars', '4', '--out', 'o.json'])
    expect(a).toMatchObject({ input: 'x.wav', fps: 60, bpm: 128, offset: 0.25, sectionBars: 4, out: 'o.json' })
    expect(parseArgs(['x.wav', '--beats-per-bar', '3']).bar).toBe(3)
  })

  it('throws on an unknown flag', () => {
    expect(() => parseArgs(['x.wav', '--nope'])).toThrow(/Unknown flag/)
  })

  it('leaves bpm/offset absent when not provided (so overrides stay off)', () => {
    const a = parseArgs(['x.wav'])
    expect('bpm' in a).toBe(false)
    expect('offset' in a).toBe(false)
  })

  it('defaults to energy sections + 20Hz bands, and reads the energy flags', () => {
    expect(parseArgs(['x.wav'])).toMatchObject({ sections: 'energy', bandHz: 20, bands: true })
    expect(parseArgs(['x.wav', '--sections', 'bars', '--band-hz', '12', '--no-bands'])).toMatchObject({
      sections: 'bars',
      bandHz: 12,
      bands: false,
    })
  })

  it('rejects an invalid --sections mode', () => {
    expect(() => parseArgs(['x.wav', '--sections', 'wat'])).toThrow(/--sections/)
  })
})

describe('defaultOutPath', () => {
  it('swaps the audio extension for .beats.json', () => {
    expect(defaultOutPath('public/audio/intro.mp3')).toBe('public/audio/intro.beats.json')
  })

  it('only replaces the final extension', () => {
    expect(defaultOutPath('track.final.wav')).toBe('track.final.beats.json')
  })

  it('appends when the filename has no extension', () => {
    expect(defaultOutPath('song')).toBe('song.beats.json')
    expect(defaultOutPath('a.b/intro')).toBe('a.b/intro.beats.json')
  })
})

describe('roundTo', () => {
  it('rounds to four places by default', () => {
    expect(roundTo(0.48761234)).toBe(0.4876)
  })

  it('honours an explicit precision', () => {
    expect(roundTo(119.756, 2)).toBe(119.76)
    expect(roundTo(7.5, 0)).toBe(8)
  })
})

describe('deriveDownbeats', () => {
  it('takes every beatsPerBar-th beat from the offset', () => {
    expect(deriveDownbeats([0, 1, 2, 3, 4, 5, 6, 7], 4)).toEqual([0, 4])
    expect(deriveDownbeats([0, 1, 2, 3, 4], 2, 1)).toEqual([1, 3])
  })

  it('returns empty for no beats and rejects a sub-1 bar length', () => {
    expect(deriveDownbeats([], 4)).toEqual([])
    expect(() => deriveDownbeats([0, 1], 0)).toThrow(/beatsPerBar/)
  })
})

describe('buildBeatGrid', () => {
  it('produces a uniform 60/bpm grid covering [0, duration]', () => {
    const g = buildBeatGrid(120, 0, 2)
    expect(g[0]).toBe(0)
    expect(g.at(-1)).toBeCloseTo(2, 6)
    for (let i = 1; i < g.length; i++) expect(g[i] - g[i - 1]).toBeCloseTo(0.5, 6)
  })

  it('phase-aligns to firstBeat, folding it into the first [0, step) window', () => {
    const g = buildBeatGrid(120, -0.1, 1) // step 0.5 → start folds to 0.4
    expect(g[0]).toBeGreaterThanOrEqual(0)
    expect(g[0]).toBeLessThan(0.5)
    expect(g[0]).toBeCloseTo(0.4, 6)
  })

  it('rejects a non-positive bpm', () => {
    expect(() => buildBeatGrid(0, 0, 1)).toThrow(/bpm/)
  })
})

describe('deriveSections', () => {
  it('falls back to one whole-song section when there are no downbeats', () => {
    expect(deriveSections([], 8, 8)).toEqual([{ name: 'part 1', start: 0, end: 8 }])
  })

  it('groups bars into phrases that start at 0 and end exactly at duration', () => {
    const s = deriveSections([0, 2, 4, 6], 8, 2)
    expect(s).toHaveLength(2)
    expect(s[0].start).toBe(0)
    expect(s.at(-1)!.end).toBe(8)
    // contiguous, no gaps or overlaps
    for (let i = 1; i < s.length; i++) expect(s[i].start).toBe(s[i - 1].end)
    expect(s.map((x) => x.name)).toEqual(['part 1', 'part 2'])
  })

  it('collapses to a single section when a phrase spans all the bars', () => {
    expect(deriveSections([0, 2, 4], 6, 8)).toEqual([{ name: 'part 1', start: 0, end: 6 }])
  })

  it('forces the last section to close on duration even with one bar per section', () => {
    const s = deriveSections([1, 2, 3], 5, 1)
    expect(s[0].start).toBe(0)
    expect(s.at(-1)!.end).toBe(5)
    for (let i = 1; i < s.length; i++) expect(s[i].start).toBe(s[i - 1].end)
  })

  it('rejects a sub-1 section length', () => {
    expect(() => deriveSections([0], 1, 0)).toThrow(/sectionBars/)
  })
})

describe('applyOffset', () => {
  it('returns a fresh copy unchanged for a zero offset', () => {
    const t = [0, 1, 2]
    const out = applyOffset(t, 0, 2)
    expect(out).toEqual(t)
    expect(out).not.toBe(t)
  })

  it('shifts forward and drops anything past the end', () => {
    expect(applyOffset([0, 1, 2], 0.5, 2)).toEqual([0.5, 1.5])
  })

  it('shifts back and drops anything before the start', () => {
    expect(applyOffset([0, 1, 2], -0.5, 2)).toEqual([0.5, 1.5])
  })
})

describe('assembleBeatMap', () => {
  it('rounds times to 4dp, bpm to 2dp, and shapes the BeatMap', () => {
    const map = assembleBeatMap({
      duration: 8.00004,
      bpm: 119.756,
      beats: [0.123456, 7.499999],
      downbeats: [0.123456],
      onsets: [1.999999],
      sections: [{ name: 'a', start: 0, end: 8.00004 }],
    })
    expect(map.duration).toBe(8)
    expect(map.bpm).toBe(119.76)
    expect(map.beats).toEqual([0.1235, 7.5])
    expect(map.onsets).toEqual([2])
    expect(map.sections[0].end).toBe(8)
  })

  it('omits bands unless provided', () => {
    const base = { duration: 1, bpm: 60, beats: [], downbeats: [], onsets: [], sections: [] }
    expect('bands' in assembleBeatMap(base)).toBe(false)
    const bands = { hz: 10, low: [0], mid: [0], high: [0] }
    expect(assembleBeatMap({ ...base, bands }).bands).toEqual(bands)
  })

  it('carries a section intensity (3dp) and shape through, and omits them when absent', () => {
    const map = assembleBeatMap({
      duration: 4,
      bpm: 60,
      beats: [],
      downbeats: [],
      onsets: [],
      sections: [
        { name: 'drop', start: 0, end: 2, intensity: 0.91234, shape: 'rising' },
        { name: 'plain', start: 2, end: 4 },
      ],
    })
    expect(map.sections[0]).toEqual({ name: 'drop', start: 0, end: 2, intensity: 0.912, shape: 'rising' })
    expect('intensity' in map.sections[1]).toBe(false)
    expect('shape' in map.sections[1]).toBe(false)
  })
})

describe('serializeBeatMap', () => {
  const map: BeatMap = {
    duration: 4,
    bpm: 120,
    beats: [0, 1, 2, 3],
    downbeats: [0, 2],
    onsets: [0.5, 2.5],
    sections: [{ name: 'intro', start: 0, end: 4, intensity: 0.5, shape: 'steady' }],
    bands: { hz: 2, low: [0, 0.5, 1, 0.2], mid: [0.1, 0.2, 0.3, 0.4], high: [1, 1, 1, 1] },
  }

  it('round-trips to an equal map (collapsing is JSON-preserving)', () => {
    expect(JSON.parse(serializeBeatMap(map))).toEqual(map)
  })

  it('collapses numeric arrays onto one line but keeps sections expanded', () => {
    const s = serializeBeatMap(map)
    expect(s).toContain('"beats": [0, 1, 2, 3]')
    expect(s).toContain('"low": [0, 0.5, 1, 0.2]')
    expect(s).toContain('"high": [1, 1, 1, 1]')
    // object arrays stay pretty (one key per line)
    expect(s).toMatch(/"sections": \[\n\s+\{/)
    expect(s).toContain('"name": "intro"')
  })

  it('is pure — same map gives a byte-identical string', () => {
    expect(serializeBeatMap(map)).toBe(serializeBeatMap(map))
  })
})

describe('validateBeatMap — energy extensions', () => {
  const good = (): BeatMap => ({
    duration: 4,
    bpm: 120,
    beats: [0, 2],
    downbeats: [0],
    onsets: [1],
    sections: [{ name: 'p', start: 0, end: 4, intensity: 0.5, shape: 'rising' }],
    bands: { hz: 1, low: [0, 1], mid: [0.2, 0.3], high: [1, 0] },
  })

  it('accepts a map carrying valid bands + section dynamics', () => {
    const m = good()
    expect(validateBeatMap(m)).toBe(m)
  })

  it('rejects an out-of-range section intensity and a bad shape', () => {
    expect(() => validateBeatMap({ ...good(), sections: [{ name: 'p', start: 0, end: 4, intensity: 1.5 }] })).toThrow(
      /intensity/,
    )
    // @ts-expect-error deliberately invalid shape
    expect(() => validateBeatMap({ ...good(), sections: [{ name: 'p', start: 0, end: 4, shape: 'up' }] })).toThrow(
      /shape/,
    )
  })

  it('rejects unequal band lengths and out-of-range band energies', () => {
    expect(() => validateBeatMap({ ...good(), bands: { hz: 1, low: [0], mid: [0, 1], high: [0, 1] } })).toThrow(
      /equal length/,
    )
    expect(() => validateBeatMap({ ...good(), bands: { hz: 1, low: [0, 2], mid: [0, 1], high: [0, 1] } })).toThrow(
      /\[0, 1\]/,
    )
    expect(() => validateBeatMap({ ...good(), bands: { hz: 0, low: [0], mid: [0], high: [0] } })).toThrow(/bands.hz/)
  })
})

describe('validateBeatMap', () => {
  const good = (): BeatMap => ({
    duration: 4,
    bpm: 120,
    beats: [0, 1, 2, 3],
    downbeats: [0, 2],
    onsets: [0.5, 2.5],
    sections: [{ name: 'part 1', start: 0, end: 4 }],
  })

  it('accepts a well-formed map and returns it', () => {
    const m = good()
    expect(validateBeatMap(m)).toBe(m)
  })

  it('rejects a non-positive duration', () => {
    expect(() => validateBeatMap({ ...good(), duration: 0 })).toThrow(/duration/)
  })

  it('rejects a negative bpm', () => {
    expect(() => validateBeatMap({ ...good(), bpm: -1 })).toThrow(/bpm/)
  })

  it('rejects unsorted event arrays', () => {
    expect(() => validateBeatMap({ ...good(), beats: [0, 2, 1, 3] })).toThrow(/sorted/)
  })

  it('rejects events outside [0, duration]', () => {
    expect(() => validateBeatMap({ ...good(), onsets: [0.5, 9] })).toThrow(/outside/)
  })

  it('rejects a zero/negative-length or unnamed section', () => {
    expect(() => validateBeatMap({ ...good(), sections: [{ name: 'x', start: 2, end: 2 }] })).toThrow(/end must be/)
    expect(() => validateBeatMap({ ...good(), sections: [{ name: '', start: 0, end: 4 }] })).toThrow(/name/)
  })
})

describe('validateBeatMap — moments', () => {
  const good = (): BeatMap => ({
    duration: 10,
    bpm: 120,
    beats: [0, 5],
    downbeats: [0],
    onsets: [1],
    sections: [{ name: 'p', start: 0, end: 10 }],
    moments: [
      { time: 1, type: 'lift', strength: 0.4, end: 4 },
      { time: 6, type: 'dropout', strength: 1 },
    ],
  })

  it('accepts well-formed moments (incl. a ranged lift)', () => {
    const m = good()
    expect(validateBeatMap(m)).toBe(m)
  })

  it('rejects a bad type, out-of-range/unsorted time, and bad strength', () => {
    // @ts-expect-error invalid type
    expect(() => validateBeatMap({ ...good(), moments: [{ time: 1, type: 'boom', strength: 0.5 }] })).toThrow(/type/)
    expect(() => validateBeatMap({ ...good(), moments: [{ time: 99, type: 'break', strength: 0.5 }] })).toThrow(/outside|\[0,/)
    expect(() =>
      validateBeatMap({ ...good(), moments: [{ time: 5, type: 'break', strength: 0.5 }, { time: 1, type: 'break', strength: 0.5 }] }),
    ).toThrow(/sorted/)
    expect(() => validateBeatMap({ ...good(), moments: [{ time: 1, type: 'break', strength: 2 }] })).toThrow(/strength/)
  })

  it('rejects a bad ranged end (≤time, past duration, or on a non-lift)', () => {
    expect(() => validateBeatMap({ ...good(), moments: [{ time: 4, type: 'lift', strength: 0.5, end: 4 }] })).toThrow(/end/)
    expect(() => validateBeatMap({ ...good(), moments: [{ time: 4, type: 'lift', strength: 0.5, end: 99 }] })).toThrow(/end/)
    expect(() => validateBeatMap({ ...good(), moments: [{ time: 4, type: 'break', strength: 0.5, end: 6 }] })).toThrow(
      /only valid on a 'lift'/,
    )
  })
})

describe('committed test-beat.beats.json (analyser regression guard)', () => {
  const map = JSON.parse(
    readFileSync(new URL('../../public/audio/test-beat.beats.json', import.meta.url), 'utf8'),
  ) as BeatMap

  it('is a valid beat map', () => {
    expect(validateBeatMap(map)).toBeTruthy()
  })

  it('detected ~120 BPM with a full grid of beats', () => {
    expect(map.bpm).toBeGreaterThan(110)
    expect(map.bpm).toBeLessThan(130)
    expect(map.beats.length).toBeGreaterThanOrEqual(12)
  })

  it('downbeats are a subset of beats and land one bar (4 beats) apart', () => {
    for (const d of map.downbeats) expect(map.beats).toContain(d)
    expect(map.downbeats.length).toBeGreaterThanOrEqual(3)
  })

  it('sections cover [0, duration] with no gaps', () => {
    expect(map.sections[0].start).toBe(0)
    expect(map.sections.at(-1)!.end).toBe(map.duration)
    for (let i = 1; i < map.sections.length; i++) {
      expect(map.sections[i].start).toBe(map.sections[i - 1].end)
    }
  })

  it('the printed frame summary agrees with the map at 30fps', () => {
    // formatFrameSummary uses secondsToFrame on the same arrays, so the frames it
    // would print must equal beatFrames/downbeatFrames — the Verification item.
    expect(beatFrames(map, 30)).toEqual(map.beats.map((t) => Math.round(t * 30)))
    expect(downbeatFrames(map, 30)).toEqual(map.downbeats.map((t) => Math.round(t * 30)))
  })
})
