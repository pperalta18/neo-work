/**
 * Unit tests for the audio-mux verifier (`audioStreamReport` — the pure half of
 * `scripts/verify-tour-audio.mjs`).
 *
 * ffprobe + the filesystem are the verifier's only impure edges and live in the
 * `.mjs` shell, so the verdict logic is exercised here against hand-built probe
 * objects — no rendering, no shelling out, the same "keep the math pure so it's
 * node-testable" split the rest of the beat-map layer follows.
 *
 * Tests assert the documented contract (an MP4 passes only with a positive-length
 * audio stream; video-only / silent / truncated / malformed inputs all fail with
 * a distinguishing reason) rather than echoing the implementation, so a broken
 * verifier can't quietly pass.
 */

import { describe, expect, it } from 'vitest'
import { audioStreamReport, type ProbeResult } from '@/lib/verifyAudioMux'

/** A realistic Remotion-render probe: H.264 video + AAC stereo audio, 8 s. */
const tourProbe: ProbeResult = {
  streams: [
    { codec_type: 'video', codec_name: 'h264', duration: '8.000000' },
    {
      codec_type: 'audio',
      codec_name: 'aac',
      channels: 2,
      sample_rate: '48000',
      duration: '8.000000',
    },
  ],
  format: { duration: '8.000000' },
}

describe('audioStreamReport — a properly muxed tour MP4', () => {
  it('passes when an audio stream of positive length is present', () => {
    const report = audioStreamReport(tourProbe)
    expect(report.ok).toBe(true)
    expect(report.audio).not.toBeNull()
    expect(report.audio?.codec).toBe('aac')
    expect(report.audio?.channels).toBe(2)
    expect(report.audio?.sampleRate).toBe(48000)
    expect(report.audio?.durationSeconds).toBeCloseTo(8, 5)
    expect(report.hasVideo).toBe(true)
    expect(report.streamCounts).toEqual({ audio: 1, video: 1, total: 2 })
  })

  it('mentions codec, channels and duration in the reason', () => {
    const { reason } = audioStreamReport(tourProbe)
    expect(reason).toContain('aac')
    expect(reason).toContain('2ch')
    expect(reason).toContain('8.00')
  })
})

describe('audioStreamReport — the failure modes the render must not regress into', () => {
  it('fails a video-only MP4 (the song was not muxed at all)', () => {
    const probe: ProbeResult = {
      streams: [{ codec_type: 'video', codec_name: 'h264', duration: '8.0' }],
      format: { duration: '8.0' },
    }
    const report = audioStreamReport(probe)
    expect(report.ok).toBe(false)
    expect(report.audio).toBeNull()
    expect(report.hasVideo).toBe(true)
    expect(report.streamCounts.audio).toBe(0)
    expect(report.reason).toMatch(/no audio stream/i)
  })

  it('fails an audio stream whose duration is zero or unknown', () => {
    const zero: ProbeResult = {
      streams: [{ codec_type: 'audio', codec_name: 'aac', duration: '0' }],
      format: { duration: '0' },
    }
    const unknown: ProbeResult = {
      streams: [{ codec_type: 'audio', codec_name: 'aac' }],
      format: {},
    }
    for (const probe of [zero, unknown]) {
      const report = audioStreamReport(probe)
      expect(report.ok).toBe(false)
      expect(report.reason).toMatch(/duration is zero or unknown/i)
      // The stream is still reported, just judged unusable.
      expect(report.audio).not.toBeNull()
    }
  })

  it('fails when the probe is malformed (no streams array)', () => {
    const report = audioStreamReport({} as ProbeResult)
    expect(report.ok).toBe(false)
    expect(report.reason).toMatch(/no streams array/i)
    expect(report.streamCounts.total).toBe(0)
  })
})

describe('audioStreamReport — duration fallbacks', () => {
  it('falls back to the container duration when the stream omits one', () => {
    const probe: ProbeResult = {
      streams: [
        { codec_type: 'video', codec_name: 'h264' },
        { codec_type: 'audio', codec_name: 'aac', channels: 2 },
      ],
      format: { duration: '12.5' },
    }
    const report = audioStreamReport(probe)
    expect(report.ok).toBe(true)
    expect(report.audio?.durationSeconds).toBeCloseTo(12.5, 5)
  })

  it('prefers the stream duration over the container duration when both exist', () => {
    const probe: ProbeResult = {
      streams: [{ codec_type: 'audio', codec_name: 'aac', duration: '7.9', channels: 1 }],
      format: { duration: '60' },
    }
    const report = audioStreamReport(probe)
    expect(report.audio?.durationSeconds).toBeCloseTo(7.9, 5)
  })
})

describe('audioStreamReport — expected-duration check (truncation guard)', () => {
  it('passes when the audio length is within tolerance of the expectation', () => {
    const report = audioStreamReport(tourProbe, { expectedDurationSeconds: 8 })
    expect(report.ok).toBe(true)
  })

  it('passes a small drift within the default 0.5s tolerance', () => {
    const probe: ProbeResult = {
      streams: [{ codec_type: 'audio', codec_name: 'aac', duration: '8.3', channels: 2 }],
      format: { duration: '8.3' },
    }
    const report = audioStreamReport(probe, { expectedDurationSeconds: 8 })
    expect(report.ok).toBe(true)
  })

  it('fails a truncated track that drifts beyond tolerance', () => {
    const probe: ProbeResult = {
      streams: [{ codec_type: 'audio', codec_name: 'aac', duration: '4.0', channels: 2 }],
      format: { duration: '4.0' },
    }
    const report = audioStreamReport(probe, { expectedDurationSeconds: 8 })
    expect(report.ok).toBe(false)
    expect(report.reason).toMatch(/differs from the expected/i)
  })

  it('honours a custom tolerance', () => {
    const probe: ProbeResult = {
      streams: [{ codec_type: 'audio', codec_name: 'aac', duration: '8.4', channels: 2 }],
      format: { duration: '8.4' },
    }
    expect(audioStreamReport(probe, { expectedDurationSeconds: 8, durationToleranceSeconds: 0.2 }).ok).toBe(false)
    expect(audioStreamReport(probe, { expectedDurationSeconds: 8, durationToleranceSeconds: 1 }).ok).toBe(true)
  })
})

describe('audioStreamReport — multiple streams', () => {
  it('counts every stream and judges on the first audio track', () => {
    const probe: ProbeResult = {
      streams: [
        { codec_type: 'video', codec_name: 'h264', duration: '8.0' },
        { codec_type: 'audio', codec_name: 'aac', channels: 2, duration: '8.0' },
        { codec_type: 'audio', codec_name: 'mp3', channels: 1, duration: '8.0' },
        { codec_type: 'subtitle', codec_name: 'mov_text' },
      ],
      format: { duration: '8.0' },
    }
    const report = audioStreamReport(probe)
    expect(report.ok).toBe(true)
    expect(report.audio?.codec).toBe('aac')
    expect(report.streamCounts).toEqual({ audio: 2, video: 1, total: 4 })
  })
})

describe('audioStreamReport — purity', () => {
  it('returns an equal verdict for equal inputs and does not mutate the probe', () => {
    const snapshot = JSON.stringify(tourProbe)
    const a = audioStreamReport(tourProbe, { expectedDurationSeconds: 8 })
    const b = audioStreamReport(tourProbe, { expectedDurationSeconds: 8 })
    expect(a).toEqual(b)
    expect(JSON.stringify(tourProbe)).toBe(snapshot)
  })
})
