/**
 * Unit tests for the runtime-derived beat-map helpers — the pure math behind the
 * `<AudioTrack>` hooks (useBeatPulse / useNearestBeat / useMusicSection /
 * useSnapToBeat / useBandEnergy). The hooks are thin wrappers that feed these the
 * current frame + fps, so pinning the behaviour here is what proves the runtime
 * layer is deterministic and fps-agnostic without booting Remotion.
 *
 * Tests assert the *documented contract* (envelope shape, current-beat semantics,
 * half-open sections, tie-breaks, fps-invariance, clamping) rather than echoing
 * the arithmetic, so a buggy implementation can't quietly make them pass.
 */

import { describe, expect, it } from 'vitest'
import {
  accentFrames,
  bandEnergyFromSpectrum,
  beatFrames,
  beatPulseAt,
  downbeatFrames,
  eventFramesFor,
  musicSectionAt,
  nearestBeat,
  pulseEnvelope,
  secondsToFrame,
  snapToBeat,
  type BeatMap,
} from '@/lib/beatmap'
import intro from '@/lib/__fixtures__/intro.beats.json'

const map = intro as BeatMap

describe('eventFramesFor', () => {
  it('routes each event class to its frame list', () => {
    expect(eventFramesFor(map, 'beat', 30)).toEqual(beatFrames(map, 30))
    expect(eventFramesFor(map, 'downbeat', 30)).toEqual(downbeatFrames(map, 30))
    expect(eventFramesFor(map, 'onset', 30)).toEqual(accentFrames(map, 30))
  })
})

describe('pulseEnvelope', () => {
  it('is exactly 1 on the event frame, regardless of attack/decay', () => {
    expect(pulseEnvelope(0, 0, 10)).toBe(1)
    expect(pulseEnvelope(0, 5, 10)).toBe(1)
    expect(pulseEnvelope(0, 0, 0)).toBe(1)
  })

  it('decays linearly to 0 over `decay` frames after the event', () => {
    expect(pulseEnvelope(5, 0, 10)).toBeCloseTo(0.5, 10)
    expect(pulseEnvelope(10, 0, 10)).toBe(0)
    expect(pulseEnvelope(11, 0, 10)).toBe(0)
  })

  it('rises linearly over `attack` frames before the event (anticipation)', () => {
    expect(pulseEnvelope(-5, 10, 10)).toBeCloseTo(0.5, 10)
    expect(pulseEnvelope(-10, 10, 10)).toBe(0)
  })

  it('contributes nothing before the event when attack is 0 (instant spike)', () => {
    expect(pulseEnvelope(-1, 0, 10)).toBe(0)
    expect(pulseEnvelope(-3, 0, 10)).toBe(0)
  })

  it('is monotonic on the decay ramp and always within [0,1]', () => {
    let prev = pulseEnvelope(0, 0, 12)
    for (let d = 1; d <= 12; d++) {
      const v = pulseEnvelope(d, 0, 12)
      expect(v).toBeLessThanOrEqual(prev)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
      prev = v
    }
  })
})

