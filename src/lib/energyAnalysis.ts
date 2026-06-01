/**
 * energyAnalysis — the dynamics ear of the beat-map analyser.
 * ────────────────────────────────────────────────────────────────────────────
 * `RhythmExtractor2013` / `OnsetRate` (in `analyze-beats.mjs`) tell us *when*
 * things hit — beats, bars, golpes. They say nothing about *how hard* the song
 * is pushing at any moment: where it swells, where it drops out, where a quiet
 * intro gives way to a wall of bass. That dynamic contour is what lets a
 * composition do more than blink on every beat — it can read the song's
 * structure (intro → build → drop → break → outro) and animate *in kind*.
 *
 * This module is that missing ear, and it is deliberately **pure DSP** — plain
 * number-array math, no essentia, no audio I/O — so every step is deterministic
 * and unit-testable with synthetic signals. The impure shell (`analyze-beats`)
 * hands it the decoded PCM; everything here is `state in → numbers out`, the
 * same contract the rest of the beat-map layer keeps.
 *
 * Two things come out of it:
 *   1. {@link computeBands} — committed `low/mid/high` energy envelopes
 *      ({@link BeatBands}) the render path reads back deterministically (no
 *      re-decoding the audio at runtime) for breathing / VU-style motion.
 *   2. {@link deriveSectionsFromEnergy} — *real* structural sections, cut where
 *      the energy regime actually changes (not every N bars), each tagged with
 *      an `intensity` (0..1) and a rising/falling/steady `shape`.
 *
 * See ([spec: Music Sync (Beats)](../../specs/music-sync.md)).
 */

import type { BeatBands, Moment, MomentType, Section, SectionShape } from './beatmap'

// ────────────────────────────────────────────────────────────────────────────
// Biquad filters (RBJ cookbook) — the band split
// ────────────────────────────────────────────────────────────────────────────
// A second-order IIR section. Coefficients are pre-normalised by a0, so the
// difference equation is  y = b0·x + b1·x₁ + b2·x₂ − a1·y₁ − a2·y₂.

/** Normalised biquad coefficients (a0 folded in). */
export type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number }

/** Butterworth Q for a maximally-flat passband (a single 12 dB/oct section). */
export const FLAT_Q = Math.SQRT1_2 // 0.70710678…

/** RBJ low-pass section at corner `f0` (Hz) for sample rate `fs`. */
export function lowpass(f0: number, fs: number, q: number = FLAT_Q): Biquad {
  const w0 = (2 * Math.PI * f0) / fs
  const cos = Math.cos(w0)
  const alpha = Math.sin(w0) / (2 * q)
  const a0 = 1 + alpha
  const b1 = (1 - cos) / a0
  return { b0: ((1 - cos) / 2) / a0, b1, b2: ((1 - cos) / 2) / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 }
}

/** RBJ high-pass section at corner `f0` (Hz) for sample rate `fs`. */
export function highpass(f0: number, fs: number, q: number = FLAT_Q): Biquad {
  const w0 = (2 * Math.PI * f0) / fs
  const cos = Math.cos(w0)
  const alpha = Math.sin(w0) / (2 * q)
  const a0 = 1 + alpha
  return {
    b0: ((1 + cos) / 2) / a0,
    b1: (-(1 + cos)) / a0,
    b2: ((1 + cos) / 2) / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  }
}

/**
 * Run a cascade of biquad sections over `x` (Direct Form II Transposed, which
 * keeps its state small and is numerically friendly). Pure: returns a fresh
 * array, never mutates the input. An empty cascade returns a copy of `x`.
 */
export function runBiquads(x: Float32Array | number[], sections: Biquad[]): Float32Array {
  const out = Float32Array.from(x)
  for (const c of sections) {
    let z1 = 0
    let z2 = 0
    for (let i = 0; i < out.length; i++) {
      const xn = out[i]
      const yn = c.b0 * xn + z1
      z1 = c.b1 * xn - c.a1 * yn + z2
      z2 = c.b2 * xn - c.a2 * yn
      out[i] = yn
    }
  }
  return out
}

// ────────────────────────────────────────────────────────────────────────────
// Envelope extraction (RMS per window)
// ────────────────────────────────────────────────────────────────────────────

