/**
 * Beat-analyser core — the pure derivations behind `scripts/analyze-beats.mjs`.
 * ────────────────────────────────────────────────────────────────────────────
 * The analyser script (Phase 2 of specs/music-sync.md) has exactly two impure
 * edges: ffmpeg (decode) and essentia.js (listen). Everything else — turning a
 * flat beat list + onsets into a committed {@link BeatMap} (bar/downbeat
 * grouping, phrase sections, manual bpm/offset corrections, rounding, schema
 * validation) and parsing the CLI — is pure and lives here so it can be
 * unit-tested in node without booting WASM. The same split the rest of the
 * beat-map layer uses ({@link ./beatmap} keeps its math pure for the same reason).
 */

import type { BeatMap, BeatBands, Moment, Section } from './beatmap'

/** Round `x` to `decimals` places (sub-ms times keep the JSON small & stable). */
export function roundTo(x: number, decimals = 4): number {
  const p = 10 ** decimals
  return Math.round(x * p) / p
}

/** How sections are derived: by energy regime, or by a fixed metric grid. */
export type SectionMode = 'energy' | 'bars'

/** Parsed CLI options for the analyser. */
export type AnalyzeArgs = {
  /** Positional audio input path. */
  input?: string
  /** Frames-per-second for the printed summary. */
  fps: number
  /** Beats per bar for downbeat grouping. */
  bar: number
  /** Bars per derived section/phrase (only used by the `bars` section mode). */
  sectionBars: number
  /** How to segment the song into sections. Default `energy`. */
  sections: SectionMode
  /** Requested sample rate (Hz) of the committed energy band envelopes. Default 20. */
  bandHz: number
  /** Whether to compute energy bands at all. Default true (`--no-bands` to skip). */
  bands: boolean
  /** Manual tempo override (rebuilds the beat grid). */
  bpm?: number
  /** Manual alignment shift, seconds. */
  offset?: number
  /** Explicit output path. */
  out?: string
}

