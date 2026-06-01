/**
 * Beat-driven scene layout (CPU side, no React, no audio)
 * ───────────────────────────────────────────────────────
 * Lays a fixed number of scenes onto a song's bar grid so a Remotion
 * `<TransitionSeries>` cuts *on the music*: every scene-to-scene transition is
 * centred on a **downbeat** (a bar start — the big accent), and the whole layout
 * spans exactly the song duration so the composition length stays in lockstep
 * with the track.
 *
 * This is the pure half of the beat-driven `ProductTour` (see
 * `src/remotion/ProductTourVideo.tsx`). Keeping the math here — plain numbers, no
 * Remotion, no React — makes the "transitions land on downbeats / total stays
 * exact" contract unit-testable in node, the same split the rest of the catalog
 * uses (`beatmap.ts`).
 *
 * The geometry: a `<TransitionSeries>` with sequence durations `d₀…dₙ₋₁` and
 * uniform transition length `T` plays for `Σdᵢ − (n−1)·T` frames, and the centre
 * of transition `i` (the visual cut) lands at `Σ_{k≤i} dₖ − Σ_{k<i} T − T/2`.
 * Solving "centre of transition i == cut frame cᵢ" with a uniform, even `T` gives
 * the closed form in {@link planBeatScenes}; integer cut frames + even `T` keep
 * every duration an integer.
 *
 * See ([spec: Music Sync (Beats)](../../specs/music-sync.md)),
 *     ([spec: Product Video](../../specs/product-video.md)).
 */
// Explicit `.ts` extension so this module also loads under raw Node (via
// `scripts/verify-fps.mjs` → `verifyFps.ts`), which type-strips but won't resolve
// an extensionless relative import; tsc/vitest/webpack accept it unchanged.
import { beatFrames, downbeatFrames, secondsToFrame, type BeatMap } from './beatmap.ts'

/** Which class of musical event the scene cuts landed on. */
export type CutSource = 'downbeat' | 'beat' | 'even'

/** One scene's slot in a {@link BeatSceneLayout}. */
export type BeatSceneSlot = {
  /**
   * Absolute composition frame this scene's `<TransitionSeries.Sequence>` starts
   * on (matches Remotion's internal `from`: `Σ_{k<i} dₖ − i·T`). Add the
   * sequence-local `useCurrentFrame()` to it to recover the absolute frame for
   * beat-synced motion inside the sequence.
   */
  fromFrame: number
  /** The `durationInFrames` to pass to this scene's `<TransitionSeries.Sequence>`. */
  durationInFrames: number
  /** Bars (downbeats) that fall within this scene's nominal `[from, from+dur)` window. */
  bars: number
}

/** One transition between two scenes. */
export type BeatSceneTransition = {
  /** Frame the transition is centred on — a downbeat (or fallback) cut. */
  atFrame: number
  /** Transition length in frames (uniform across the layout). */
  durationInFrames: number
}

/** The full beat-driven layout returned by {@link planBeatScenes}. */
export type BeatSceneLayout = {
  /** Exact composition length: `secondsToFrame(map.duration, fps)`. */
  totalFrames: number
  /** The fps the layout was computed at (cut frames are fps-dependent). */
  fps: number
  /** Uniform transition length used, frames (always even, ≥ 2). */
  transitionFrames: number
  /** Which event class the cuts landed on (downbeats unless the map is too sparse). */
  cutOn: CutSource
  /** The interior cut frames, ascending, length `sceneCount − 1`. */
  cutFrames: number[]
  /** Per-scene slots, length `sceneCount`. */
  scenes: BeatSceneSlot[]
  /** Per-cut transitions, length `sceneCount − 1`. */
  transitions: BeatSceneTransition[]
}

export type PlanBeatScenesOptions = {
  /** How many scenes to lay out (≥ 1). */
  sceneCount: number
  /**
   * Transition length in frames. Rounded up to the nearest even number (so the
   * cut sits on a whole frame) and clamped to ≥ 2. Defaults to roughly one beat,
   * so a transition lasts about a beat.
   */
  transitionFrames?: number
}

/** Round up to the nearest even integer (so `T / 2` is a whole frame). */
function toEven(n: number): number {
  const r = Math.round(n)
  return r % 2 === 0 ? r : r + 1
}

/** The typical beat length in frames — the median beat gap, or the BPM grid. */
function beatIntervalFrames(map: BeatMap, fps: number): number {
  const bf = beatFrames(map, fps)
  if (bf.length >= 2) {
    const gaps: number[] = []
    for (let i = 1; i < bf.length; i++) gaps.push(bf[i] - bf[i - 1])
    gaps.sort((a, b) => a - b)
    return gaps[Math.floor(gaps.length / 2)]
  }
  return Math.round((60 / map.bpm) * fps)
}

/** Downbeats within `[from, to)`, used to report each scene's bar count. */
function countBars(map: BeatMap, fps: number, from: number, to: number): number {
  return downbeatFrames(map, fps).filter((f) => f >= from && f < to).length
}

/**
 * Pick `sceneCount − 1` cut frames from `events` (deduped, sorted ascending),
 * one near each even fraction `i / sceneCount` of the song, kept strictly
 * increasing and inside `[half, total − half]` (so neither edge scene is shorter
 * than the transition). Returns `null` when there aren't enough usable events.
 */