/** Crossover between the low and mid bands (Hz). */
export const LOW_MID_HZ = 250
/** Crossover between the mid and high bands (Hz). */
export const MID_HIGH_HZ = 2500

/**
 * Root-mean-square of `x` over non-overlapping windows of `win` samples. The
 * last partial window (if any) is measured over the samples it actually has, so
 * the envelope always covers the whole signal. `win < 1` is treated as 1.
 */
export function rmsWindows(x: Float32Array | number[], win: number): number[] {
  const w = Math.max(1, Math.floor(win))
  const out: number[] = []
  for (let start = 0; start < x.length; start += w) {
    const end = Math.min(start + w, x.length)
    let sum = 0
    for (let i = start; i < end; i++) sum += x[i] * x[i]
    out.push(Math.sqrt(sum / (end - start)))
  }
  return out
}

/**
 * Scale `xs` so its peak is 1 (everything `0..1`). A flat/silent envelope (peak
 * ≤ 0) is returned as all-zeros. Returns a fresh array.
 */
export function normalizePeak(xs: number[]): number[] {
  let peak = 0
  for (const v of xs) if (v > peak) peak = v
  if (peak <= 0) return xs.map(() => 0)
  return xs.map((v) => v / peak)
}

/** Round every value to `decimals` places (keeps the committed JSON small). */
export function roundEnvelope(xs: number[], decimals = 3): number[] {
  const p = 10 ** decimals
  return xs.map((v) => Math.round(v * p) / p)
}

/**
 * The window size (in samples) and the *effective* envelope rate for a
 * requested `hz`. The effective rate (`fs / win`) is what's stored, so frame
 * lookups (`bandEnergyAt`) land exactly — no drift between requested and real.
 */
export function envelopeGrid(fs: number, hz: number): { win: number; hz: number } {
  const win = Math.max(1, Math.round(fs / hz))
  return { win, hz: fs / win }
}

/**
 * Split `pcm` into low / mid / high energy envelopes, each RMS-per-window and
 * peak-normalised to `0..1`. Bands are carved by Butterworth crossovers at
 * {@link LOW_MID_HZ} / {@link MID_HIGH_HZ}: low = LP(250), mid = HP(250)→LP(2500),
 * high = HP(2500). The returned `hz` is the effective envelope rate (see
 * {@link envelopeGrid}); all three arrays are equal length. `decimals` controls
 * the stored precision (default 3). Pure.
 */
export function computeBands(
  pcm: Float32Array | number[],
  fs: number,
  hzRequested: number,
  decimals = 3,
): BeatBands {
  const { win, hz } = envelopeGrid(fs, hzRequested)
  const low = runBiquads(pcm, [lowpass(LOW_MID_HZ, fs)])
  const mid = runBiquads(pcm, [highpass(LOW_MID_HZ, fs), lowpass(MID_HIGH_HZ, fs)])
  const high = runBiquads(pcm, [highpass(MID_HIGH_HZ, fs)])
  return {
    // Store the *exact* effective rate (fs / win) so frame lookups land exactly,
    // honouring envelopeGrid's contract and matching overallEnergy's grid.
    hz,
    low: roundEnvelope(normalizePeak(rmsWindows(low, win)), decimals),
    mid: roundEnvelope(normalizePeak(rmsWindows(mid, win)), decimals),
    high: roundEnvelope(normalizePeak(rmsWindows(high, win)), decimals),
  }
}

/**
 * The overall loudness envelope (full-band RMS per window, peak-normalised to
 * `0..1`) at the same grid {@link computeBands} uses. This is the macro-dynamics
 * curve sections are cut from and `intensity` is measured against. Pure.
 */
export function overallEnergy(
  pcm: Float32Array | number[],
  fs: number,
  hzRequested: number,
): { hz: number; env: number[] } {
  const { win, hz } = envelopeGrid(fs, hzRequested)
  return { hz, env: normalizePeak(rmsWindows(pcm, win)) }
}

// ────────────────────────────────────────────────────────────────────────────
// Structural segmentation (cut where the energy regime changes)
// ────────────────────────────────────────────────────────────────────────────

