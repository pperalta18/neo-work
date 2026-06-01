/**
 * Beat-map contract & authoring helpers (CPU side, no React, no audio)
 * ────────────────────────────────────────────────────────────────────
 * A {@link BeatMap} is the deterministic, hand-editable artifact a Remotion
 * composition is choreographed against. A song is analysed **once, offline**
 * (essentia.js, in `scripts/analyze-beats.mjs`) into this JSON; the render path
 * only ever reads it, which is what keeps renders deterministic ("state in,
 * frame out").
 *
 * Everything here is pure and fps-agnostic. Beat-map times are stored in
 * **seconds**; a frame is `round(t * fps)`, so the same map drives the same song
 * at 24 / 30 / 60 fps. The author queries the map at authoring time with the
 * helpers below to learn *which frame* each beat / downbeat / golpe lands on,
 * then places motion there. The same helpers back the `npm run beats` summary
 * and the `<AudioTrack>` runtime hooks.
 *
 * See ([spec: Music Sync (Beats)](../../specs/music-sync.md)).
 */

/**
 * The dynamic contour of a section — does its energy climb, fall, or hold? An
 * energy-derived hint so an author/agent can pick motion that matches the
 * gesture of the part (a `rising` build vs a `falling` outro).
 */
export type SectionShape = 'rising' | 'falling' | 'steady'

/** A named structural segment of the song, `[start, end)` in seconds. */
export type Section = {
  name: string
  /** Inclusive start, seconds. */
  start: number
  /** Exclusive end, seconds (the final section's end is the song duration). */
  end: number
  /**
   * Mean loudness of the section, `0..1` normalised to the track's peak. The
   * authoritative macro-dynamics value: how intense this part is relative to
   * the whole song. Present when the map was segmented by energy; absent for a
   * purely metric (bars) segmentation.
   */
  intensity?: number
  /** Whether the section's energy is {@link SectionShape rising / falling / steady}. */
  shape?: SectionShape
}

/**
 * The *kind* of structural change at a {@link Moment} — what a motion designer
 * would treat differently:
 * - `drop`     — energy slams **up** (a reveal / hard cut / scale-pop lands here);
 * - `lift`     — energy steps up, but gentler than a drop;
 * - `break`    — energy falls **away** (pull back, breathe, negative space);
 * - `dropout`  — energy cuts to near-silence (a freeze / full stop / the gap).
 */
export type MomentType = 'drop' | 'lift' | 'break' | 'dropout'

/**
 * A *hit point*: the single frame a designer triggers a treatment on. Unlike a
 * {@link Section} (a span), a moment is an instant — *the* place the song turns.
 * `strength` is `0..1`, **relative to this song** (the biggest turn in the track
 * is ~1), so you know how hard to hit it. Derived from the energy contour, not
 * the bare beat grid.
 */
export type Moment = {
  /** When it lands, seconds. For a ranged `lift` this is where the build starts. */
  time: number
  type: MomentType
  /** How hard it hits, `0..1`, normalised to the strongest moment in the song. */
  strength: number
  /**
   * End of a **ranged** moment, seconds — present only on a `lift` (a build is a
   * span you animate *over*, resolving on the drop at `end`). Instant moments
   * (drop / break / dropout) omit it.
   */
  end?: number
}

/**
 * Optional per-band energy envelopes, sampled at a fixed rate. `low`/`mid`/`high`
 * are equal-length arrays of `0..1` energies, one sample every `1 / hz` seconds.
 * Used by continuous-reactivity helpers; never required for beat placement.
 */
export type BeatBands = {
  /** Envelope sample rate, samples per second. */
  hz: number
  low: number[]
  mid: number[]
  high: number[]
}

/**
 * The committed analysis of one track. All times are in **seconds**. `beats`,
 * `downbeats` and `onsets` are sorted ascending. `downbeats` are the bar starts
 * (the big accents); `onsets` are transient hits — the *golpes de efecto*.
 */
