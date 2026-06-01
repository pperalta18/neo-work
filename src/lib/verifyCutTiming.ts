/**
 * Rendered-cut timing verification (CPU side, no ffmpeg, no I/O)
 * ──────────────────────────────────────────────────────────────
 * The pure half of `scripts/verify-cut-timing.mjs`. It answers the one piece of
 * the music-sync acceptance gate the other checks can't: *"do the scene cuts in
 * the **rendered pixels** actually land on the downbeats?"*
 *
 * `verify:fps` proves the cut *frames* equal `round(downbeatSeconds · fps)` from
 * the layout math, and `verify:tour-audio` proves the song is muxed in — but
 * neither looks at the video. A composition could compute the right cut frames
 * yet render the transition somewhere else (or drop it entirely) and both gates
 * would still pass. This module closes that loop: feed it a per-frame visual
 * **change signal** read off the actual MP4 (mean absolute inter-frame difference)
 * plus the downbeat cut frames the map predicts, and it decides whether the
 * transition energy is concentrated on those downbeats.
 *
 * Why an energy/concentration metric instead of "peak frame == cut frame": a
 * `<TransitionSeries>` transition spans `transitionFrames` *around* the cut, and
 * non-linear easing (spring timing is front-loaded) plus the incoming scene's
 * entrance settle shift the visual centroid several frames off the geometric cut.
 * So the honest, render-faithful claim is "a real transition occupies the window
 * around each downbeat, and almost all visual change happens in those windows" —
 * which is robust to easing curves and to transitions of very different strength
 * (a bold slide vs a soft fade).
 *
 * Keeping the verdict here — plain numbers in, a verdict out — makes it
 * node-unit-testable with synthetic signals (no ffmpeg, no render), the same
 * "impure edge in the `.mjs`, math in `src/lib`" split the other gates use
 * (`verifyAudioMux.ts`, `verifyFps.ts`, `verifyBundleClean.ts`).
 *
 * See ([spec: Music Sync (Beats)](../../specs/music-sync.md)),
 *     ([spec: Product Video](../../specs/product-video.md)).
 */

/**
 * Turn a stack of grayscale frames into a per-frame visual **change signal**:
 * `signal[f]` is the mean absolute difference between frame `f` and frame `f − 1`
 * (so `signal[0] = 0`). A static hold ≈ 0; a transition that repaints much of the
 * screen spikes. Pure: `Uint8Array` (one byte per pixel, frames concatenated) +
 * the pixel count per frame in, `number[]` out — no decoding, no I/O. The ffmpeg
 * `scale=…,format=gray → rawvideo` decode that produces the buffer lives in the
 * `.mjs` shell.
 */
export function changeSignalFromGray(
  buffer: Uint8Array | number[],
  pixelsPerFrame: number,
): number[] {
  if (!Number.isInteger(pixelsPerFrame) || pixelsPerFrame <= 0) {
    throw new Error(`pixelsPerFrame must be a positive integer, got ${pixelsPerFrame}`)
  }
  const frameCount = Math.floor(buffer.length / pixelsPerFrame)
  const signal = new Array<number>(Math.max(frameCount, 0)).fill(0)
  for (let f = 1; f < frameCount; f++) {
    const cur = f * pixelsPerFrame
    const prev = (f - 1) * pixelsPerFrame
    let sum = 0
    for (let i = 0; i < pixelsPerFrame; i++) {
      sum += Math.abs(buffer[cur + i] - buffer[prev + i])
    }
    signal[f] = sum / pixelsPerFrame
  }
  return signal
}