describe('beatPulseAt', () => {
  const beats = beatFrames(map, 30) // [0,15,30,...,225]

  it('peaks at 1 exactly on a beat frame', () => {
    expect(beatPulseAt(beats, 60, { decay: 10 })).toBe(1)
    expect(beatPulseAt(beats, 0, { decay: 10 })).toBe(1)
  })

  it('decays between beats (instant attack)', () => {
    // beat at 60, next at 75; 7 frames past 60 with a 10-frame decay.
    expect(beatPulseAt(beats, 67, { decay: 10 })).toBeCloseTo(0.3, 10)
  })

  it('honours an attack window before the upcoming beat', () => {
    // 2 frames before beat 75 with attack 5 → (5-2)/5 = 0.6; the past beat (60,
    // 13 frames back) has fully decayed, so the upcoming beat wins.
    expect(beatPulseAt(beats, 73, { attack: 5, decay: 10 })).toBeCloseTo(0.6, 10)
  })

  it('takes the strongest overlapping contribution and never exceeds 1', () => {
    for (let frame = -5; frame <= 240; frame++) {
      const v = beatPulseAt(beats, frame, { attack: 8, decay: 40 })
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('is 0 when there are no events', () => {
    expect(beatPulseAt([], 50, { decay: 10 })).toBe(0)
  })

  it('peaks on the musical event at every fps (fps-agnostic)', () => {
    for (const fps of [24, 30, 60]) {
      const f = secondsToFrame(2.0, fps) // a downbeat
      expect(beatPulseAt(downbeatFrames(map, fps), f, { decay: fps })).toBe(1)
    }
  })
})

describe('nearestBeat', () => {
  it('reports the current beat, with framesSince 0 and downbeat flag, when sitting on one', () => {
    // frame 60 = beat index 4 = the 2.0s downbeat.
    expect(nearestBeat(map, 60, 30)).toEqual({
      index: 4,
      isDownbeat: true,
      framesSince: 0,
      progress: 0,
    })
  })

  it('measures progress from the current beat toward the next', () => {
    const nb = nearestBeat(map, 67, 30) // current beat 60, next 75 (interval 15)
    expect(nb.index).toBe(4)
    expect(nb.framesSince).toBe(7)
    expect(nb.progress).toBeCloseTo(7 / 15, 10)
  })

  it('returns index -1 (no current beat) before the first beat', () => {
    const shifted: BeatMap = { ...map, beats: [0.5, 1.0, 1.5], downbeats: [0.5], onsets: [] }
    expect(nearestBeat(shifted, 5, 30)).toEqual({
      index: -1,
      isDownbeat: false,
      framesSince: 0,
      progress: 0,
    })
  })

  it('clamps progress to 1 past the last beat (falling back to the prior interval)', () => {
    // last beat 225 (7.5s), previous gap 15 frames.
    const atEnd = nearestBeat(map, 240, 30)
    expect(atEnd.index).toBe(map.beats.length - 1)
    expect(atEnd.isDownbeat).toBe(false)
    expect(atEnd.framesSince).toBe(15)
    expect(atEnd.progress).toBe(1)
    expect(nearestBeat(map, 300, 30).progress).toBe(1)
  })

  it('locates the same musical beat at every fps', () => {
    for (const fps of [24, 30, 60]) {
      const f = secondsToFrame(2.0, fps)
      const nb = nearestBeat(map, f, fps)
      expect(nb.index).toBe(4)
      expect(nb.isDownbeat).toBe(true)
      expect(nb.framesSince).toBe(0)
    }
  })
})

describe('musicSectionAt', () => {
  it('returns the section, its index and progress through it', () => {
    expect(musicSectionAt(map, 0, 30)).toEqual({
      section: map.sections[0],
      index: 0,
      progress: 0,
    })
    const mid = musicSectionAt(map, 60, 30) // t=2.0, halfway through intro [0,4)
    expect(mid?.index).toBe(0)
    expect(mid?.progress).toBeCloseTo(0.5, 10)
  })

  it('uses half-open boundaries — the boundary frame belongs to the next section', () => {
    const s = musicSectionAt(map, 120, 30) // t=4.0 → build
    expect(s?.section.name).toBe('build')
    expect(s?.index).toBe(1)
    expect(s?.progress).toBe(0)
  })

  it('gives the final closing frame to the last section with progress 1', () => {
    const s = musicSectionAt(map, 240, 30) // t=8.0
    expect(s?.section.name).toBe('build')
    expect(s?.progress).toBe(1)
  })

  it('returns null when the frame is section-less', () => {
    expect(musicSectionAt(map, 241, 30)).toBeNull()
    expect(musicSectionAt({ ...map, sections: [] }, 30, 30)).toBeNull()
  })

  it('reports progress 0 for a zero-length section', () => {
    const z: BeatMap = { ...map, sections: [{ name: 'x', start: 2, end: 2 }] }
    const s = musicSectionAt(z, 60, 30) // t=2.0 → the closing-frame fallback owns it
    expect(s?.section.name).toBe('x')
    expect(s?.progress).toBe(0)
  })
})

describe('snapToBeat', () => {
  it('snaps a frame to the nearest beat', () => {
    expect(snapToBeat(map, 67, 30)).toBe(60) // 7 from 60, 8 from 75
    expect(snapToBeat(map, 68, 30)).toBe(75) // 8 from 60, 7 from 75
  })

  it('is idempotent on a frame already on the grid', () => {
    expect(snapToBeat(map, 60, 30)).toBe(60)
  })

  it('breaks ties toward the earlier beat', () => {
    const tie: BeatMap = { ...map, beats: [1 / 3, 2 / 3] } // → frames 10 and 20 @30
    expect(snapToBeat(tie, 15, 30)).toBe(10)
  })

  it('returns the frame unchanged when the map has no beats', () => {
    expect(snapToBeat({ ...map, beats: [] }, 42, 30)).toBe(42)
  })

  it('snaps to the same musical beat across fps', () => {
    for (const fps of [24, 30, 60]) {
      const near = secondsToFrame(2.0, fps) + 1
      expect(snapToBeat(map, near, fps)).toBe(secondsToFrame(2.0, fps))
    }
  })
})

describe('bandEnergyFromSpectrum', () => {
  it('averages the matching third of the spectrum', () => {
    const s = [0, 0, 0, 1, 1, 1, 0, 0, 0]
    expect(bandEnergyFromSpectrum(s, 'low')).toBe(0)
    expect(bandEnergyFromSpectrum(s, 'mid')).toBe(1)
    expect(bandEnergyFromSpectrum(s, 'high')).toBe(0)
  })

  it('computes a real mean per band', () => {
    const s = [0.9, 0.9, 0.9, 0.3, 0.3, 0.3, 0.6, 0.6, 0.6]
    expect(bandEnergyFromSpectrum(s, 'low')).toBeCloseTo(0.9, 10)
    expect(bandEnergyFromSpectrum(s, 'mid')).toBeCloseTo(0.3, 10)
    expect(bandEnergyFromSpectrum(s, 'high')).toBeCloseTo(0.6, 10)
  })

  it('partitions a length not divisible by 3 without overlap or gaps', () => {
    const s = [1, 1, 0, 0] // low=[0,1], mid=[2], high=[3]
    expect(bandEnergyFromSpectrum(s, 'low')).toBe(1)
    expect(bandEnergyFromSpectrum(s, 'mid')).toBe(0)
    expect(bandEnergyFromSpectrum(s, 'high')).toBe(0)
  })

  it('returns 0 for an empty spectrum', () => {
    expect(bandEnergyFromSpectrum([], 'low')).toBe(0)
    expect(bandEnergyFromSpectrum([], 'mid')).toBe(0)
    expect(bandEnergyFromSpectrum([], 'high')).toBe(0)
  })

  it('clamps the result into [0,1]', () => {
    expect(bandEnergyFromSpectrum([2, 2, 2], 'low')).toBe(1)
    expect(bandEnergyFromSpectrum([-1, -1, -1], 'low')).toBe(0)
  })

  it('falls back to the single bin when the spectrum is shorter than 3', () => {
    expect(bandEnergyFromSpectrum([0.5], 'low')).toBeCloseTo(0.5, 10)
    expect(bandEnergyFromSpectrum([0.5], 'mid')).toBeCloseTo(0.5, 10)
    expect(bandEnergyFromSpectrum([0.5], 'high')).toBeCloseTo(0.5, 10)
  })
})

describe('purity (Remotion determinism)', () => {
  it('runtime helpers do not mutate the beat map', () => {
    const before = JSON.stringify(map)
    beatPulseAt(beatFrames(map, 30), 50, { attack: 4, decay: 12 })
    nearestBeat(map, 50, 30)
    musicSectionAt(map, 50, 30)
    snapToBeat(map, 50, 30)
    expect(JSON.stringify(map)).toBe(before)
  })

  it('same inputs give identical outputs', () => {
    expect(nearestBeat(map, 67, 30)).toEqual(nearestBeat(map, 67, 30))
    expect(beatPulseAt(beatFrames(map, 30), 67, { decay: 10 })).toBe(
      beatPulseAt(beatFrames(map, 30), 67, { decay: 10 }),
    )
  })
})