export type BeatMap = {
  /** Total song length, seconds. */
  duration: number
  /** Detected (or hand-corrected) tempo, beats per minute. */
  bpm: number
  /** Every beat onset, seconds. */
  beats: number[]
  /** Bar starts (subset of `beats`), seconds. */
  downbeats: number[]
  /** Transient accents / golpes de efecto, seconds. */
  onsets: number[]
  /** Named structural segments, in order. */
  sections: Section[]
  /** Optional per-band energy envelopes. */
  bands?: BeatBands
  /** Optional typed structural hit points (drops / breaks / dropouts), sorted by time. */
  moments?: Moment[]
}

/** Convert a time in seconds to the nearest frame index at `fps`. */
export function secondsToFrame(t: number, fps: number): number {
  return Math.round(t * fps)
}

/** Convert a frame index at `fps` back to seconds (the inverse of the grid). */
export function frameToSeconds(frame: number, fps: number): number {
  return frame / fps
}

/** Frame index of every beat at `fps`. */
export function beatFrames(map: BeatMap, fps: number): number[] {
  return map.beats.map((t) => secondsToFrame(t, fps))
}

/** Frame index of every bar start (downbeat) at `fps`. */
export function downbeatFrames(map: BeatMap, fps: number): number[] {
  return map.downbeats.map((t) => secondsToFrame(t, fps))
}

/** Frame index of every onset accent (golpe de efecto) at `fps`. */
export function accentFrames(map: BeatMap, fps: number): number[] {
  return map.onsets.map((t) => secondsToFrame(t, fps))
}

/**
 * The frame of the first downbeat at or after `frame`, or `null` if `frame` is
 * past the last downbeat. "At or after" means a `frame` that already sits on a
 * downbeat returns itself — handy for "when does the next bar boundary land,
 * starting now". Assumes `downbeats` is sorted ascending.
 */
export function nextDownbeat(map: BeatMap, frame: number, fps: number): number | null {
  for (const t of map.downbeats) {
    const f = secondsToFrame(t, fps)
    if (f >= frame) return f
  }
  return null
}

/**
 * The section containing `frame`, or `null` if `frame` falls in a gap / before
 * the first section. Sections are half-open `[start, end)`, except the closing
 * frame of the final section belongs to it (so the very last frame is never
 * section-less). The first match wins.
 */
export function sectionAt(map: BeatMap, frame: number, fps: number): Section | null {
  const t = frameToSeconds(frame, fps)
  for (const s of map.sections) {
    if (t >= s.start && t < s.end) return s
  }
  const last = map.sections[map.sections.length - 1]
  if (last && t >= last.start && t <= last.end) return last
  return null
}

/**
 * A human/agent-readable, deterministic summary of where every beat lands at a
 * chosen `fps`. This is the authoring surface printed by `npm run beats` — the
 * author reads it to place motion on exact frames. Pure: same map + same fps →
 * byte-identical string.
 */
export function formatFrameSummary(map: BeatMap, fps: number): string {
  const durFrames = secondsToFrame(map.duration, fps)
  const list = (xs: number[]) => (xs.length ? xs.join(', ') : '—')

  const lines: string[] = [
    `Beat map @ ${fps}fps — ${map.bpm} BPM, ${map.duration.toFixed(2)}s (${durFrames} frames)`,
    `beats     (${map.beats.length}): ${list(beatFrames(map, fps))}`,
    `downbeats (${map.downbeats.length}): ${list(downbeatFrames(map, fps))}`,
    `golpes    (${map.onsets.length}): ${list(accentFrames(map, fps))}`,
  ]

  if (map.bands) {
    lines.push(
      `energy    : low/mid/high envelopes @ ${map.bands.hz}Hz (${map.bands.low.length} samples each)`,
    )
  }

  if (map.sections.length === 0) {
    lines.push(`sections  (0): —`)
  } else if (map.sections.some((s) => s.intensity != null)) {
    // Energy-cut sections carry dynamics — render the rich structure block.
    lines.push(...formatStructure(map, fps))
  } else {
    lines.push(`sections  (${map.sections.length}):`)
    for (const s of map.sections) {
      const sf = secondsToFrame(s.start, fps)
      const ef = secondsToFrame(s.end, fps)
      lines.push(`  ${s.name}: frames ${sf}–${ef} (${s.start.toFixed(2)}–${s.end.toFixed(2)}s)`)
    }
  }

  if (map.moments && map.moments.length) lines.push(...formatMoments(map, fps))

  return lines.join('\n')
}