export type CutTimingConfig = {
  /**
   * Half-width (frames) of the window a transition is allowed to occupy around
   * its cut. A `<TransitionSeries>` transition spans `transitionFrames` centred on
   * the cut, so `transitionFrames` is the principled value (covers easing skew +
   * entrance bleed). Required.
   */
  windowRadius: number
  /**
   * Frames at the very start to ignore: the opening scene's entrance animation is
   * expected motion, not a scene-to-scene cut. Default `0`.
   */
  openingFrames?: number
  /** Min share of interior change-energy that must fall inside the cut windows. Default `0.6`. */
  minConcentration?: number
  /**
   * Min dynamic-range-normalised peak a change must reach to count as a scene
   * *transition*: `(peak − noiseFloor) / (maxChange − noiseFloor)`, in `0..1`. A
   * full scene-to-scene cut repaints most of the screen and lands near the top of
   * the range; the small deliberate beat *accents* the composition renders on
   * non-cut downbeats (e.g. a caption's `useBeatPulse` scale/glow) are far weaker
   * and must NOT register as transitions. Default `0.2` sits in the gap measured
   * on the reference tour (transitions ≈0.35–1.0, beat-pulse accents ≈0.13). Used
   * both to confirm each cut carries a transition and to flag stray ones.
   */
  minPeakProminence?: number
  /**
   * Max `|energy centroid − cut|` (frames) allowed within a window. Defaults to
   * `windowRadius` — easing can pull the visible centroid up to ~half a transition
   * off the geometric cut, so a full transition length is the honest tolerance.
   */
  centroidTolerance?: number
}

/** What we learned about one expected cut from the rendered change signal. */
export type CutFinding = {
  /** The expected cut frame (a downbeat). */
  cut: number
  /** Σ change over the cut's window. */
  windowEnergy: number
  /** Largest single-frame change in the window, and the frame it occurred on. */
  peak: number
  peakFrame: number
  /** `(peak − noiseFloor) / range`, clamped to `0..1`. */
  peakProminence: number
  /** Energy-weighted mean frame within the window (the visual centre of the cut). */
  centroid: number
  /** `|centroid − cut|`. */
  centroidOffset: number
  /** Does the window contain a transition (prominence ≥ threshold)? */
  hasTransition: boolean
  /** Is the centroid within `centroidTolerance` of the cut? */
  centroidOk: boolean
  /** `hasTransition && centroidOk`. */
  ok: boolean
}

export type CutTimingReport = {
  /** True only when energy is concentrated on the cuts, every cut carries a
   *  transition near its centre, and no stray transition appears elsewhere. */
  ok: boolean
  /** Human-readable verdict (printed by the CLI). */
  reason: string
  /** Share of interior change-energy inside the cut windows (`0..1`). */
  concentration: number
  /** Σ change over all interior frames (after the opening exclusion). */
  interiorEnergy: number
  /** Σ change inside the cut windows. */
  inWindowEnergy: number
  /** Robust scene-hold change level (median of out-of-window interior frames). */
  noiseFloor: number
  /** Largest interior single-frame change (the transition scale). */
  peakChange: number
  /** Per-cut findings, in the order of `expectedCuts`. */
  findings: CutFinding[]
  /** Largest interior change outside every window — an unexplained transition. */
  strayPeak: { frame: number; change: number; prominence: number } | null
}

/** Median of a numeric array (0 for empty). Does not mutate the input. */
function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

/**
 * Decide whether the rendered scene cuts land on the downbeats. Given the
 * per-frame `changes` signal (see {@link changeSignalFromGray}) and the
 * `expectedCuts` the beat map predicts, assert that:
 *   1. almost all interior change-energy falls within `windowRadius` of a cut
 *      (`concentration ≥ minConcentration`),
 *   2. every cut window contains a real transition (`peakProminence ≥
 *      minPeakProminence`) whose energy centroid is within `centroidTolerance`,
 *   3. no stray transition-scale change appears between the cuts.
 * The opening `openingFrames` are excluded (first-scene entrance, not a cut).
 * Pure: same inputs → same verdict, no I/O.
 */