/** Mean of `xs` over the half-open index range `[a, b)`, clamped to bounds. */
export function meanRange(xs: number[], a: number, b: number): number {
  const lo = Math.max(0, Math.floor(a))
  const hi = Math.min(xs.length, Math.ceil(b))
  if (hi <= lo) return 0
  let sum = 0
  for (let i = lo; i < hi; i++) sum += xs[i]
  return sum / (hi - lo)
}

/** Moving-average smooth of `xs` with a centred window of `win` samples. */
export function smooth(xs: number[], win: number): number[] {
  const w = Math.max(1, Math.floor(win))
  if (w <= 1) return xs.slice()
  const half = Math.floor(w / 2)
  return xs.map((_, i) => meanRange(xs, i - half, i + half + 1))
}

/**
 * Classify a slice of envelope as rising / falling / steady by comparing the
 * mean of its first third to its last third. `eps` is the minimum normalised
 * change that counts as a trend (default 0.06). Pure.
 */
export function classifyShape(env: number[], eps = 0.06): SectionShape {
  if (env.length < 3) return 'steady'
  const t = Math.max(1, Math.floor(env.length / 3))
  const head = meanRange(env, 0, t)
  const tail = meanRange(env, env.length - t, env.length)
  if (tail - head > eps) return 'rising'
  if (head - tail > eps) return 'falling'
  return 'steady'
}

/** Tunables for {@link deriveSectionsFromEnergy}. */
export type SectionEnergyOptions = {
  /** Smoothing window for the novelty curve, seconds. Default 1.5. */
  smoothSec?: number
  /** Half-width of the before/after contrast windows, seconds. Default 4. */
  lookSec?: number
  /**
   * Minimum spacing between *interior* cuts, seconds. Default 12. The first and
   * last sections are bounded by `0` / `duration` rather than by another cut, so
   * they may be as short as half this (a brief distinct intro/outro is kept).
   */
  minSectionSec?: number
  /** A downbeat must out-contrast its neighbours by at least this (0..1). Default 0.08. */
  minContrast?: number
}

/**
 * Find the structural cut times (seconds) where the song's energy regime
 * changes. For every downbeat we score the *contrast* between the mean energy
 * just after it and just before it (over `lookSec` windows of the smoothed
 * overall envelope); a downbeat is a cut when its contrast is a local maximum,
 * clears `minContrast`, and sits at least `minSectionSec` from the previous cut.
 * `0` and `duration` are always implicit bounds (not returned here). Cuts come
 * back sorted ascending. Pure & deterministic.
 */
export function findSectionCuts(
  env: number[],
  hz: number,
  downbeats: number[],
  duration: number,
  opts: SectionEnergyOptions = {},
): number[] {
  const { smoothSec = 1.5, lookSec = 4, minSectionSec = 12, minContrast = 0.08 } = opts
  if (downbeats.length === 0 || env.length === 0) return []

  const sm = smooth(env, Math.round(smoothSec * hz))
  const look = Math.max(1, Math.round(lookSec * hz))

  // Contrast at each downbeat: |mean(after) − mean(before)|.
  const scored = downbeats
    .filter((t) => t > minSectionSec * 0.5 && t < duration - minSectionSec * 0.5)
    .map((t) => {
      const c = Math.round(t * hz)
      const before = meanRange(sm, c - look, c)
      const after = meanRange(sm, c, c + look)
      return { t, contrast: Math.abs(after - before) }
    })

  // Keep only local maxima of the contrast curve (a real boundary peaks, it
  // doesn't plateau) that clear the threshold.
  const peaks = scored.filter((s, i) => {
    if (s.contrast < minContrast) return false
    const prev = scored[i - 1]
    const next = scored[i + 1]
    return (!prev || s.contrast >= prev.contrast) && (!next || s.contrast >= next.contrast)
  })

  // Greedily take the strongest peaks first, enforcing the minimum spacing, so
  // two near-simultaneous swells can't both become cuts.
  const chosen: number[] = []
  for (const s of [...peaks].sort((a, b) => b.contrast - a.contrast)) {
    if (chosen.every((c) => Math.abs(c - s.t) >= minSectionSec)) chosen.push(s.t)
  }
  return chosen.sort((a, b) => a - b)
}