// ────────────────────────────────────────────────────────────────────────────
// Runtime-derived helpers (frame in → value out)
// ────────────────────────────────────────────────────────────────────────────
// These back the `<AudioTrack>` runtime hooks in `src/remotion/AudioTrack.tsx`.
// They stay pure: a frame (from `useCurrentFrame()`) plus the map and fps go in,
// a value comes out — never wall-clock time, never live audio analysis — so the
// Studio preview and a parallel render produce identical frames. Kept here (not
// in the React layer) so they can be unit-tested without Remotion.

/** Which class of musical event a pulse / query reacts to. */
export type BeatEvent = 'beat' | 'downbeat' | 'onset'

/** The frame list for an event class at `fps` (beats / downbeats / golpes). */
export function eventFramesFor(map: BeatMap, on: BeatEvent, fps: number): number[] {
  if (on === 'downbeat') return downbeatFrames(map, fps)
  if (on === 'onset') return accentFrames(map, fps)
  return beatFrames(map, fps)
}

/**
 * One event's contribution to a beat pulse at `distance = frame - eventFrame`.
 * Rises linearly over `attack` frames *before* the event (anticipation), is `1`
 * exactly on the event frame, then falls linearly to `0` over `decay` frames;
 * `0` everywhere else. `attack = 0` gives an instant spike (the default "punch").
 * Continuous at every boundary and always within `[0, 1]`.
 */
export function pulseEnvelope(distance: number, attack: number, decay: number): number {
  if (distance < 0) {
    if (attack <= 0 || distance <= -attack) return 0
    return (attack + distance) / attack // (-attack, 0) → (0, 1)
  }
  if (distance === 0) return 1
  if (decay <= 0 || distance >= decay) return 0
  return 1 - distance / decay // (0, decay) → (1, 0)
}

/** Options for {@link beatPulseAt}. `attack` defaults to 0 (instant spike). */
export type BeatPulseOptions = { attack?: number; decay: number }

/**
 * The `0..1` pulse at `frame`, taking the strongest contribution across all
 * `eventFrames` (so overlapping decays never sum past 1). `eventFrames` must be
 * sorted ascending. Returns `0` when there are no events.
 */
export function beatPulseAt(
  eventFrames: number[],
  frame: number,
  { attack = 0, decay }: BeatPulseOptions,
): number {
  let peak = 0
  for (const f of eventFrames) {
    // Events past the attack window ahead of `frame` (and everything after them,
    // since the list is sorted) can't contribute — stop early.
    if (frame - f < -attack) break
    const v = pulseEnvelope(frame - f, attack, decay)
    if (v > peak) peak = v
  }
  return peak
}

/** The beat in effect at a frame; the result of {@link nearestBeat}. */
export type NearestBeat = {
  /** Index into `beats[]` of the current beat, or `-1` before the first beat. */
  index: number
  /** Whether the current beat is a bar start (downbeat). */
  isDownbeat: boolean
  /** Frames elapsed since the current beat (`0` on it, `0` before the first). */
  framesSince: number
  /** Progress `0..1` from the current beat toward the next one. */
  progress: number
}

/**
 * The beat in effect at `frame` — the last beat at or before it — plus how far
 * into that beat we are. Before the first beat there is no current beat, so
 * `index` is `-1` and `framesSince`/`progress` are `0`. After the last beat the
 * interval falls back to the previous gap (or the BPM grid) and `progress` is
 * clamped to `1`.
 */