export function analyzeCutTiming(
  changes: number[],
  expectedCuts: number[],
  config: CutTimingConfig,
): CutTimingReport {
  const {
    windowRadius,
    openingFrames = 0,
    minConcentration = 0.6,
    minPeakProminence = 0.2,
    centroidTolerance = windowRadius,
  } = config
  if (!(windowRadius >= 0)) throw new Error(`windowRadius must be ≥ 0, got ${windowRadius}`)

  const n = changes.length
  const cuts = [...expectedCuts].sort((a, b) => a - b)
  const inWindow = (f: number) => cuts.some((c) => Math.abs(f - c) <= windowRadius)

  // Interior = everything after the opening entrance.
  let interiorEnergy = 0
  let inWindowEnergy = 0
  let peakChange = 0
  const holdValues: number[] = [] // interior, out-of-window — the scene-hold floor
  for (let f = openingFrames; f < n; f++) {
    const c = changes[f]
    interiorEnergy += c
    if (c > peakChange) peakChange = c
    if (inWindow(f)) inWindowEnergy += c
    else holdValues.push(c)
  }
  const concentration = interiorEnergy > 0 ? inWindowEnergy / interiorEnergy : 0
  const noiseFloor = median(holdValues)
  const range = peakChange - noiseFloor
  const prominenceOf = (v: number) => (range > 0 ? clamp01((v - noiseFloor) / range) : 0)

  const findings: CutFinding[] = cuts.map((cut) => {
    const lo = Math.max(0, cut - windowRadius)
    const hi = Math.min(n - 1, cut + windowRadius)
    let windowEnergy = 0
    let weighted = 0
    let peak = 0
    let peakFrame = cut
    for (let f = lo; f <= hi; f++) {
      const c = changes[f]
      windowEnergy += c
      weighted += f * c
      if (c > peak) {
        peak = c
        peakFrame = f
      }
    }
    const centroid = windowEnergy > 0 ? weighted / windowEnergy : cut
    const centroidOffset = Math.abs(centroid - cut)
    const peakProminence = prominenceOf(peak)
    const hasTransition = peakProminence >= minPeakProminence
    const centroidOk = centroidOffset <= centroidTolerance
    return {
      cut,
      windowEnergy,
      peak,
      peakFrame,
      peakProminence,
      centroid,
      centroidOffset,
      hasTransition,
      centroidOk,
      ok: hasTransition && centroidOk,
    }
  })

  // Stray transition: the strongest interior frame that's in NO cut window.
  let strayPeak: CutTimingReport['strayPeak'] = null
  for (let f = openingFrames; f < n; f++) {
    if (inWindow(f)) continue
    if (strayPeak === null || changes[f] > strayPeak.change) {
      strayPeak = { frame: f, change: changes[f], prominence: prominenceOf(changes[f]) }
    }
  }
  const strayIsTransition = strayPeak !== null && strayPeak.prominence >= minPeakProminence

  // Compose the verdict.
  const concentrationOk = concentration >= minConcentration
  const failed = findings.filter((f) => !f.ok)
  const ok = concentrationOk && failed.length === 0 && !strayIsTransition

  let reason: string
  if (!concentrationOk) {
    reason =
      `only ${(concentration * 100).toFixed(1)}% of transition energy lands on the ` +
      `${cuts.length} downbeat cut(s) (need ${(minConcentration * 100).toFixed(0)}%) — ` +
      `the rendered cuts are not on the downbeats`
  } else if (failed.length > 0) {
    const f = failed[0]
    reason = !f.hasTransition
      ? `no transition rendered at downbeat cut ${f.cut} (prominence ${f.peakProminence.toFixed(2)} < ${minPeakProminence})`
      : `transition near cut ${f.cut} is off-centre by ${f.centroidOffset.toFixed(1)}f (> ${centroidTolerance})`
  } else if (strayIsTransition && strayPeak) {
    reason =
      `an unexplained transition (prominence ${strayPeak.prominence.toFixed(2)}) renders at ` +
      `frame ${strayPeak.frame}, not on any downbeat cut`
  } else {
    const weakest = findings.reduce((a, b) => (a.peakProminence <= b.peakProminence ? a : b))
    reason =
      `cuts on downbeats confirmed in the render: ${(concentration * 100).toFixed(1)}% of ` +
      `transition energy at cuts [${cuts.join(', ')}]; weakest cut prominence ` +
      `${weakest.peakProminence.toFixed(2)} (window ±${windowRadius}f)`
  }

  return {
    ok,
    reason,
    concentration,
    interiorEnergy,
    inWindowEnergy,
    noiseFloor,
    peakChange,
    findings,
    strayPeak,
  }
}
