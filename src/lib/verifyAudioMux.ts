/**
 * Audio-mux verification (CPU side, no ffprobe, no I/O)
 * ─────────────────────────────────────────────────────
 * The pure half of `scripts/verify-tour-audio.mjs`: it answers one question —
 * "does this rendered MP4 actually contain the muxed song?" — from already-parsed
 * `ffprobe` JSON. A beat-driven composition (`ProductTour`) is only correct if the
 * `<AudioTrack>`'s `<Audio>` survives the render into a real audio stream of the
 * right length; a silent or audio-less MP4 is a regression even when every frame
 * looks fine.
 *
 * Keeping the inspection here — plain objects in, a verdict out — makes it
 * node-unit-testable without shelling out to ffprobe or rendering anything, the
 * same "keep the impure edge in the `.mjs`, test the math in `src/lib`" split the
 * beat-map analyser (`beatAnalysis.ts`) and scene layout (`beatScenes.ts`) use.
 *
 * See ([spec: Music Sync (Beats)](../../specs/music-sync.md)),
 *     ([spec: Product Video](../../specs/product-video.md)).
 */

/** A single stream entry as emitted by `ffprobe -show_streams -of json`. */
export type ProbeStream = {
  codec_type?: string
  codec_name?: string
  channels?: number
  sample_rate?: string | number
  /** Per-stream duration in seconds (string in ffprobe JSON); may be absent. */
  duration?: string | number
}

/** The shape of `ffprobe -show_streams -show_format -of json` output we read. */
export type ProbeResult = {
  streams?: ProbeStream[]
  format?: { duration?: string | number }
}

/** What we learned about the muxed audio stream, if any. */
export type AudioStreamInfo = {
  codec: string | null
  channels: number | null
  sampleRate: number | null
  /** Effective duration in seconds (stream duration, else container duration). */
  durationSeconds: number | null
}

export type AudioMuxReport = {
  /** True only when a usable audio stream of positive (and expected) length exists. */
  ok: boolean
  /** Human-readable explanation of the verdict (printed by the CLI). */
  reason: string
  /** The first audio stream's details, or `null` when none is present. */
  audio: AudioStreamInfo | null
  /** Whether the container also carries video (a tour MP4 should). */
  hasVideo: boolean
  /** Stream tallies for diagnostics. */
  streamCounts: { audio: number; video: number; total: number }
}

export type AudioMuxOptions = {
  /**
   * If given, the audio stream's duration must be within `durationToleranceSeconds`
   * of this (e.g. the composition length) — catches a track that muxed but was
   * truncated. Omit to only require a positive-length audio stream.
   */
  expectedDurationSeconds?: number
  /** Allowed |actual − expected| slack in seconds. Default `0.5`. */
  durationToleranceSeconds?: number
}

/** Parse ffprobe's stringly-typed numbers into a finite number, or `null`. */
function toFiniteNumber(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Inspect parsed `ffprobe` JSON and decide whether the MP4 contains the muxed
 * audio track. Pure: same input → same verdict, no I/O.
 */
export function audioStreamReport(
  probe: ProbeResult,
  options: AudioMuxOptions = {},
): AudioMuxReport {
  const { expectedDurationSeconds, durationToleranceSeconds = 0.5 } = options

  const streams = Array.isArray(probe?.streams) ? probe.streams : null
  if (!streams) {
    return {
      ok: false,
      reason: 'malformed probe: no streams array',
      audio: null,
      hasVideo: false,
      streamCounts: { audio: 0, video: 0, total: 0 },
    }
  }

  const audioStreams = streams.filter((s) => s.codec_type === 'audio')
  const videoStreams = streams.filter((s) => s.codec_type === 'video')
  const streamCounts = {
    audio: audioStreams.length,
    video: videoStreams.length,
    total: streams.length,
  }
  const hasVideo = videoStreams.length > 0

  if (audioStreams.length === 0) {
    return {
      ok: false,
      reason: 'no audio stream — the song was not muxed into the MP4',
      audio: null,
      hasVideo,
      streamCounts,
    }
  }

  const first = audioStreams[0]
  const containerDuration = toFiniteNumber(probe.format?.duration)
  const streamDuration = toFiniteNumber(first.duration)
  // Prefer the stream's own duration; fall back to the container's.
  const durationSeconds =
    streamDuration && streamDuration > 0 ? streamDuration : containerDuration

  const audio: AudioStreamInfo = {
    codec: first.codec_name ?? null,
    channels: toFiniteNumber(first.channels),
    sampleRate: toFiniteNumber(first.sample_rate),
    durationSeconds: durationSeconds ?? null,
  }

  if (!(durationSeconds !== null && durationSeconds > 0)) {
    return {
      ok: false,
      reason: 'audio stream present but its duration is zero or unknown',
      audio,
      hasVideo,
      streamCounts,
    }
  }

  if (expectedDurationSeconds !== undefined) {
    const drift = Math.abs(durationSeconds - expectedDurationSeconds)
    if (drift > durationToleranceSeconds) {
      return {
        ok: false,
        reason:
          `audio duration ${durationSeconds.toFixed(2)}s differs from the expected ` +
          `${expectedDurationSeconds.toFixed(2)}s by ${drift.toFixed(2)}s ` +
          `(tolerance ${durationToleranceSeconds}s) — likely truncated`,
        audio,
        hasVideo,
        streamCounts,
      }
    }
  }

  const codec = audio.codec ?? 'unknown codec'
  const channels = audio.channels !== null ? `${audio.channels}ch` : 'unknown channels'
  return {
    ok: true,
    reason: `audio track present: ${codec}, ${channels}, ${durationSeconds.toFixed(2)}s`,
    audio,
    hasVideo,
    streamCounts,
  }
}