export function nearestBeat(map: BeatMap, frame: number, fps: number): NearestBeat {
  const fs = beatFrames(map, fps)
  let idx = -1
  for (let i = 0; i < fs.length; i++) {
    if (fs[i] <= frame) idx = i
    else break
  }
  if (idx === -1) return { index: -1, isDownbeat: false, framesSince: 0, progress: 0 }

  const cur = fs[idx]
  const framesSince = frame - cur

  let interval: number
  if (idx + 1 < fs.length) interval = fs[idx + 1] - cur
  else if (idx > 0) interval = cur - fs[idx - 1]
  else interval = Math.round((60 / map.bpm) * fps)
  if (interval <= 0) interval = 1

  const isDownbeat = downbeatFrames(map, fps).includes(cur)
  return { index: idx, isDownbeat, framesSince, progress: Math.min(1, framesSince / interval) }
}

/** The current section plus progress through it; the result of {@link musicSectionAt}. */
export type MusicSection = {
  section: Section
  /** Index into `map.sections`. */
  index: number
  /** Progress `0..1` from the section's start to its end. */
  progress: number
}

/**
 * The section containing `frame` (via {@link sectionAt}) plus its index and a
 * `0..1` progress through it. `null` when `frame` is section-less. A zero-length
 * section reports `progress` 0.
 */
export function musicSectionAt(map: BeatMap, frame: number, fps: number): MusicSection | null {
  const section = sectionAt(map, frame, fps)
  if (!section) return null
  const t = frameToSeconds(frame, fps)
  const span = section.end - section.start
  const progress = span > 0 ? Math.min(1, Math.max(0, (t - section.start) / span)) : 0
  return { section, index: map.sections.indexOf(section), progress }
}

/**
 * Snap an arbitrary `frame` (e.g. a desired cut/transition point) to the nearest
 * beat frame at `fps`. Ties favour the earlier beat. Returns `frame` unchanged
 * when the map has no beats.
 */
export function snapToBeat(map: BeatMap, frame: number, fps: number): number {
  const fs = beatFrames(map, fps)
  if (fs.length === 0) return frame
  let best = fs[0]
  let bestDist = Math.abs(frame - best)
  for (let i = 1; i < fs.length; i++) {
    const dist = Math.abs(frame - fs[i])
    if (dist < bestDist) {
      best = fs[i]
      bestDist = dist
    }
  }
  return best
}

/** A frequency band of an audio spectrum. */
export type Band = 'low' | 'mid' | 'high'

/**
 * Mean energy of one third of a frequency `spectrum` (as returned by
 * `@remotion/media-utils` `visualizeAudio`): `low` is the bottom third of the
 * bins, `mid` the middle, `high` the top. Pure number-array math — no audio —
 * so it can be unit-tested directly; it backs `useBandEnergy`. Returns `0` for
 * an empty spectrum and clamps the result to `[0, 1]`.
 */
export function bandEnergyFromSpectrum(spectrum: number[], band: Band): number {
  const n = spectrum.length
  if (n === 0) return 0
  const third = n / 3
  let start = 0
  let end = n
  if (band === 'low') {
    start = 0
    end = Math.ceil(third)
  } else if (band === 'mid') {
    start = Math.ceil(third)
    end = Math.ceil(third * 2)
  } else {
    start = Math.ceil(third * 2)
    end = n
  }
  if (end <= start) {
    start = Math.max(0, Math.min(start, n - 1))
    end = start + 1
  }
  let sum = 0
  for (let i = start; i < end; i++) sum += spectrum[i]
  const mean = sum / (end - start)
  return Math.max(0, Math.min(1, mean))
}

// ────────────────────────────────────────────────────────────────────────────
// Committed energy envelopes (state in → frame out, no audio decode)
// ────────────────────────────────────────────────────────────────────────────
// These read the `bands` baked into the map by the analyser (see
// `src/lib/energyAnalysis.ts`), so dynamics are available the same pure way
// beats are — queryable at authoring time and identical across preview/render —
// without decoding audio at runtime. (The audio-decoding `visualizeAudio` path
// in `<AudioTrack>` still exists for maps that carry no bands.)

/**
 * Linearly interpolate an envelope sampled at `hz` (samples/second) at time `t`
 * seconds. Clamps to the envelope's ends; returns `0` for an empty envelope.
 */
