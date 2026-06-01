/**
 * fps-invariance verification (CPU side, no Remotion, no render)
 * ──────────────────────────────────────────────────────────────
 * The pure half of `scripts/verify-fps.mjs`: it answers the headline guarantee
 * of plans/music-sync-beats.md and specs/music-sync.md — *"the same beat map
 * renders correctly at 24 / 30 / 60 fps, with no hardcoded fps in the helpers"*.
 *
 * Because beat-map times live in **seconds** and a frame is `round(t * fps)`, the
 * same song laid out at different frame rates must keep the *same musical
 * structure*: every scene cut lands on the **same downbeat** (same index into
 * `map.downbeats`), just sampled onto a different frame grid, and the whole
 * layout still spans exactly the song length. A frame rate that quietly shifted a
 * cut onto a different bar — or a helper that silently assumed 30fps — would be a
 * regression the per-fps layout tests don't catch on their own, because each fps
 * looks internally consistent in isolation. This module checks the three fps
 * *against each other*.
 *
 * Keeping the comparison here — plain numbers in, a verdict out — makes it
 * node-unit-testable without booting Remotion or rendering anything, the same
 * "keep the impure edge in the `.mjs`, test the math in `src/lib`" split the
 * audio-mux (`verifyAudioMux.ts`) and bundle-clean (`verifyBundleClean.ts`)
 * gates use. The optional live render at each fps stays in the `.mjs` shell.
 *
 * See ([spec: Music Sync (Beats)](../../specs/music-sync.md)),
 *     ([spec: Product Video](../../specs/product-video.md)).
 */
// Explicit `.ts` extensions: this module is loaded by `scripts/verify-fps.mjs`
// under raw Node (which type-strips but does not resolve extensionless relative
// imports), as well as by tsc/vitest/webpack (all of which accept them, with
// `allowImportingTsExtensions`). The runtime dep chain below must stay loadable
// by Node, so `beatScenes.ts` carries the same explicit extension on `./beatmap`.
import {
  planBeatScenes,
  transitionCenterFrames,
  type BeatSceneLayout,
  type CutSource,
} from './beatScenes.ts'
import { beatFrames, downbeatFrames, secondsToFrame, type BeatMap } from './beatmap.ts'

/** The frame rates the music-sync contract promises to be invariant across. */
export const DEFAULT_FPS_SET = [24, 30, 60] as const

/**
 * The actual rendered length of a `<TransitionSeries>`: `Σ scene durations −
 * (n−1)·T`. Must equal `totalFrames` for the composition to be the song's length.
 */
export function renderedLength(layout: BeatSceneLayout): number {
  const sumScenes = layout.scenes.reduce((a, s) => a + s.durationInFrames, 0)
  return sumScenes - layout.transitions.length * layout.transitionFrames
}

/** The source-event seconds a `cutOn` class draws cuts from (`[]` for `'even'`). */
function eventSecondsFor(map: BeatMap, cutOn: CutSource): number[] {
  if (cutOn === 'downbeat') return map.downbeats
  if (cutOn === 'beat') return map.beats
  return []
}

/** The source-event frames at `fps` for a `cutOn` class (`[]` for `'even'`). */
function eventFramesFor(map: BeatMap, cutOn: CutSource, fps: number): number[] {
  if (cutOn === 'downbeat') return downbeatFrames(map, fps)
  if (cutOn === 'beat') return beatFrames(map, fps)
  return []
}

/** Everything we learned by laying `map` out at one fps. */
export type FpsLayoutFacts = {
  fps: number
  /** `secondsToFrame(map.duration, fps)` — the composition's exact length. */
  totalFrames: number
  /** The rendered `<TransitionSeries>` length; must equal `totalFrames`. */
  renderedLength: number
  transitionFrames: number
  cutOn: CutSource
  cutFrames: number[]
  /**
   * For each cut, the index into the source-event list (`downbeats`/`beats`) it
   * sits on, or `-1` when the cut isn't on an event (the `'even'` fallback). This
   * is the *fps-independent* fingerprint of the layout: the same indices at every
   * fps means the cuts land on the same musical moments.
   */
  cutEventIndices: number[]
  /** Each cut's position as a fraction `0..1` of the song (fps-independent ≈). */
  cutFractions: number[]
}