/** Parse CLI argv (already sliced past `node script`) into {@link AnalyzeArgs}. */
export function parseArgs(argv: string[]): AnalyzeArgs {
  const args: AnalyzeArgs = { fps: 30, bar: 4, sectionBars: 8, sections: 'energy', bandHz: 20, bands: true }
  const positional: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--fps') args.fps = Number(argv[++i])
    else if (a === '--bpm') args.bpm = Number(argv[++i])
    else if (a === '--offset') args.offset = Number(argv[++i])
    else if (a === '--bar' || a === '--beats-per-bar') args.bar = Number(argv[++i])
    else if (a === '--section-bars') args.sectionBars = Number(argv[++i])
    else if (a === '--band-hz') args.bandHz = Number(argv[++i])
    else if (a === '--no-bands') args.bands = false
    else if (a === '--sections') {
      const v = argv[++i]
      if (v !== 'energy' && v !== 'bars') throw new Error(`--sections must be "energy" or "bars" (got "${v}")`)
      args.sections = v
    } else if (a === '--out') args.out = argv[++i]
    else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`)
    else positional.push(a)
  }
  args.input = positional[0]
  return args
}

/** Default output path: swap the audio extension for `.beats.json`. */
export function defaultOutPath(input: string): string {
  return /\.[^./\\]+$/.test(input) ? input.replace(/\.[^./\\]+$/, '.beats.json') : `${input}.beats.json`
}

/**
 * Every `beatsPerBar`-th beat is a bar start (downbeat), beginning at `barOffset`.
 * essentia gives a flat beat list with no bar info, so 4/4 is assumed by default.
 */
export function deriveDownbeats(beats: number[], beatsPerBar: number, barOffset = 0): number[] {
  if (!(beatsPerBar >= 1)) throw new Error('beatsPerBar must be >= 1')
  const out: number[] = []
  for (let i = barOffset; i < beats.length; i += beatsPerBar) out.push(beats[i])
  return out
}

/**
 * A uniform beat grid at `bpm` covering `[0, duration]`, phase-aligned to
 * `firstBeat`. Used by the `--bpm` manual override. A negative/large `firstBeat`
 * is folded into the first `[0, step)` window so the grid always starts in range.
 */
export function buildBeatGrid(bpm: number, firstBeat: number, duration: number): number[] {
  if (!(bpm > 0)) throw new Error('bpm must be > 0')
  const step = 60 / bpm
  let start = firstBeat % step
  if (start < 0) start += step
  const out: number[] = []
  for (let t = start; t <= duration + 1e-9; t += step) out.push(t)
  return out
}

/**
 * Group bars into phrases of `sectionBars` bars → contiguous named sections
 * covering `[0, duration]`. The first section starts at 0 (any pre-roll before
 * the first downbeat belongs to it) and the last ends exactly at `duration`.
 */
export function deriveSections(downbeats: number[], duration: number, sectionBars: number): Section[] {
  if (!(sectionBars >= 1)) throw new Error('sectionBars must be >= 1')
  if (downbeats.length === 0) return [{ name: 'part 1', start: 0, end: duration }]

  const starts: number[] = []
  for (let i = 0; i < downbeats.length; i += sectionBars) starts.push(downbeats[i])

  const sections: Section[] = []
  for (let k = 0; k < starts.length; k++) {
    const start = k === 0 ? 0 : starts[k]
    const end = k + 1 < starts.length ? starts[k + 1] : duration
    if (end > start) sections.push({ name: `part ${sections.length + 1}`, start, end })
  }
  if (sections.length === 0) return [{ name: 'part 1', start: 0, end: duration }]
  sections[sections.length - 1].end = duration
  return sections
}

/**
 * Shift each time by `offset` seconds (manual alignment correction). Times that
 * fall outside `[0, duration]` after the shift are dropped. `offset === 0`
 * returns a copy unchanged.
 */
export function applyOffset(times: number[], offset: number, duration: number): number[] {
  if (!offset) return times.slice()
  const out: number[] = []
  for (const t of times) {
    const s = t + offset
    if (s < 0 || s > duration) continue
    out.push(s)
  }
  return out
}

/** Inputs to {@link assembleBeatMap}. */
export type BeatMapParts = {
  duration: number
  bpm: number
  beats: number[]
  downbeats: number[]
  onsets: number[]
  sections: Section[]
  bands?: BeatBands
  moments?: Moment[]
}

/** Round every time and assemble a {@link BeatMap}-shaped object. */
export function assembleBeatMap({ duration, bpm, beats, downbeats, onsets, sections, bands, moments }: BeatMapParts): BeatMap {
  const r = (x: number) => roundTo(x, 4)
  const map: BeatMap = {
    duration: r(duration),
    bpm: roundTo(bpm, 2),
    beats: beats.map(r),
    downbeats: downbeats.map(r),
    onsets: onsets.map(r),
    sections: sections.map((s) => {
      const out: Section = { name: s.name, start: r(s.start), end: r(s.end) }
      if (s.intensity != null) out.intensity = roundTo(s.intensity, 3)
      if (s.shape) out.shape = s.shape
      return out
    }),
  }
  if (bands) map.bands = bands
  if (moments && moments.length) map.moments = moments
  return map
}

/**
 * Serialise a {@link BeatMap} to committed JSON: pretty (2-space) layout, but
 * with the long numeric arrays (`beats`, `downbeats`, `onsets`, and each band
 * envelope) collapsed onto a single line so the file stays readable and the
 * energy bands don't explode it to tens of thousands of lines. Object arrays
 * (`sections`) keep their expanded form. Pure; no trailing newline.
 */
export function serializeBeatMap(map: BeatMap): string {
  return JSON.stringify(map, null, 2).replace(
    /\[\n([\s\d.,eE+\-]+?)\n\s*\]/g,
    (_m, body: string) => '[' + body.replace(/\s+/g, ' ').trim() + ']',
  )
}

/**
 * Assert `map` conforms to the BeatMap contract before it is written: finite
 * numbers, ascending sorted event arrays within `[0, duration]`, and contiguous
 * well-formed sections. Throws an aggregated error listing every problem.
 */
export function validateBeatMap(map: BeatMap): BeatMap {
  const errs: string[] = []
  const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
  if (!num(map.duration) || map.duration <= 0) errs.push('duration must be a positive number')
  if (!num(map.bpm) || map.bpm < 0) errs.push('bpm must be a non-negative number')

  const checkArr = (name: string, xs: number[]) => {
    if (!Array.isArray(xs)) return void errs.push(`${name} must be an array`)
    for (let i = 0; i < xs.length; i++) {
      if (!num(xs[i])) errs.push(`${name}[${i}] is not a finite number`)
      else if (i > 0 && xs[i] < xs[i - 1]) errs.push(`${name} not sorted ascending at index ${i}`)
      else if (xs[i] < -1e-6 || xs[i] > map.duration + 1e-6) errs.push(`${name}[${i}]=${xs[i]} is outside [0, ${map.duration}]`)
    }
  }
  checkArr('beats', map.beats)
  checkArr('downbeats', map.downbeats)
  checkArr('onsets', map.onsets)

  if (!Array.isArray(map.sections)) {
    errs.push('sections must be an array')
  } else {
    for (let i = 0; i < map.sections.length; i++) {
      const s = map.sections[i]
      if (typeof s?.name !== 'string' || !s.name) errs.push(`sections[${i}].name must be a non-empty string`)
      if (!num(s?.start) || !num(s?.end)) errs.push(`sections[${i}] start/end must be finite numbers`)
      else if (s.end <= s.start) errs.push(`sections[${i}] end must be > start`)
      if (s?.intensity != null && (!num(s.intensity) || s.intensity < -1e-6 || s.intensity > 1 + 1e-6))
        errs.push(`sections[${i}].intensity=${s.intensity} must be within [0, 1]`)
      if (s?.shape != null && !['rising', 'falling', 'steady'].includes(s.shape))
        errs.push(`sections[${i}].shape="${s.shape}" must be rising/falling/steady`)
    }
  }

  if (map.bands != null) {
    const b = map.bands
    if (!num(b?.hz) || b.hz <= 0) errs.push('bands.hz must be a positive number')
    const arrays: Array<[string, unknown]> = [
      ['low', b?.low],
      ['mid', b?.mid],
      ['high', b?.high],
    ]
    const lengths = arrays.map(([, a]) => (Array.isArray(a) ? a.length : -1))
    if (lengths.some((l) => l < 0)) errs.push('bands.low/mid/high must each be an array')
    else if (new Set(lengths).size > 1) errs.push(`bands.low/mid/high must be equal length (got ${lengths.join('/')})`)
    for (const [name, a] of arrays) {
      if (!Array.isArray(a)) continue
      for (let i = 0; i < a.length; i++) {
        if (!num(a[i]) || a[i] < -1e-6 || a[i] > 1 + 1e-6) {
          errs.push(`bands.${name}[${i}]=${a[i]} must be a number within [0, 1]`)
          break
        }
      }
    }
  }

  if (map.moments != null) {
    if (!Array.isArray(map.moments)) {
      errs.push('moments must be an array')
    } else {
      const TYPES = ['drop', 'lift', 'break', 'dropout']
      for (let i = 0; i < map.moments.length; i++) {
        const m = map.moments[i]
        if (!num(m?.time) || m.time < -1e-6 || m.time > map.duration + 1e-6)
          errs.push(`moments[${i}].time=${m?.time} is outside [0, ${map.duration}]`)
        else if (i > 0 && m.time < map.moments[i - 1].time) errs.push(`moments not sorted ascending at index ${i}`)
        if (!TYPES.includes(m?.type)) errs.push(`moments[${i}].type="${m?.type}" must be drop/lift/break/dropout`)
        if (!num(m?.strength) || m.strength < -1e-6 || m.strength > 1 + 1e-6)
          errs.push(`moments[${i}].strength=${m?.strength} must be within [0, 1]`)
        // The ranged `end` is load-bearing for lifts and hand-editable, so guard it:
        // a finite time strictly after `time`, within the song, and only on a lift.
        if (m?.end != null) {
          if (!num(m.end) || m.end <= m.time || m.end > map.duration + 1e-6)
            errs.push(`moments[${i}].end=${m.end} must be a finite time in (time, duration]`)
          if (m.type !== 'lift') errs.push(`moments[${i}].end is only valid on a 'lift' (got "${m?.type}")`)
        }
      }
    }
  }

  if (errs.length) throw new Error('Invalid beat map:\n  - ' + errs.join('\n  - '))
  return map
}