function sampleEnvelope(env: number[], hz: number, t: number): number {
  if (env.length === 0 || hz <= 0) return 0
  const x = t * hz
  if (x <= 0) return env[0]
  if (x >= env.length - 1) return env[env.length - 1]
  const i = Math.floor(x)
  const frac = x - i
  return env[i] * (1 - frac) + env[i + 1] * frac
}

/**
 * The committed `0..1` energy of one band at `frame` (interpolated). Returns `0`
 * when the map carries no bands. Pure — no audio, no wall-clock.
 */
export function bandEnergyAt(map: BeatMap, band: Band, frame: number, fps: number): number {
  if (!map.bands) return 0
  return sampleEnvelope(map.bands[band], map.bands.hz, frameToSeconds(frame, fps))
}

/**
 * A composite `0..1` loudness at `frame` — the mean of the three committed band
 * envelopes (each peak-normalised), a cheap proxy for "how much is going on".
 * Returns `0` without bands. For the authoritative macro level of a part, prefer
 * the section's committed {@link Section.intensity}. Pure.
 */
export function overallEnergyAt(map: BeatMap, frame: number, fps: number): number {
  if (!map.bands) return 0
  const t = frameToSeconds(frame, fps)
  const b = map.bands
  return (sampleEnvelope(b.low, b.hz, t) + sampleEnvelope(b.mid, b.hz, t) + sampleEnvelope(b.high, b.hz, t)) / 3
}

// ────────────────────────────────────────────────────────────────────────────
// Structural moments (motion-design hit points)
// ────────────────────────────────────────────────────────────────────────────
// The typed turning points (drops / lifts / breaks / dropouts) the analyser
// derives from the energy contour — the frames a designer triggers a treatment
// on, each weighted by how hard it hits. Detection lives in energyAnalysis.ts;
// these are the pure read helpers the summary and the runtime hooks share.

/** Frame index of every moment at `fps`. */
export function momentFrames(map: BeatMap, fps: number): number[] {
  return (map.moments ?? []).map((m) => secondsToFrame(m.time, fps))
}

/** Frame index of every moment of one `type` at `fps`. */
export function momentFramesFor(map: BeatMap, type: MomentType, fps: number): number[] {
  return (map.moments ?? []).filter((m) => m.type === type).map((m) => secondsToFrame(m.time, fps))
}

/**
 * The first moment at or after `frame`, or `null` if none remain — handy for a
 * "countdown to the drop" or to pre-arm a treatment. Assumes `moments` is sorted
 * ascending by time.
 */
export function nextMoment(map: BeatMap, frame: number, fps: number): Moment | null {
  for (const m of map.moments ?? []) {
    if (secondsToFrame(m.time, fps) >= frame) return m
  }
  return null
}

/** The single strongest moment in the song (the primary hit), or `null`. */
export function primaryMoment(map: BeatMap): Moment | null {
  let best: Moment | null = null
  for (const m of map.moments ?? []) if (!best || m.strength > best.strength) best = m
  return best
}

/**
 * The ranged moment (a `lift` / build) whose span contains `frame`, plus a
 * `0..1` progress through it — for the *continuous* anticipatory animation a
 * lift wants (a ramp that resolves on the drop at its `end`). `null` when no
 * ranged moment is active. Instant moments (drop/break/dropout) are ignored.
 */
export function rangedMomentAt(map: BeatMap, frame: number, fps: number): { moment: Moment; progress: number } | null {
  const t = frameToSeconds(frame, fps)
  for (const m of map.moments ?? []) {
    if (m.end == null) continue
    if (t >= m.time && t < m.end) {
      const span = m.end - m.time
      return { moment: m, progress: span > 0 ? Math.max(0, Math.min(1, (t - m.time) / span)) : 0 }
    }
  }
  return null
}

/**
 * A `0..1` pulse at `frame` from the song's moments, **scaled by each moment's
 * `strength`** (a weak lift barely registers; the primary drop peaks near 1).
 * Pass a `type` to react to only drops / breaks / etc. Same attack/decay
 * envelope as {@link beatPulseAt}. Pure. `moments` must be sorted by time.
 */
