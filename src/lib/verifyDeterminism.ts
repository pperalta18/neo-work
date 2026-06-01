/**
 * Render-determinism verification (CPU side, no Remotion, no render)
 * ──────────────────────────────────────────────────────────────────
 * The pure half of `scripts/verify-determinism.mjs`: it answers the bedrock
 * "state in, frame out" guarantee of plans/music-sync-beats.md and
 * specs/{music-sync,product-video}.md — *"rendering ProductTour twice yields
 * byte-identical frames"*. The whole music-sync design leans on this: every
 * animation is derived from `useCurrentFrame()` and never from wall-clock time or
 * live audio analysis, so the same frame index must always rasterise to the same
 * pixels. If two renders of the same frame ever differed, parallel/distributed
 * rendering and the Studio-preview-matches-the-MP4 promise would both be unsafe.
 *
 * This module owns two pure, node-testable pieces, with the impure render kept in
 * the `.mjs` shell (the same split `verifyFps.ts` / `verifyAudioMux.ts` /
 * `verifyBundleClean.ts` use):
 *   1. {@link chooseSampleFrames} — *which* frames to re-render and compare,
 *      deterministically (endpoints + the musically interesting cut frames +
 *      even coverage). Sampling beats rendering every frame twice while still
 *      hitting the transition boundaries where non-determinism would most likely
 *      surface.
 *   2. {@link determinismReport} — given each sampled frame rendered twice and
 *      content-hashed, decide pass/fail. An EMPTY input fails (a determinism gate
 *      that compared nothing must not report success), and a single mismatch
 *      fails with the offending frame — so the gate is proven to detect drift, not
 *      rubber-stamp it.
 *
 * See ([spec: Music Sync (Beats)](../../specs/music-sync.md)),
 *     ([spec: Product Video](../../specs/product-video.md)).
 */

/**
 * Pick the composition frames a determinism check should render twice. The set
 * is deterministic and always covers:
 *   - the first frame (`0`) and the last frame (`totalFrames − 1`),
 *   - every `mustInclude` frame that is in range (the scene-cut frames — the
 *     spring/transition boundaries where drift is most likely), and
 *   - `count` evenly spaced frames spanning `[0, last]` for baseline coverage.
 * Returned sorted ascending and de-duplicated. `totalFrames ≤ 0` → `[]`.
 */
export function chooseSampleFrames(
  totalFrames: number,
  mustInclude: number[] = [],
  count = 8,
): number[] {
  if (!Number.isFinite(totalFrames) || totalFrames <= 0) return []
  const last = totalFrames - 1
  const n = Math.max(2, Math.floor(count))

  const even: number[] = []
  for (let i = 0; i < n; i++) {
    even.push(last === 0 ? 0 : Math.round((i / (n - 1)) * last))
  }
  const inRange = mustInclude.filter((f) => Number.isInteger(f) && f >= 0 && f <= last)

  return [...new Set([...even, ...inRange])].sort((a, b) => a - b)
}

/** A single frame rendered twice, each pass content-hashed (e.g. sha256 hex). */
export type FrameRenderPair = {
  frame: number
  /** Content hash of this frame from render pass A. */
  hashA: string
  /** Content hash of the SAME frame from an independent render pass B. */
  hashB: string
}

/** A frame whose two renders did not match. */
export type FrameDivergence = { frame: number; hashA: string; hashB: string }

export type DeterminismReport = {
  /** True only when ≥1 frame was compared AND every pair was byte-identical. */
  ok: boolean
  /** Human-readable verdict (printed by the CLI). */
  reason: string
  /** Number of frames compared. */
  total: number
  /** How many of them were byte-identical across the two passes. */
  identical: number
  /** The frames whose two renders differed (empty when deterministic). */
  divergences: FrameDivergence[]
}

/** First 8 hex chars of a hash, for compact divergence messages. */
function shortHash(hash: string): string {
  return typeof hash === 'string' ? hash.slice(0, 8) : String(hash)
}

/**
 * Decide whether two independent renders agree on every sampled frame. Pure:
 * same input → same verdict, no I/O. An empty `pairs` array is treated as a
 * FAILURE — a determinism check that rendered nothing has proven nothing, and we
 * never want that to read as a green light.
 */
export function determinismReport(pairs: FrameRenderPair[]): DeterminismReport {
  if (!Array.isArray(pairs) || pairs.length === 0) {
    return {
      ok: false,
      reason: 'no frames were rendered to compare — determinism is unproven',
      total: 0,
      identical: 0,
      divergences: [],
    }
  }

  const divergences = pairs
    .filter((p) => p.hashA !== p.hashB)
    .map((p) => ({ frame: p.frame, hashA: p.hashA, hashB: p.hashB }))
  const identical = pairs.length - divergences.length

  if (divergences.length > 0) {
    const first = divergences[0]
    return {
      ok: false,
      reason:
        `${divergences.length}/${pairs.length} sampled frame(s) differ between the two ` +
        `renders — first at frame ${first.frame} ` +
        `(${shortHash(first.hashA)} ≠ ${shortHash(first.hashB)})`,
      total: pairs.length,
      identical,
      divergences,
    }
  }

  return {
    ok: true,
    reason: `all ${pairs.length} sampled frame(s) byte-identical across two renders`,
    total: pairs.length,
    identical,
    divergences,
  }
}