/**
 * A deterministic, energy-descriptive label for a section given its normalised
 * `intensity`, its `shape`, the intensity of the previous section, and whether
 * it's the first/last part. These are *dynamics* names (what the energy is
 * doing) — `intro`, `build`, `drop`, `peak`, `groove`, `break`, `outro` — not
 * claims about lyrics or harmony. The numeric `intensity`/`shape` remain the
 * hard data; this is the at-a-glance handle.
 */
export function labelSection(
  intensity: number,
  shape: SectionShape,
  prevIntensity: number | null,
  isFirst: boolean,
  isLast: boolean,
): string {
  const LOW = 0.33
  const HIGH = 0.66
  const rose = prevIntensity != null && intensity - prevIntensity > 0.12
  const fell = prevIntensity != null && prevIntensity - intensity > 0.12

  if (isFirst && intensity < HIGH) return 'intro'
  if (isLast && (intensity < LOW || shape === 'falling')) return 'outro'
  if (intensity >= HIGH && rose) return 'drop'
  if (intensity >= HIGH) return 'peak'
  if (shape === 'rising' && intensity >= LOW) return 'build'
  if (intensity < LOW && fell) return 'break'
  if (intensity < LOW) return 'quiet'
  return 'groove'
}

/**
 * Turn the overall energy envelope into real {@link Section}s: cut at the
 * energy-regime changes from {@link findSectionCuts}, then tag each part with
 * its mean `intensity` (0..1), its rising/falling/steady `shape`, and a
 * deterministic energy `name` (de-duplicated with a numeric suffix when a label
 * repeats). Sections tile `[0, duration]` with the last ending exactly at
 * `duration`. Falls back to a single full-length section when there are no
 * downbeats/energy. Pure.
 */