function chooseCutsFromEvents(
  events: number[],
  sceneCount: number,
  totalFrames: number,
  half: number,
): number[] | null {
  const valid = [...new Set(events.filter((f) => f >= half && f <= totalFrames - half))].sort(
    (a, b) => a - b,
  )
  const need = sceneCount - 1
  if (valid.length < need) return null

  const cuts: number[] = []
  let lastIdx = -1
  for (let i = 1; i <= need; i++) {
    const ideal = (i / sceneCount) * totalFrames
    // Leave at least `need - i` candidates after the one we pick for the rest.
    const maxIdx = valid.length - 1 - (need - i)
    let bestIdx = -1
    let bestDist = Infinity
    for (let j = lastIdx + 1; j <= maxIdx; j++) {
      const dist = Math.abs(valid[j] - ideal)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = j
      }
    }
    if (bestIdx === -1) return null
    cuts.push(valid[bestIdx])
    lastIdx = bestIdx
  }
  return cuts
}

/** Evenly spaced fallback cuts, clamped + nudged to stay strictly increasing. */
function evenCuts(sceneCount: number, totalFrames: number, half: number): number[] {
  const need = sceneCount - 1
  const cuts: number[] = []
  for (let i = 1; i <= need; i++) {
    let c = Math.round((i / sceneCount) * totalFrames)
    const lo = half + (i - 1)
    const hi = totalFrames - half - (need - i)
    c = Math.min(Math.max(c, lo), hi)
    if (cuts.length > 0 && c <= cuts[cuts.length - 1]) c = cuts[cuts.length - 1] + 1
    cuts.push(c)
  }
  return cuts
}

/** Cuts on downbeats if possible, else beats, else an even split. */
function chooseCuts(
  map: BeatMap,
  fps: number,
  sceneCount: number,
  totalFrames: number,
  half: number,
): { cuts: number[]; cutOn: CutSource } {
  const onDownbeats = chooseCutsFromEvents(downbeatFrames(map, fps), sceneCount, totalFrames, half)
  if (onDownbeats) return { cuts: onDownbeats, cutOn: 'downbeat' }

  const onBeats = chooseCutsFromEvents(beatFrames(map, fps), sceneCount, totalFrames, half)
  if (onBeats) return { cuts: onBeats, cutOn: 'beat' }

  return { cuts: evenCuts(sceneCount, totalFrames, half), cutOn: 'even' }
}

/**
 * Lay `sceneCount` scenes onto `map`'s bar grid at `fps`. Every transition is
 * centred on a downbeat (falling back to beats, then an even split, only when the
 * map is too sparse to carry the cuts), and the returned sequence/transition
 * durations sum to exactly `secondsToFrame(map.duration, fps)` so the Remotion
 * composition is precisely the song's length. Pure: same inputs → same layout.
 */
export function planBeatScenes(
  map: BeatMap,
  fps: number,
  options: PlanBeatScenesOptions,
): BeatSceneLayout {
  const { sceneCount } = options
  if (sceneCount < 1) throw new Error(`sceneCount must be >= 1, got ${sceneCount}`)

  const totalFrames = secondsToFrame(map.duration, fps)
  const transitionFrames = Math.max(
    2,
    toEven(options.transitionFrames ?? beatIntervalFrames(map, fps)),
  )
  const T = transitionFrames
  const half = T / 2

  // One scene: the whole song, no cuts.
  if (sceneCount === 1) {
    return {
      totalFrames,
      fps,
      transitionFrames: T,
      cutOn: 'downbeat',
      cutFrames: [],
      scenes: [{ fromFrame: 0, durationInFrames: totalFrames, bars: countBars(map, fps, 0, totalFrames) }],
      transitions: [],
    }
  }

  const { cuts, cutOn } = chooseCuts(map, fps, sceneCount, totalFrames, half)
  const need = sceneCount - 1

  // Closed form (see header): centre of transition i lands exactly on cuts[i].
  const durations: number[] = []
  durations.push(cuts[0] + half) // d₀
  for (let i = 1; i <= need - 1; i++) durations.push(cuts[i] - cuts[i - 1] + T) // interior dᵢ
  durations.push(totalFrames - cuts[need - 1] + half) // d_{n-1}

  // fromFrame for scene i is Σ_{k<i} dₖ − i·T (Remotion's TransitionSeries offset).
  // `bars` counts downbeats in the cut-bounded, non-overlapping window
  // `[cut_{i-1}, cut_i)` (0 / totalFrames at the ends) — a clean partition, so
  // the per-scene bar counts sum to the song's downbeats.
  const scenes: BeatSceneSlot[] = []
  let prefix = 0
  for (let i = 0; i < sceneCount; i++) {
    const fromFrame = prefix - i * T
    const durationInFrames = durations[i]
    const barStart = i === 0 ? 0 : cuts[i - 1]
    const barEnd = i === sceneCount - 1 ? totalFrames : cuts[i]
    scenes.push({
      fromFrame,
      durationInFrames,
      bars: countBars(map, fps, barStart, barEnd),
    })
    prefix += durationInFrames
  }

  const transitions: BeatSceneTransition[] = cuts.map((atFrame) => ({
    atFrame,
    durationInFrames: T,
  }))

  return { totalFrames, fps, transitionFrames: T, cutOn, cutFrames: cuts, scenes, transitions }
}

/**
 * The centre frame of transition `i` as Remotion will actually render it, from a
 * layout's sequence/transition durations — used by tests to assert the cut lands
 * on its downbeat. Mirrors `Σ_{k≤i} dₖ − Σ_{k<i} T − T/2`.
 */
export function transitionCenterFrames(layout: BeatSceneLayout): number[] {
  const { scenes, transitionFrames: T } = layout
  const centers: number[] = []
  let prefix = 0
  for (let i = 0; i < layout.transitions.length; i++) {
    prefix += scenes[i].durationInFrames
    centers.push(prefix - i * T - T / 2)
  }
  return centers
}