/** Lay `map` out at `fps` and collect the facts a cross-fps check needs. */
export function fpsLayoutFacts(
  map: BeatMap,
  fps: number,
  sceneCount: number,
  transitionFrames?: number,
): FpsLayoutFacts {
  const layout = planBeatScenes(map, fps, { sceneCount, transitionFrames })
  const eventFrames = eventFramesFor(map, layout.cutOn, fps)
  const cutEventIndices = layout.cutFrames.map((c) => eventFrames.indexOf(c))
  const cutFractions = layout.cutFrames.map((c) =>
    layout.totalFrames > 0 ? c / layout.totalFrames : 0,
  )
  return {
    fps,
    totalFrames: layout.totalFrames,
    renderedLength: renderedLength(layout),
    transitionFrames: layout.transitionFrames,
    cutOn: layout.cutOn,
    cutFrames: layout.cutFrames,
    cutEventIndices,
    cutFractions,
  }
}

/** A self-consistency problem found within a single fps's layout. */
type PerFpsProblem = { fps: number; reason: string }

/**
 * Per-fps invariants that must hold *at every fps in isolation*: the composition
 * spans exactly the song length, the rendered length matches, and every cut sits
 * on a real source event at the frame `round(eventSeconds * fps)` would predict —
 * re-derived from seconds here (not from the layout) so a bug in the layout's
 * frame math can't hide behind itself.
 */
function perFpsProblems(map: BeatMap, facts: FpsLayoutFacts): PerFpsProblem[] {
  const problems: PerFpsProblem[] = []
  const expectedTotal = secondsToFrame(map.duration, facts.fps)
  if (facts.totalFrames !== expectedTotal) {
    problems.push({
      fps: facts.fps,
      reason: `totalFrames ${facts.totalFrames} ≠ round(${map.duration}·${facts.fps})=${expectedTotal}`,
    })
  }
  if (facts.renderedLength !== facts.totalFrames) {
    problems.push({
      fps: facts.fps,
      reason: `rendered length ${facts.renderedLength} ≠ totalFrames ${facts.totalFrames}`,
    })
  }
  const eventSeconds = eventSecondsFor(map, facts.cutOn)
  facts.cutFrames.forEach((cut, i) => {
    const idx = facts.cutEventIndices[i]
    if (facts.cutOn === 'even') return // no source event to anchor to
    if (idx < 0) {
      problems.push({ fps: facts.fps, reason: `cut ${cut} is not on a ${facts.cutOn}` })
      return
    }
    const expected = secondsToFrame(eventSeconds[idx], facts.fps)
    if (cut !== expected) {
      problems.push({
        fps: facts.fps,
        reason: `cut ${cut} ≠ round(${eventSeconds[idx]}·${facts.fps})=${expected}`,
      })
    }
  })
  return problems
}

/** Are two number arrays element-wise equal? */
function sameNumbers(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

/** Are two number arrays equal within `tol` element-wise? */
function closeNumbers(a: number[], b: number[], tol: number): boolean {
  return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= tol)
}

export type CrossFpsResult = { ok: boolean; reason: string }

/**
 * Compare a set of per-fps layouts *against each other* — the part the
 * single-fps layout tests can't see. All fps must agree on:
 *   1. the `cutOn` class (all on downbeats, or all on beats, or all even), and
 *   2. which musical events the cuts landed on — identical `cutEventIndices`, so
 *      the same downbeats carry the cuts at every frame rate. For the `'even'`
 *      fallback (no events to index) the cut *fractions* must instead agree
 *      within `fractionTolerance` (rounding to the coarsest grid aside).
 * Pure and independently testable with hand-built facts, so this check is proven
 * to actually reject a mismatch rather than rubber-stamp it.
 */