export function deriveSectionsFromEnergy(
  env: number[],
  hz: number,
  downbeats: number[],
  duration: number,
  opts: SectionEnergyOptions = {},
): Section[] {
  const round2 = (x: number) => Math.round(x * 100) / 100
  // No metric grid / no signal → we can't honestly segment; one bare part.
  if (env.length === 0 || duration <= 0 || downbeats.length === 0) {
    return [{ name: 'part 1', start: 0, end: round2(Math.max(duration, 0)) }]
  }

  const cuts = findSectionCuts(env, hz, downbeats, duration, opts)
  const bounds = [0, ...cuts, duration]

  const raw = bounds.slice(0, -1).map((start, i) => {
    const end = bounds[i + 1]
    // Index on the rounded half-open grid [round(start·hz), round(end·hz)) so
    // adjacent sections never double-count the sample on their shared boundary.
    const lo = Math.round(start * hz)
    const hi = Math.max(lo + 1, Math.round(end * hz))
    return { start, end, intensity: round2(meanRange(env, lo, hi)), shape: classifyShape(env.slice(lo, hi)) }
  })

  // Name each part, then disambiguate repeats (drop, drop 2, …). A lone section
  // (no cuts cleared the bar) is just "part 1" — labelling the whole song
  // "intro" would over-claim — but it still carries its measured intensity.
  const counts: Record<string, number> = {}
  return raw.map((s, i) => {
    const base =
      raw.length === 1
        ? 'part 1'
        : labelSection(s.intensity, s.shape, i > 0 ? raw[i - 1].intensity : null, i === 0, i === raw.length - 1)
    counts[base] = (counts[base] ?? 0) + 1
    const name = counts[base] > 1 ? `${base} ${counts[base]}` : base
    return { name, start: round2(s.start), end: i === raw.length - 1 ? round2(duration) : round2(s.end), intensity: s.intensity, shape: s.shape }
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Structural moments — the motion-design hit points
// ────────────────────────────────────────────────────────────────────────────
// Grounded in MIR structure-detection + how pro motion designers cut to music
// (see specs/music-sync.md). Two stages: the energy-cut section edges already
// LOCATE the boundaries; here we CLASSIFY each by the *sign + band* of its energy
// change, then rank by contrast (per-song, never absolute dB):
//   • drop    — energy slams UP with the low/sub band re-entering from near-zero
//               (the decisive test — a loud section after a loud section is not a
//               drop), boosted when a trough/break preceded it; snapped to a bar.
//   • lift     — a ranged RISING build (high band climbs, low stays low); the one
//               moment animated over its whole span, resolving on the next drop.
//   • break    — energy falls and STAYS low for a sustained span (≥ ~1 bar).
//   • dropout  — a SUB-bar near-silence flanked by sound (the gap before a hit).

const clamp01ish = (x: number) => Math.max(0, Math.min(1, x))

/** Median bar length (seconds) from the downbeat grid; falls back to an even split. */
export function barSeconds(downbeats: number[], duration: number): number {
  if (downbeats.length >= 2) {
    const gaps = downbeats.slice(1).map((d, i) => d - downbeats[i]).sort((a, b) => a - b)
    return gaps[Math.floor(gaps.length / 2)] || duration / downbeats.length
  }
  return downbeats.length === 1 ? duration / 2 : Math.max(1e-6, duration)
}

/** Nearest value in `grid` to `t` (returns `t` if the grid is empty). */
export function snapToNearest(t: number, grid: number[]): number {
  let best = t
  let bestD = Infinity
  for (const g of grid) {
    const d = Math.abs(g - t)
    if (d < bestD) {
      bestD = d
      best = g
    }
  }
  return grid.length ? best : t
}

// ────────────────────────────────────────────────────────────────────────────
// Section-independent, RELATIVE hit detectors (the "cuando pega" ear)
// ────────────────────────────────────────────────────────────────────────────
// The boundary classifier below only sees changes that happen to land on a
// section seam, and the dropout test is an ABSOLUTE near-silence floor. Songs
// with compressed dynamics (the energy never goes near zero, the bass barely
// rests) have real, audible hits — a breakdown then a slam — that neither catches:
// the slam isn't on a seam, and the dip isn't "silent" in absolute terms. These
// two detectors find those hits by LOCAL contrast, normalised to the song's own
// dynamic range, so a hit reads as a hit even when the whole track is loud.

/** Tunables for {@link detectImpacts}. All bar counts scale with the song's tempo. */
export type ImpactOptions = {
  /** Light smoothing of the envelope before scoring, seconds. Default 0.2. */
  smoothSec?: number
  /** Half-width of the before/after contrast windows, in bars. Default 0.5. */
  lookBars?: number
  /** Wide baseline window for the trough boost, in bars (each side). Default 4. */
  contextBars?: number
  /** Keep a surge only if its rise ≥ this fraction of the strongest in the song. Default 0.5. */
  riseFrac?: number
  /** …and only if the rise clears this absolute floor (kills noise in flat songs). Default 0.05. */
  minRise?: number
  /** Minimum spacing between accepted impacts, in bars. Default 2. */
  minSpacingBars?: number
}

/**
 * Find the **impacts** — the frames where the song *slams up*, "cuando pega" —
 * by local energy novelty, independent of the section grid. For every downbeat
 * we score the forward energy *rise* (mean after − mean before, over half-bar
 * windows of the smoothed `overall` envelope), boosted when it climbs out of a
 * local trough (the break-then-bang pattern) and when the low/sub band re-enters
 * with it (the hit has body). A downbeat is an impact when its rise is a local
 * maximum, clears a **relative** threshold (`riseFrac` of the strongest rise in
 * the track, with a small absolute floor), and sits at least `minSpacingBars`
 * from a stronger one. Returns `{ time, raw }` sorted ascending — `raw` is the
 * per-song contrast the caller normalises into a `0..1` strength. Pure.
 */
export function detectImpacts(
  overall: number[],
  low: number[],
  downbeats: number[],
  bar: number,
  hz: number,
  duration: number,
  opts: ImpactOptions = {},
): { time: number; raw: number }[] {
  const { smoothSec = 0.2, lookBars = 0.5, contextBars = 4, riseFrac = 0.5, minRise = 0.05, minSpacingBars = 2 } = opts
  if (downbeats.length === 0 || overall.length === 0 || bar <= 0) return []

  const sm = smooth(overall, Math.max(1, Math.round(smoothSec * hz)))
  const look = Math.max(1, Math.round(lookBars * bar * hz))
  const ctx = Math.max(look, Math.round(contextBars * bar * hz))

  const cands = downbeats
    .filter((t) => t > bar * 0.5 && t < duration - bar * 0.25)
    .map((t) => {
      const c = Math.round(t * hz)
      const before = meanRange(sm, c - look, c)
      const after = meanRange(sm, c, c + look)
      const rise = after - before
      const baseline = meanRange(sm, c - ctx, c + ctx)
      const troughDepth = Math.max(0, baseline - before) // how deep the pre-hit dip sat
      const lowRise = Math.max(0, meanRange(low, c, c + look) - meanRange(low, c - look, c))
      return { t, rise, raw: rise * (1 + troughDepth + lowRise) }
    })

  const maxRise = cands.reduce((m, x) => Math.max(m, x.rise), 0)
  if (maxRise <= 0) return []
  const thresh = Math.max(minRise, riseFrac * maxRise)

  // A real impact PEAKS — it isn't a plateau of a slow ramp (that's a lift).
  const peaks = cands.filter((s, i) => {
    if (s.rise < thresh) return false
    const prev = cands[i - 1]
    const next = cands[i + 1]
    return (!prev || s.rise >= prev.rise) && (!next || s.rise >= next.rise)
  })

  // Greedily take the strongest first, enforcing spacing so one slam isn't double-hit.
  const spacing = minSpacingBars * bar
  const chosen: { time: number; raw: number }[] = []
  for (const s of [...peaks].sort((a, b) => b.raw - a.raw)) {
    if (chosen.every((c) => Math.abs(c.time - s.t) >= spacing)) chosen.push({ time: s.t, raw: s.raw })
  }
  return chosen.sort((a, b) => a.time - b.time)
}

/** Tunables for {@link detectTroughs}. The mirror of {@link ImpactOptions}. */
export type TroughOptions = {
  /** Light smoothing of the envelope before scoring, seconds. Default 0.25. */
  smoothSec?: number
  /** Half-width of the before/after contrast windows, in bars. Default 0.5. */
  lookBars?: number
  /** Keep a fall only if ≥ this fraction of the strongest fall in the song. Default 0.5. */
  fallFrac?: number
  /** …and only if the fall clears this absolute floor. Default 0.05. */
  minFall?: number
  /** The fall must stay down for at least this long to be a break, in bars. Default 1. */
  minBreakBars?: number
  /** "Down" means below this fraction of the pre-fall energy. Default 0.7. */
  sustainFrac?: number
  /** …and at least this fraction of the break window must stay down. Default 0.7. */
  sustainCover?: number
  /** Minimum spacing between accepted breaks, in bars. Default 2. */
  minSpacingBars?: number
}

/**
 * Find the **breakdowns** — the frames where the song *drops away* and stays
 * down — as the exact mirror of {@link detectImpacts}. For every downbeat we
 * score the energy *fall* (mean before − mean after, over half-bar windows of
 * the smoothed `overall` envelope) and confirm it's **sustained**: at least
 * `sustainCover` of the next `minBreakBars` must sit below `sustainFrac` of the
 * pre-fall level (so a one-beat dip is left to the dropout detector). A downbeat
 * is a break when its fall is a local maximum and clears a **relative** threshold
 * (`fallFrac` of the strongest fall in the track). Because it's relative, it
 * catches a breakdown in a loud, compressed track (energy halves but never goes
 * silent) that an absolute floor would miss — and because it doesn't need a
 * section seam, it catches a breakdown *inside* a section the segmenter smeared.
 * Returns `{ time, raw }` (snapped to the downbeat) sorted ascending. Pure.
 */
export function detectTroughs(
  overall: number[],
  downbeats: number[],
  bar: number,
  hz: number,
  duration: number,
  opts: TroughOptions = {},
): { time: number; raw: number }[] {
  const { smoothSec = 0.25, lookBars = 0.5, fallFrac = 0.5, minFall = 0.05, minBreakBars = 1, sustainFrac = 0.7, sustainCover = 0.7, minSpacingBars = 2 } = opts
  if (downbeats.length === 0 || overall.length === 0 || bar <= 0) return []

  const sm = smooth(overall, Math.max(1, Math.round(smoothSec * hz)))
  const look = Math.max(1, Math.round(lookBars * bar * hz))
  const span = Math.max(1, Math.round(minBreakBars * bar * hz))

  const cands = downbeats
    .filter((t) => t > bar * 0.5 && t < duration - bar * 0.5)
    .map((t) => {
      const c = Math.round(t * hz)
      const before = meanRange(sm, c - look, c)
      const after = meanRange(sm, c, c + look)
      const fall = before - after
      // Sustained-ness: how much of the next break window actually stays down.
      const ceil = before * sustainFrac
      let below = 0
      let total = 0
      for (let k = c; k < Math.min(sm.length, c + span); k++) {
        total++
        if (sm[k] < ceil) below++
      }
      return { t, fall, cover: total ? below / total : 0 }
    })

  const maxFall = cands.reduce((m, x) => Math.max(m, x.fall), 0)
  if (maxFall <= 0) return []
  const thresh = Math.max(minFall, fallFrac * maxFall)

  const peaks = cands.filter((s, i) => {
    if (s.fall < thresh || s.cover < sustainCover) return false
    const prev = cands[i - 1]
    const next = cands[i + 1]
    return (!prev || s.fall >= prev.fall) && (!next || s.fall >= next.fall)
  })

  const spacing = minSpacingBars * bar
  const chosen: { time: number; raw: number }[] = []
  for (const s of [...peaks].sort((a, b) => b.fall - a.fall)) {
    if (chosen.every((c) => Math.abs(c.time - s.t) >= spacing)) chosen.push({ time: s.t, raw: s.fall })
  }
  return chosen.sort((a, b) => a.time - b.time)
}

/** Tunables for {@link detectMoments}. All thresholds are in normalised 0..1 energy. */
export type MomentOptions = {
  /** Min positive section-intensity step for an "up" boundary. Default 0.04. */
  posDelta?: number
  /** Min negative section-intensity step for a break. Default 0.04. */
  negDelta?: number
  /** Min low-band re-entry step that gates a true drop. Default 0.12. */
  lowReentry?: number
  /** The low band must have sat below this before a drop (re-entry from low). Default 0.5. */
  lowQuietBefore?: number
  /** Overall energy below this reads as silence (for dropouts). Default 0.06. */
  silenceFloor?: number
  /** Tunables for the section-independent {@link detectImpacts impact} pass. */
  impact?: ImpactOptions
  /** Tunables for the section-independent {@link detectTroughs trough} pass. */
  trough?: TroughOptions
}

/**
 * Derive the song's typed structural {@link Moment}s from its energy-cut
 * `sections` (with intensity/shape), `bands` envelopes and `downbeats`. Pure &
 * deterministic. Strengths are normalised to the strongest contrast in the track
 * (so the headline hit ≈ 1.0) and double as a confidence — ambiguous moments
 * stay weak so a scene can soften rather than cut hard on a maybe. Returns `[]`
 * without bands/sections.
 */
export function detectMoments(
  sections: Section[],
  bands: BeatBands | undefined,
  downbeats: number[],
  duration: number,
  opts: MomentOptions = {},
): Moment[] {
  const { posDelta = 0.04, negDelta = 0.04, lowReentry = 0.12, lowQuietBefore = 0.5, silenceFloor = 0.06, impact, trough } = opts
  if (!bands || sections.length === 0) return []

  const hz = bands.hz
  const overall = bands.low.map((v, i) => (v + bands.mid[i] + bands.high[i]) / 3)
  const low = bands.low
  const bar = barSeconds(downbeats, duration)
  const r3 = (x: number) => Math.round(x * 1000) / 1000

  const intens = sections.map((s) => s.intensity ?? meanRange(overall, s.start * hz, s.end * hz))
  const lowMean = sections.map((s) => meanRange(low, s.start * hz, s.end * hz))
  const peakIntensity = Math.max(...intens)
  const dyn = Math.max(1e-6, peakIntensity - Math.min(...intens))

  type Raw = { time: number; type: MomentType; raw: number; end?: number }
  const raw: Raw[] = []

  // Boundary moments: drop (gated on low re-entry) or break (sustained fall).
  for (let i = 1; i < sections.length; i++) {
    const dWide = intens[i] - intens[i - 1]
    const dLow = lowMean[i] - lowMean[i - 1]
    if (dWide > posDelta && dLow > lowReentry && lowMean[i - 1] < lowQuietBefore && sections[i].shape !== 'falling') {
      const troughBoost = 1 + clamp01ish((peakIntensity - intens[i - 1]) / dyn)
      raw.push({ time: snapToNearest(sections[i].start, downbeats), type: 'drop', raw: dLow * troughBoost })
    } else if (dWide < -negDelta) {
      raw.push({ time: sections[i].start, type: 'break', raw: intens[i - 1] - intens[i] })
    }
  }

  // Lifts: ranged rising sections whose energy actually climbs across the span.
  for (const s of sections) {
    if (s.shape !== 'rising') continue
    const span = Math.max(1e-6, s.end - s.start)
    const startE = meanRange(overall, s.start * hz, (s.start + span / 4) * hz)
    const endE = meanRange(overall, (s.end - span / 4) * hz, s.end * hz)
    const rise = endE - startE
    if (rise > posDelta) raw.push({ time: s.start, end: s.end, type: 'lift', raw: rise * Math.min(1, span / (4 * bar)) })
  }

  // Dropouts: a SUB-bar near-silence flanked by sound — but only a *structural*
  // one that PUNCTUATES loud material. A gap inside an already-quiet passage is
  // just the texture of a sparse arrangement, not a hit set-up, so we require at
  // least one side of the gap to be genuinely loud for the track.
  const peakOverall = overall.reduce((m, v) => Math.max(m, v), 0)
  const loudContext = silenceFloor + 0.35 * (peakOverall - silenceFloor)
  const halfBar = bar * 0.5 * hz
  const sm = smooth(overall, Math.max(1, Math.round(0.2 * hz)))
  for (let i = 0; i < sm.length; ) {
    if (sm[i] >= silenceFloor) {
      i++
      continue
    }
    let j = i
    while (j < sm.length && sm[j] < silenceFloor) j++
    const span = (j - i) / hz
    const flankedBySound = i > 0 && sm[i - 1] >= silenceFloor && j < sm.length && sm[j] >= silenceFloor
    if (flankedBySound && span < 1.5 * bar && i / hz > 1) {
      const beforeE = meanRange(overall, i - halfBar, i)
      const afterE = meanRange(overall, j, j + halfBar)
      if (Math.max(beforeE, afterE) >= loudContext) {
        let floor = Infinity
        for (let k = i; k < j; k++) floor = Math.min(floor, sm[k])
        raw.push({ time: i / hz, type: 'dropout', raw: Math.max(0, afterE - floor) })
      }
    }
    i = j
  }

  // Section-INDEPENDENT relative passes — catch the hits the seam classifier and
  // the absolute silence floor miss (a slam mid-section, a breakdown that never
  // goes silent). They feed the same `raw` list, so the normalisation + dedup
  // below fold them in with the boundary moments (co-located hits collapse,
  // keeping the stronger).
  for (const im of detectImpacts(overall, low, downbeats, bar, hz, duration, impact)) {
    raw.push({ time: im.time, type: 'drop', raw: im.raw })
  }
  for (const tr of detectTroughs(overall, downbeats, bar, hz, duration, trough)) {
    raw.push({ time: tr.time, type: 'break', raw: tr.raw })
  }

  // Normalise every contrast to the single strongest in the track → headline ≈ 1.
  const globalMax = raw.reduce((m, x) => Math.max(m, x.raw), 0)
  if (globalMax <= 0) return []

  const moments: Moment[] = raw
    .filter((m) => m.raw > 0)
    .map((m) => {
      const out: Moment = { time: r3(m.time), type: m.type, strength: r3(clamp01ish(m.raw / globalMax)) }
      if (m.end != null) out.end = r3(m.end)
      return out
    })
    .sort((a, b) => a.time - b.time)

  // De-dupe instant moments within half a bar (two feature axes, one event) —
  // keep the stronger; never collapse a ranged lift.
  const out: Moment[] = []
  for (const m of moments) {
    const prev = out[out.length - 1]
    if (prev && m.type !== 'lift' && prev.type !== 'lift' && Math.abs(m.time - prev.time) < 0.5 * bar) {
      if (m.strength > prev.strength) out[out.length - 1] = m
    } else {
      out.push(m)
    }
  }
  return out
}