export function momentPulseAt(
  map: BeatMap,
  type: MomentType | undefined,
  frame: number,
  fps: number,
  { attack = 0, decay }: BeatPulseOptions,
): number {
  let peak = 0
  for (const m of map.moments ?? []) {
    const f = secondsToFrame(m.time, fps)
    if (frame - f < -attack) break // sorted ascending → nothing later can contribute
    if (type && m.type !== type) continue
    const v = pulseEnvelope(frame - f, attack, decay) * m.strength
    if (v > peak) peak = v
  }
  return peak
}

// ────────────────────────────────────────────────────────────────────────────
// Structure / dynamics summary (authoring legibility)
// ────────────────────────────────────────────────────────────────────────────

/** Eight block glyphs for a 0..1 sparkline (index 0 = lowest). */
const SPARK_BLOCKS = '▁▂▃▄▅▆▇█'

/** A `0..1` value as a block glyph. */
function sparkGlyph(v: number): string {
  return SPARK_BLOCKS[Math.max(0, Math.min(7, Math.round(v * 7)))]
}

/** A `0..1` value as a `width`-wide filled/empty meter. */
function meter(v: number, width = 8): string {
  const filled = Math.max(0, Math.min(width, Math.round(v * width)))
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

/**
 * The energy contour across a section as an `n`-glyph sparkline (sampled from
 * the committed bands). Empty string when the map has no bands.
 */
function sectionSparkline(map: BeatMap, s: Section, fps: number, n = 8): string {
  if (!map.bands) return ''
  let out = ''
  const span = s.end - s.start
  for (let k = 0; k < n; k++) {
    const t = s.start + ((k + 0.5) / n) * span
    out += sparkGlyph(overallEnergyAt(map, secondsToFrame(t, fps), fps))
  }
  return out
}

/**
 * The rich structure block: one line per section with its frame range, energy
 * contour sparkline, an intensity meter + number, and the rising/falling/steady
 * shape — the at-a-glance read of the song's dynamics. Used by
 * {@link formatFrameSummary} when sections carry energy (`intensity`).
 */
export function formatStructure(map: BeatMap, fps: number): string[] {
  const lines = [`structure (${map.sections.length} sections, energy-cut):`]
  const nameWidth = Math.max(...map.sections.map((s) => s.name.length), 1)
  for (const s of map.sections) {
    const sf = secondsToFrame(s.start, fps)
    const ef = secondsToFrame(s.end, fps)
    const spark = sectionSparkline(map, s, fps)
    const intensity = s.intensity ?? 0
    const range = `f${sf}–${ef}`.padEnd(13)
    lines.push(
      `  ${s.name.padEnd(nameWidth)}  ${range}${spark ? spark + '  ' : ''}${meter(intensity)} ${intensity.toFixed(
        2,
      )}  ${s.shape ?? ''}`.trimEnd(),
    )
  }
  return lines
}

/** Glyph per moment type for the summary (▲ up hard / △ up soft / ▼ down / ○ silence). */
const MOMENT_GLYPH: Record<MomentType, string> = { drop: '▲', lift: '△', break: '▼', dropout: '○' }

/**
 * The moments block: the song's typed structural hit points, each with the frame
 * it lands on and a strength meter — the "where do I put my big visual" read.
 * Used by {@link formatFrameSummary} when the map carries moments.
 */
export function formatMoments(map: BeatMap, fps: number): string[] {
  const moments = map.moments ?? []
  const lines = [`moments   (${moments.length}): structural hits  (▲ drop  △ lift  ▼ break  ○ dropout)`]
  for (const m of moments) {
    const f = secondsToFrame(m.time, fps)
    lines.push(`  ${MOMENT_GLYPH[m.type]} ${m.type.padEnd(8)} f${String(f).padEnd(6)} ${meter(m.strength)} ${m.strength.toFixed(2)}`)
  }
  return lines
}