export function crossFpsConsistent(
  facts: FpsLayoutFacts[],
  fractionTolerance = 0.02,
): CrossFpsResult {
  if (facts.length < 2) {
    return { ok: true, reason: `only ${facts.length} fps — nothing to compare` }
  }

  const [ref, ...rest] = facts
  for (const f of rest) {
    if (f.cutOn !== ref.cutOn) {
      return {
        ok: false,
        reason: `cut class differs: ${ref.fps}fps cuts on ${ref.cutOn}, ${f.fps}fps on ${f.cutOn}`,
      }
    }
    if (f.cutFrames.length !== ref.cutFrames.length) {
      return {
        ok: false,
        reason: `cut count differs: ${ref.fps}fps has ${ref.cutFrames.length}, ${f.fps}fps has ${f.cutFrames.length}`,
      }
    }
    if (ref.cutOn === 'even') {
      if (!closeNumbers(ref.cutFractions, f.cutFractions, fractionTolerance)) {
        return {
          ok: false,
          reason: `even-split positions drift past ${fractionTolerance} between ${ref.fps}fps and ${f.fps}fps`,
        }
      }
    } else if (!sameNumbers(ref.cutEventIndices, f.cutEventIndices)) {
      return {
        ok: false,
        reason: `cuts land on different ${ref.cutOn}s: ${ref.fps}fps → [${ref.cutEventIndices}], ${f.fps}fps → [${f.cutEventIndices}]`,
      }
    }
  }
  return { ok: true, reason: `all ${facts.length} fps agree (cuts on ${ref.cutOn})` }
}

export type FpsInvarianceReport = {
  /** True only when every per-fps invariant holds AND all fps agree musically. */
  ok: boolean
  /** Human-readable verdict (printed by the CLI). */
  reason: string
  /** Per-fps facts, in the order requested. */
  facts: FpsLayoutFacts[]
  /** The shared musical cut indices when consistent, else `null`. */
  cutEventIndices: number[] | null
  /** The shared cut class when consistent, else `null`. */
  cutOn: CutSource | null
  /** Any per-fps self-consistency problems found. */
  problems: PerFpsProblem[]
}

/**
 * Lay `map` out for a `sceneCount`-scene tour at each fps in `fpsSet` and verify
 * the music-sync fps-invariance contract end to end: each fps is internally
 * consistent (spans the song, cuts on real events at the predicted frames) *and*
 * all the fps agree on the same musical cut structure. This is the verdict the
 * `verify:fps` gate prints; the optional real render at each fps lives in the
 * `.mjs` shell.
 */
export function fpsInvarianceReport(
  map: BeatMap,
  sceneCount: number,
  fpsSet: readonly number[] = DEFAULT_FPS_SET,
  transitionFrames?: number,
): FpsInvarianceReport {
  const facts = fpsSet.map((fps) => fpsLayoutFacts(map, fps, sceneCount, transitionFrames))
  const problems = facts.flatMap((f) => perFpsProblems(map, f))
  const cross = crossFpsConsistent(facts)

  if (problems.length > 0) {
    const first = problems[0]
    return {
      ok: false,
      reason: `per-fps invariant failed at ${first.fps}fps: ${first.reason}` +
        (problems.length > 1 ? ` (+${problems.length - 1} more)` : ''),
      facts,
      cutEventIndices: null,
      cutOn: null,
      problems,
    }
  }
  if (!cross.ok) {
    return { ok: false, reason: cross.reason, facts, cutEventIndices: null, cutOn: null, problems }
  }
  return {
    ok: true,
    reason: `${cross.reason} across ${fpsSet.join('/')}fps`,
    facts,
    cutEventIndices: facts[0]?.cutEventIndices ?? null,
    cutOn: facts[0]?.cutOn ?? null,
    problems,
  }
}

// Re-exported so the CLI can print the per-fps frame summaries alongside the verdict.
export { transitionCenterFrames }
